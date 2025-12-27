import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const publicNavLinks = [
  { href: "/platform", label: "Platform" },
  { href: "/about", label: "About" },
  { href: "/get-involved", label: "Get Involved" },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadForAdmin() {
      const { data, error } = await supabase
        .from('assessment_notifications')
        .select('*')
        .eq('recipient_role', 'admin')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading admin notifications:', error);
        return;
      }

      if (!mounted) return;

      const items = (data || []).map((n: any) => ({
        id: n.id,
        title: n.message || 'Notification',
        description: (n.payload && (n.payload.title || n.payload.github_repo)) || '',
        created_at: n.created_at,
        read: Array.isArray(n.read_by) && profile?.id ? n.read_by.includes(profile.id) : false,
        type: 'notification',
      }));

      setNotifications(items);
      setHasUnread(items.some((i: any) => !i.read));
    }

    if (profile?.role === 'admin') {
      loadForAdmin();
    } else if (profile?.role) {
      // Do not persist notifications in localStorage to avoid exposing data via Inspect Element
      setNotifications([]);
      setHasUnread(false);
    }

    return () => { mounted = false; };
  }, [profile?.role]);

  const markAsRead = (notificationId: any) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
    setHasUnread(false);

    // persist per-admin read status to DB
    (async () => {
      try {
        if (!profile?.id) return;
        // fetch current read_by array
        const { data } = await supabase.from('assessment_notifications').select('read_by').eq('id', notificationId).single();
        const current = (data?.read_by && Array.isArray(data.read_by)) ? data.read_by : [];
        if (!current.includes(profile.id)) {
          const updated = [...current, profile.id];
          await supabase.from('assessment_notifications').update({ read_by: updated }).eq('id', notificationId);
        }
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    })();
  };

  const dashboardLink = profile?.role === 'superadmin'
    ? '/superadmin/dashboard'
    : profile?.role === 'admin'
    ? '/admin/dashboard'
    : profile?.role === 'company'
    ? '/company/dashboard'
    : '/candidate/dashboard';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          {location.pathname !== '/' && (
            <Button variant="ghost" size="sm" onClick={() => {
              // try to navigate back; fallback to home
              try {
                navigate(-1);
              } catch {
                navigate('/');
              }
            }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <Link to="/" className="font-mono text-lg font-bold tracking-widest">WIRRE</Link>
        </div>

        <nav className="flex items-center gap-8">
          {!user && publicNavLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground",
                location.pathname === link.href ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <>
              <Link
                to={dashboardLink}
                className={cn(
                  "text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground",
                  location.pathname === dashboardLink ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Dashboard
              </Link>

              {/* Admin Profile link (shown to admins) */}
              {profile?.role === 'admin' && (
                <Link
                  to="/admin/profile"
                  className={cn(
                    "text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground",
                    location.pathname === '/admin/profile' ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Profile
                </Link>
              )}

              {profile?.role === 'candidate' && (
                <>
                  <Link to="/candidate/rounds" className={cn("text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground", location.pathname === '/candidate/rounds' ? "text-foreground" : "text-muted-foreground")}>My Rounds</Link>
                  <Link to="/candidate/opportunities" className={cn("text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground", location.pathname === '/candidate/opportunities' ? "text-foreground" : "text-muted-foreground")}>Opportunities</Link>
                </>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {hasUnread && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-white" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="px-4 py-2 border-b">
                    <p className="font-mono text-sm font-semibold">Notifications</p>
                  </div>
                  {notifications.length === 0 && (
                    <DropdownMenuItem>
                      <span className="text-xs text-muted-foreground">No notifications</span>
                    </DropdownMenuItem>
                  )}

                  {notifications.map((n) => (
                    <DropdownMenuItem 
                      key={n.id} 
                      onClick={() => { 
                        markAsRead(n.id); 
                        if (profile?.role === 'admin' && n.type === 'assessment') {
                          navigate(`/admin/assessment/${n.id}`);
                        }
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{n.title}</span>
                        <span className="text-xs text-muted-foreground">{n.description}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                size="sm" 
                className="font-mono uppercase text-sm"
              >
                Logout
              </Button>
            </>
          ) : (
            <Link
              to="/login"
              className={cn(
                "text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground",
                location.pathname === '/login' ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}