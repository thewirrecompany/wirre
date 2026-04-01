import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import { prefetchCompanyDashboard } from "@/hooks/queries/useCompanyDashboard";
import { prefetchCandidateProfile } from "@/hooks/queries/useCandidateProfile";
import { prefetchCandidateRounds } from "@/hooks/queries/useCandidateRounds";
import { prefetchOpportunities } from "@/hooks/queries/useOpportunities";
import { prefetchLeaderboard } from "@/hooks/queries/useLeaderboard";

const publicNavLinks = [
  { href: "/get-involved", label: "Get Involved" },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const dashboardLink = (profile?.role as string) === 'superadmin'
    ? '/superadmin/dashboard'
    : profile?.role === 'admin'
      ? '/admin/dashboard'
      : profile?.role === 'company'
        ? '/company/dashboard'
        : '/candidate/dashboard';

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/');
  };

  /** Called on mouseenter of a nav link — starts the data fetch before the click */
  const handlePrefetch = (path: string) => {
    if (!profile?.id) return;
    if (path === '/company/dashboard') prefetchCompanyDashboard(profile.id);
    else if (path === '/candidate/dashboard') prefetchCandidateProfile(profile.id);
    else if (path === '/candidate/rounds') prefetchCandidateRounds(profile.id);
    else if (path === '/candidate/opportunities') prefetchOpportunities(profile.id);
    else if (path === '/leaderboard') prefetchLeaderboard();
  };

  const NavLink = ({ to, label, onClick }: { to: string, label: string, onClick?: () => void }) => (
    <Link
      to={to}
      onMouseEnter={() => handlePrefetch(to)}
      onClick={() => {
        setOpen(false);
        if (onClick) onClick();
      }}
      className={cn(
        "text-sm font-mono uppercase tracking-wider transition-colors hover:text-foreground",
        location.pathname === to ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {label}
    </Link>
  );

  const Separator = () => (
    <span className="text-border/50 hidden lg:inline font-light">|</span>
  );

  const NavItems = () => (
    <>
      {!user && publicNavLinks.map((link) => (
        <span key={link.href} className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <NavLink to={link.href} label={link.label} />
        </span>
      ))}

      {!user && <Separator />}

      {user ? (
        <>
          <NavLink to={dashboardLink} label="Dashboard" />
          <Separator />
          <NavLink to="/leaderboard" label="Leaderboard" />

          {/* Admin Profile link (shown to admins) */}
          {profile?.role === 'admin' && (
            <>
              <Separator />
              <NavLink to="/admin/profile" label="Profile" />
            </>
          )}

          {profile?.role === 'candidate' && (
            <>
              <Separator />
              <NavLink to="/candidate/rounds" label="My Rounds" />
              <Separator />
              <NavLink to="/candidate/opportunities" label="Opportunities" />
            </>
          )}

          {profile?.role === 'company' && (
            <>
              <Separator />
              <NavLink to="/company/profile" label="Profile" />
            </>
          )}

          <Separator />
          <button
            onClick={handleSignOut}
            className="font-mono uppercase text-sm tracking-wider text-muted-foreground hover:text-foreground transition-colors text-left"
          >
            Logout
          </button>
        </>
      ) : (
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
          <NavLink to="/signup" label="Sign Up" />
          <Separator />
          <NavLink to="/login" label="Login" />
        </div>
      )}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex w-full h-14 items-center justify-between px-4 lg:px-8 xl:px-12">
        <div className="flex items-center gap-1.5 lg:gap-4">
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
              <ArrowLeft className="h-4 w-4 lg:mr-2" />
              <span className="hidden lg:inline">Back</span>
            </Button>
          )}
          <Link to="/" className="font-mono text-lg font-bold tracking-widest">WIRRE</Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
          <NavItems />
        </nav>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="text-left mb-8">
                <SheetTitle className="font-mono tracking-widest text-lg">WIRRE</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4">
                <NavItems />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}