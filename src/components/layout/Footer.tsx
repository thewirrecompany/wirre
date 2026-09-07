import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { Button } from "@/components/ui/button";

export function Footer() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Build footer links conditionally — hide Login & Signup when already logged in
  const footerLinks = [
    { href: "/tnc", label: "Terms & Conditions" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/refund-policy", label: "Refund Policy" },
    ...(!user ? [
      { href: "/login", label: "Login" },
      { href: "/signup", label: "Signup" },
    ] : []),
  ];

  return (
    <footer className="border-t border-border py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <span className="font-mono text-sm font-bold tracking-widest">WIRRE</span>
            <p className="mt-2 text-sm text-muted-foreground font-mono">
              Compete in Commits.
            </p>
          </div>

          <nav className="flex flex-wrap gap-6 items-center">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom row — no divider line */}
        <div className="mt-8 flex flex-col md:flex-row justify-between gap-8">
          {/* Left Side: Copyright & Socials */}
          <div className="flex flex-col gap-4 flex-1 justify-center">
            <p className="text-xs text-muted-foreground font-mono">
              © 2026 WIRRE. All rights reserved.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <a
                href="mailto:thewirrecompany@gmail.com"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </a>
              <a
                href="https://www.linkedin.com/company/wirre/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            </div>
          </div>

          {/* User Actions — no vertical separator bar, no top border */}
          <div className="flex md:items-stretch gap-8 mt-4 md:mt-0">
            <div className="flex flex-col gap-1 items-start md:items-end justify-center">
              {user && (
                <>
                  <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-mono uppercase text-xs tracking-widest h-8 justify-start md:justify-end px-0 hover:bg-transparent hover:text-primary"
                    onClick={() => setShowOnboarding(true)}
                  >
                    Show Guide
                  </Button>
                </>
              )}
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="font-mono uppercase text-xs tracking-widest h-8 justify-start md:justify-end px-0 hover:bg-transparent hover:text-primary"
              >
                <Link to="/feedback">Give Feedback</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
