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

  const NavLink = ({ to, label, onClick }: { to: string, label: string, onClick?: () => void }) => (
    <Link
      to={to}
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

  const NavItems = () => (
    <>
      {!user && publicNavLinks.map((link) => (
        <NavLink key={link.href} to={link.href} label={link.label} />
      ))}

      {!user && <span className="mx-1 text-muted-foreground/50 hidden md:inline">|</span>}

      {user ? (
        <>
          <NavLink to={dashboardLink} label="Dashboard" />

          {/* Admin Profile link (shown to admins) */}
          {profile?.role === 'admin' && (
            <NavLink to="/admin/profile" label="Profile" />
          )}

          {profile?.role === 'candidate' && (
            <>
              <NavLink to="/candidate/rounds" label="My Rounds" />
              <NavLink to="/candidate/opportunities" label="Opportunities" />
            </>
          )}

          {profile?.role === 'company' && (
            <NavLink to="/company/profile" label="Profile" />
          )}

          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="font-mono uppercase text-sm justify-start px-0 md:justify-center md:px-4"
          >
            Logout
          </Button>
        </>
      ) : (
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <NavLink to="/waitlist" label="Join Waitlist" />
          <span className="text-muted-foreground/30 hidden md:inline">|</span>
          <NavLink to="/login" label="Login" />
        </div>
      )}
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
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

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          <NavItems />
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
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