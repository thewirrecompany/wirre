import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const dashboardLink = profile?.role === 'company' 
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
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                      3
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="px-4 py-2 border-b">
                    <p className="font-mono text-sm font-semibold">Notifications</p>
                  </div>
                  <DropdownMenuItem className="font-mono text-xs py-3 cursor-pointer">
                    <div>
                      <p className="font-semibold">Round results available</p>
                      <p className="text-muted-foreground">Your Frontend Assessment results are ready</p>
                    </div>
                  </DropdownMenuItem>
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
