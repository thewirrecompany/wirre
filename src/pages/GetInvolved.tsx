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
            Join the development contest movement
          </h1>
          <p className="mt-6 max-w-2xl text-muted-foreground font-mono leading-relaxed">
            WIRRE is building infrastructure for real-world coding practice and development contests. 
            We're looking for students, organizers, contributors, and partners who share our vision of 
            bridging the gap between LeetCode and real engineering.
          </p>
        </div>
      </section>

      {/* For Contributors */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold font-mono mb-6">For Students & Contributors</h2>
            <p className="text-muted-foreground font-mono leading-relaxed mb-8">
              Want to practice real engineering skills or contribute to WIRRE's development? 
              We welcome students preparing for open source programs, engineers building their portfolios, 
              and technical contributors who want to help build the future of engineering practice platforms.
            </p>
            
            <div className="space-y-6 mb-12">
              <div>
                <h3 className="font-mono font-bold mb-2">Practice on Real Challenges</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Access our library of real-world challenges: fix bugs, optimize performance, 
                  add features, refactor code. Build your portfolio with work that mirrors real 
                  open-source contributions — not LeetCode scores.
                </p>
              </div>
              
              <div>
                <h3 className="font-mono font-bold mb-2">Contribute to WIRRE's Development</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Help us build the platform itself. Work on infrastructure, evaluation algorithms, 
                  challenge templates, and tooling. Real open-source contribution experience.
                </p>
              </div>
              
              <div>
                <h3 className="font-mono font-bold mb-2">Create Challenges for the Community</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Design challenges based on real bugs you've encountered or interesting optimization 
                  problems. Share your engineering expertise with the community.
                </p>
              </div>
            </div>

            <Button size="lg" asChild>
              <Link to="/signup">
                Start Practicing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Organizers, Companies & Investors */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold font-mono mb-6">For Organizers, Universities & Partners</h2>
            <p className="text-muted-foreground font-mono leading-relaxed mb-8">
              We're building infrastructure for development contests and engineering practice. 
              If you run a university coding club, organize hackathons, manage a technical community, 
              or are a company looking to evaluate engineering talent differently, we'd like to hear from you.
            </p>
            
            <div className="space-y-6 mb-12">
              <div>
                <h3 className="font-mono font-bold mb-2">University Clubs & Contest Organizers</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Like running Codeforces rounds for your university? Now you can host development contests — 
                  where participants fix memory leaks, optimize latency, refactor code, and build features under time pressure. 
                  Perfect for hackathons, club events, and open-source preparation workshops. Early organizers get priority access 
                  and influence on features.
                </p>
              </div>
              
              <div>
                <h3 className="font-mono font-bold mb-2">Companies & Open Source Programs</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Develop engineering talent for your open source initiatives and programs like GSoC. 
                  Use WIRRE to train developers on real codebases, build a pipeline of contributors who understand 
                  your projects, and identify engineers who can make meaningful open source contributions. 
                  The same infrastructure can also be used for technical hiring if needed.
                </p>
              </div>
              
              <div>
                <h3 className="font-mono font-bold mb-2">Investors & Incubators</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  We're backed by conviction in our mission to bridge the gap between algorithmic practice 
                  and real engineering. If you run an incubator focused on developer tools, education tech, 
                  or future of work, let's talk about partnership opportunities.
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
              Let's build this together
            </h2>
            <p className="text-muted-foreground font-mono mb-8">
              Whether you're a student looking to practice, an organizer planning dev contests, 
              a company developing open source talent, or an investor interested in education infrastructure, 
              we'd like to hear from you.
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
