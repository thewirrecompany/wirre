import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function GetInvolved() {
  return (
    <Layout>
      <section className="py-24 border-b border-border">
        <div className="container">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-4">
            Get Involved
          </p>
          <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight">
            Build the future of technical hiring
          </h1>
          <p className="mt-6 max-w-2xl text-muted-foreground font-mono leading-relaxed">
            WIRRE is redefining how engineering teams evaluate talent. 
            We're looking for partners and contributors who share our vision.
          </p>
        </div>
      </section>

      {/* For Contributors */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold font-mono mb-6">For Contributors</h2>
            <p className="text-muted-foreground font-mono leading-relaxed mb-8">
              Want to contribute to WIRRE's development? We welcome engineers, 
              designers, and technical writers who want to help build the future 
              of engineering evaluation.
            </p>
            
            <div className="space-y-6 mb-12">
              <div>
                <h3 className="font-mono font-bold mb-2">Open Source Development</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Help us build the platform, improve our evaluation algorithms, or 
                  contribute to our assessment templates and tooling.
                </p>
              </div>
              
              <div>
                <h3 className="font-mono font-bold mb-2">Documentation & Content</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Create guides, tutorials, and documentation to help others use 
                  WIRRE effectively. Share your expertise in technical writing.
                </p>
              </div>
              
              <div>
                <h3 className="font-mono font-bold mb-2">Community Building</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Help us build a community around better engineering evaluation. 
                  Organize events, create content, or support other contributors.
                </p>
              </div>
            </div>

            <Button size="lg" asChild>
              <Link to="/waitlist">
                Join Waitlist as Contributor
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Companies, Organizers & Investors */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold font-mono mb-6">For Companies, Organizers & Investors</h2>
            <p className="text-muted-foreground font-mono leading-relaxed mb-8">
              We're building infrastructure for technical evaluation and practice. 
              If you're a company hiring engineers, a contest organizer (like Codeforces), an early-stage investor, 
              or incubator interested in partnering with us, we'd like to hear from you.
            </p>
            
            <div className="space-y-6 mb-12">
              <div>
                <h3 className="font-mono font-bold mb-2">Strategic Partnerships</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Collaborate with us to integrate WIRRE into your hiring workflow or contest platform. 
                  Whether you're hiring engineers or running coding competitions, early partners get priority access and influence on roadmap direction.
                </p>
              </div>
              
              <div>
                <h3 className="font-mono font-bold mb-2">Funding & Investment</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  We're backed by conviction in our mission to standardize engineering evaluation. 
                  Interested in supporting infrastructure that matters? Let's talk.
                </p>
              </div>
              
              <div>
                <h3 className="font-mono font-bold mb-2">Incubation & Acceleration</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  If you run an incubator or accelerator focused on developer tools, 
                  infrastructure, or future of work, reach out for partnership opportunities.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <a 
                href="mailto:thewirrecompany@gmail.com"
              >
                <Button size="lg" variant="default">
                  Connect by Email
                </Button>
              </a>
              <a 
                href="https://www.linkedin.com/company/wirre/" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline">
                  Connect on LinkedIn
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}

      {/* Contact Info */}
      <section className="py-24">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold font-mono mb-4">
              Start a conversation
            </h2>
            <p className="text-muted-foreground font-mono mb-8">
              Whether you're looking to partner, invest, contribute, or just want to learn more 
              about what we're building, we'd like to hear from you.
            </p>
            <div className="border border-border p-6">
              <div className="font-mono text-sm space-y-2">
                <p className="text-muted-foreground">→ Email: <a href="mailto:thewirrecompany@gmail.com" className="text-foreground hover:underline">thewirrecompany@gmail.com</a></p>
                <p className="text-muted-foreground">→ LinkedIn: <a href="https://www.linkedin.com/company/wirre/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">linkedin.com/company/wirre</a></p>
                <p className="text-muted-foreground">→ We typically respond within 24-48 hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
