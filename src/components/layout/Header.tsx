import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

const publicNavLinks = [
  { href: "/get-involved", label: "Get Involved" },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();


  const dashboardLink = (profile?.role as string) === 'superadmin'
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
      <div className="container flex h-14 items-center justify-between px-2 md:px-6">
        <div className="flex items-center gap-1.5 md:gap-4">
          {location.pathname !== '/' && (
            <Button variant="ghost" size="sm" onClick={() => {
              // Hierarchical navigation
              if (location.pathname.includes('/company/assessments/') && location.pathname.includes('/edit')) {
                // From edit page -> assessment detail
                const assessmentId = location.pathname.split('/')[3];
                navigate(`/company/assessments/${assessmentId}`);
              } else if (location.pathname.includes('/company/assessments/')) {
                // From assessment detail -> company dashboard
                navigate('/company/dashboard');
              } else if (location.pathname === '/company/dashboard') {
                // From company dashboard -> home
                navigate('/');
              } else if (location.pathname === '/candidate/dashboard') {
                // From candidate dashboard -> home
                navigate('/');
              } else if (location.pathname === '/admin/dashboard') {
                // From admin dashboard -> home
                navigate('/');
              } else if (location.pathname.includes('/admin/')) {
                // From any admin page -> admin dashboard
                navigate('/admin/dashboard');
              } else if (location.pathname.includes('/candidate/')) {
                // From any candidate page -> candidate dashboard
                navigate('/candidate/dashboard');
              } else if (location.pathname.includes('/company/')) {
                // From any company page -> company dashboard
                navigate('/company/dashboard');
              } else {
                // Default -> home
                navigate('/');
              }
            }}>
              <ArrowLeft className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Back</span>
            </Button>
          )}
          <Link to="/" className="font-mono text-lg font-bold tracking-widest">WIRRE</Link>
        </div>

        <nav className="flex items-center gap-2 md:gap-8">
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


          {!user && <span className="mx-1 text-muted-foreground/50">|</span>}

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

              {profile?.role === 'company' && (
                <Link
                  to="/company/profile"
                  className={cn(
                    "text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground",
                    location.pathname === '/company/profile' ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Profile
                </Link>
              )}



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
            <div className="flex items-center gap-4">
              <Link
                to="/waitlist"
                className={cn(
                  "text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground",
                  location.pathname === '/waitlist' ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Join Waitlist
              </Link>
              <span className="text-muted-foreground/30">|</span>
              <Link
                to="/login"
                className={cn(
                  "text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground",
                  location.pathname === '/login' ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Login
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}