import { Link } from "react-router-dom";

const footerLinks = [
  { href: "/platform", label: "Platform" },
  { href: "/about", label: "About" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Signup" },
];

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <span className="font-mono text-sm font-bold tracking-widest">WIRRE</span>
            <p className="mt-2 text-sm text-muted-foreground font-mono">
              Hiring is infrastructure.
            </p>
          </div>
          
          <nav className="flex flex-wrap gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground font-mono">
            © 2024 WIRRE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
