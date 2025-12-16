import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
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

const candidateNotifications = [
  { id: 1, title: "Round results available", description: "Your Frontend Assessment results are ready", read: false },
  { id: 2, title: "Report generated", description: "Capability report is now available", read: false },
  { id: 3, title: "New round invitation", description: "You've been invited to Backend Assessment", read: true },
];

const companyNotifications = [
  { id: 1, title: "New candidate registered", description: "5 new candidates for Senior Backend Engineer role", read: false },
  { id: 2, title: "PR submission received", description: "Candidate #A7B2 submitted PR for Platform Engineer", read: false },
  { id: 3, title: "Assessment deadline approaching", description: "Backend Engineer round closes in 24 hours", read: true },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  
  // Load notifications from localStorage or use defaults based on role
  const [notifications, setNotifications] = useState(() => {
    const storageKey = `notifications_${profile?.role || 'guest'}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) return JSON.parse(stored);
    
    return profile?.role === 'company' ? companyNotifications : candidateNotifications;
  });

  const hasUnread = notifications.some(n => !n.read);

  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    if (profile?.role) {
      const storageKey = `notifications_${profile.role}`;
      localStorage.setItem(storageKey, JSON.stringify(notifications));
    }
  }, [notifications, profile?.role]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const dashboardLink = profile?.role === 'admin'
    ? '/admin/dashboard'
    : profile?.role === 'company' 
    ? '/company/dashboard' 
    : '/candidate/dashboard';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="font-mono text-lg font-bold tracking-widest">
          WIRRE
        </Link>
        
        <nav className="flex items-center gap-8">
          {!user && publicNavLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground",
                location.pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
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
                  location.pathname === dashboardLink
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                Dashboard
              </Link>
              {profile?.role === 'candidate' && (
                <>
                  <Link
                    to="/candidate/rounds"
                    className={cn(
                      "text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground",
                      location.pathname === '/candidate/rounds'
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    My Rounds
                  </Link>
                  <Link
                    to="/candidate/opportunities"
                    className={cn(
                      "text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground",
                      location.pathname === '/candidate/opportunities'
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    Opportunities
                  </Link>
                </>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {hasUnread && (
                      <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-white" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="px-4 py-2 border-b">
                    <p className="font-mono text-sm font-semibold">Notifications</p>
                  </div>
                  {notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      className={cn(
                        "font-mono text-xs py-3 cursor-pointer",
                        !notification.read && "bg-muted/50"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex gap-2 w-full">
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-white mt-1 flex-shrink-0" />
                        )}
                        <div className={!notification.read ? "" : "ml-4"}>
                          <p className="font-semibold">{notification.title}</p>
                          <p className="text-muted-foreground">{notification.description}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  
                  <DropdownMenuItem className="font-mono text-xs py-3 cursor-pointer">
                    <div>
                      <p className="font-semibold">Report generated</p>
                      <p className="text-muted-foreground">Capability report is now available</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="font-mono text-xs py-3 cursor-pointer">
                    <div>
                      <p className="font-semibold">New round invitation</p>
                      <p className="text-muted-foreground">You've been invited to Backend Assessment</p>
                    </div>
                  </DropdownMenuItem>
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
                location.pathname === '/login'
                  ? "text-foreground"
                  : "text-muted-foreground"
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
