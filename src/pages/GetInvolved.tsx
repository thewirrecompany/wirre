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
            Join the Competitive Software Engineering movement
          </h1>
          <p className="mt-6 max-w-2xl text-muted-foreground font-mono leading-relaxed">
            WIRRE is building the first arena for engineering as a competitive sport.
            While Codeforces tests algorithms, we're creating infrastructure for speed debugging tournaments,
            refactoring contests, and latency optimization sprints. Join us as a competitor, organizer, or contributor.
          </p>
        </div>
      </section>

      {/* For Contributors */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold font-mono mb-6">For Competitive Engineers & Contributors</h2>
            <p className="text-muted-foreground font-mono leading-relaxed mb-8">
              Compete in engineering rounds, climb leaderboards, or help build the platform.
              We welcome engineers who want to compete in systems work (not just algorithms),
              students preparing for open source, and contributors building the future of competitive engineering.
            </p>

            <div className="space-y-6 mb-12">
              <div>
                <h3 className="font-mono font-bold mb-2">Compete in Engineering Rounds</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Join speed debugging tournaments, refactoring contests, and latency optimization sprints.
                  Race against others to fix bugs, optimize code, or refactor legacy systems.
                  Leaderboards based on real engineering skills: Git, debugging, performance tuning, code quality.
                </p>
              </div>

              <div>
                <h3 className="font-mono font-bold mb-2">Contribute to WIRRE's Infrastructure</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Help us build the platform that makes competitive engineering possible at scale.
                  Work on container orchestration, evaluation systems, challenge templates, and tooling.
                  Solve hard infrastructure problems — the same ones blocking others from building this.
                </p>
              </div>

              <div>
                <h3 className="font-mono font-bold mb-2">Design Contest Challenges</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Create speed debugging challenges, refactoring puzzles, or performance optimization problems.
                  Turn real bugs you've encountered into competitive rounds for the community.
                </p>
              </div>
            </div>

            <Button size="lg" asChild>
              <Link to="/signup">
                Join the Arena
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* For Organizers, Companies & Investors */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold font-mono mb-6">For Contest Organizers & Partners</h2>
            <p className="text-muted-foreground font-mono leading-relaxed mb-8">
              We're building infrastructure to run engineering contests at scale.
              If you run university coding clubs, organize competitive programming events, or manage technical communities,
              you can now host the first "Engineering Olympics" — speed debugging rounds, refactoring tournaments, latency sprints.
            </p>

            <div className="space-y-6 mb-12">
              <div>
                <h3 className="font-mono font-bold mb-2">Host Engineering Tournaments</h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Run 2-hour competitive rounds where participants race to fix bugs, optimize latency, or refactor code.
                  Like Codeforces, but for systems work instead of algorithms. Our infrastructure handles repo provisioning,
                  secure containers, real-time leaderboards, and automated evaluation for hundreds of participants simultaneously.
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
              Build the first competitive engineering arena
            </h2>
            <p className="text-muted-foreground font-mono mb-8">
              Whether you want to compete in engineering rounds, organize tournaments for your community,
              develop open source talent, or invest in the future of competitive engineering,
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
