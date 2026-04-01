import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { GitBranch, Terminal, Shield, Gauge, CheckCircle, SearchCode, FileSearch, Bug } from "lucide-react";

const steps = [
  { num: "01", title: "Choose or create a challenge", desc: "Students pick from a library of real-world challenges, or organizers create custom contests for their communities." },
  { num: "02", title: "Clone your own repo", desc: "Each participant gets their own private repository — reproducible environments ensure everyone starts from the same baseline." },
  { num: "03", title: "Code like you're contributing", desc: "Work in your IDE, debug locally, run tests, refactor — use the same tools you'd use for real open source contributions." },
  { num: "04", title: "Push your code", desc: "Commit your changes and push to your private repository. Get feedback and scores automatically." },
  { num: "05", title: "Get evaluated on what matters", desc: "Scored on functionality, performance, code quality, and engineering judgment — the skills that matter in real projects." },
  { num: "06", title: "Rise the ranks", desc: "Climb the global and per-session leaderboards. Earn massive bonus points for getting selected by organizers." },
];

const metrics = [
  { icon: CheckCircle, title: "Functional correctness", desc: "Does the solution work as specified?" },
  { icon: Gauge, title: "Performance", desc: "Resource usage, latency, throughput under load." },
  { icon: Terminal, title: "Code quality", desc: "Structure, readability, maintainability." },
  { icon: Shield, title: "Security posture", desc: "Input validation, authentication, authorization patterns." },
  { icon: GitBranch, title: "Production readiness", desc: "Error handling, logging, configuration management." },
];

export default function AboutUs() {
  const { user, profile } = useAuth();

  const dashboardLink = (profile?.role as string) === 'superadmin'
    ? '/superadmin/dashboard'
    : profile?.role === 'admin'
      ? '/admin/dashboard'
      : profile?.role === 'company'
        ? '/company/dashboard'
        : '/candidate/rounds';

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-24 border-b border-border bg-gradient-to-b from-background to-muted/5">
        <div className="container max-w-4xl">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest mb-6">
            About WIRRE
          </p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight font-mono mb-6">
            Competitive Software Engineering
          </h1>
          <p className="text-xl text-muted-foreground font-mono leading-relaxed mb-8 max-w-3xl">
            The first arena for real systems work. While platforms like LeetCode test algorithms, WIRRE tests Git workflows, debugging, refactoring, and latency optimization. This isn't practice — it's a sport.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="font-mono uppercase tracking-widest">
              <Link to={user ? dashboardLink : "/signup"}>{user ? "Go to Dashboard" : "Join the Arena"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-mono uppercase tracking-widest">
              <a href="#how-it-works">How It Works</a>
            </Button>
          </div>
        </div>
      </section>

      {/* The Problem & Solution */}
      <section className="py-24 border-b border-border bg-muted/10">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
            <div className="bg-background border border-border p-8 hover:border-primary/50 transition-colors">
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-4 shrink-0">The Problem</p>
              <h2 className="text-2xl font-bold font-mono tracking-tight mb-6 mt-1">There's no arena for real engineering</h2>
              <div className="space-y-4 text-muted-foreground font-mono text-sm leading-relaxed">
                <p>Platforms like Codeforces have Competitive Programming (algorithms, trees, DP). Hackathons are about building new apps from scratch. But there's no platform for debugging, refactoring sprints, or latency optimization contests.</p>
                <p>No one hosts "Fix the memory leak" tournaments. No leaderboards for "Reduce API latency by 50%" challenges. The infrastructure to run engineering contests at scale simply didn't exist.</p>
              </div>
            </div>
            <div className="bg-background border border-border p-8 hover:border-primary/50 transition-colors">
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-4 shrink-0">The Solution</p>
              <h2 className="text-2xl font-bold font-mono tracking-tight mb-6 mt-1">Engineering as a competitive sport</h2>
              <div className="space-y-4 text-muted-foreground font-mono text-sm leading-relaxed">
                <p>WIRRE is the first platform where systems work is competitive. Clone a repo, fix the bug, push your code, and climb the leaderboard. You are scored on real-world factors: correctness, performance, and code quality.</p>
                <p>You work locally using your preferred editor and debugger. You use Git like a real developer. You build the habits that actually matter in production environments.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 border-b border-border scroll-m-14 bg-background">
        <div className="container">
          <div className="max-w-4xl">
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest mb-4">The Process</p>
            <h2 className="text-3xl md:text-5xl font-bold font-mono tracking-tight mb-12">Six steps to engineering mastery</h2>
            <div className="border-t border-border">
              {steps.map((step) => (
                <div key={step.num} className="flex flex-col md:flex-row gap-6 md:gap-8 py-8 md:py-10 border-b border-border group hover:bg-muted/5 transition-colors px-2 -mx-2">
                  <span className="text-muted-foreground font-mono text-3xl font-bold md:w-24 shrink-0 transition-colors group-hover:text-primary">
                    {step.num}
                  </span>
                  <div>
                    <h3 className="font-mono text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground font-mono leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What We Measure */}
      <section className="py-24 border-b border-border bg-muted/10">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-16 items-start">
            {/* What We Measure */}
            <div className="lg:col-span-12 xl:col-span-8 space-y-12">
              <div>
                <p className="text-sm text-primary font-mono uppercase tracking-widest mb-4 shrink-0">Evaluation</p>
                <h2 className="text-3xl font-bold font-mono tracking-tight mb-8">Real skills, not puzzles</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {metrics.map((metric) => (
                    <div key={metric.title} className="p-6 border border-border bg-background hover:bg-muted/5 transition-colors">
                      <metric.icon className="h-6 w-6 mb-4 text-primary" />
                      <h3 className="font-mono font-bold text-sm mb-2">{metric.title}</h3>
                      <p className="text-xs text-muted-foreground font-mono leading-relaxed">{metric.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-xs text-muted-foreground font-mono italic opacity-60">* AI-powered evaluation features are constantly evolving. *</p>
              </div>
            </div>

            {/* Peer Review Callout */}
            <div className="lg:col-span-12 xl:col-span-4 self-stretch border border-primary/20 bg-background/50 p-8 md:p-10 flex flex-col justify-center">
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-4 shrink-0">Phase 2</p>
              <h2 className="text-2xl font-bold font-mono tracking-tight mb-6">Peer Code Review</h2>
              <div className="space-y-6 text-muted-foreground font-mono text-sm leading-relaxed mb-6">
                <p>When the coding round ends, a 1-hour peer review round begins. Every candidate receives a randomly assigned peer's submission along with the original spec.</p>
                <div className="space-y-4">
                  <div className="flex gap-4"><SearchCode className="h-5 w-5 shrink-0 text-primary" /> <p>Review actual peer submissions with real bugs written by real people.</p></div>
                  <div className="flex gap-4"><FileSearch className="h-5 w-5 shrink-0 text-primary" /> <p>Ground truth is objective — the requirements define what "correct" means.</p></div>
                  <div className="flex gap-4"><Bug className="h-5 w-5 shrink-0 text-primary" /> <p>Miss a bug? Substantial penalty. Find them all? Full review points.</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Merged "Get Involved" Section */}
      <section className="py-32 bg-background relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-3xl -z-10" />
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <p className="text-sm text-primary font-mono uppercase tracking-widest mb-4">Get Involved</p>
            <h2 className="text-4xl md:text-5xl font-bold font-mono tracking-tight mb-6">Join the movement</h2>
            <p className="text-muted-foreground font-mono leading-relaxed text-lg">
              Whether you want to climb leaderboards, host tournaments, or help build the platform itself, there's a place for you in the arena.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            {/* Competitive Engineers */}
            <div className="border hover:border-primary border-border bg-card/10 p-10 flex flex-col transition-all duration-300">
              <h3 className="text-2xl font-bold font-mono mb-4 text-primary">For Engineers</h3>
              <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-8 flex-grow">
                Compete in speed debugging tournaments, refactoring contests, and latency optimization sprints. Put your practical skills to the test, climb the global leaderboards, and build a competitive portfolio of real engineering work, not isolated algorithms.
              </p>
              <Button asChild size="lg" className="font-mono uppercase tracking-widest self-start">
                <Link to="/signup">Compete Now</Link>
              </Button>
            </div>

            {/* Organizers */}
            <div className="border hover:border-primary border-border bg-card/10 p-10 flex flex-col transition-all duration-300">
              <h3 className="text-2xl font-bold font-mono mb-4 text-primary">For Organizers</h3>
              <p className="text-muted-foreground font-mono text-sm leading-relaxed mb-8 flex-grow">
                Run 2-hour competitive rounds for your university club, developer community, or company hiring pipeline. Our infrastructure seamlessly handles repository provisioning, secure containers, live leaderboards, and automated evaluation at scale.
              </p>
              <Button asChild variant="outline" size="lg" className="font-mono uppercase tracking-widest border-primary text-primary hover:bg-primary hover:text-black self-start">
                <a href="mailto:thewirrecompany@gmail.com">Host a Tournament</a>
              </Button>
            </div>
          </div>

          {/* Contact Box */}
          <div className="max-w-4xl mx-auto border border-border p-8 md:p-12 text-center bg-muted/10">
            <h3 className="text-xl font-bold font-mono mb-6">Have questions or want to partner?</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm font-mono">
              <a href="mailto:thewirrecompany@gmail.com" className="text-primary hover:text-foreground transition-colors inline-flex items-center gap-2 border-b border-primary/30 pb-1">
                <Terminal className="h-4 w-4" /> thewirrecompany@gmail.com
              </a>
              <span className="hidden sm:inline text-border">|</span>
              <a href="https://www.linkedin.com/company/wirre/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-foreground transition-colors inline-flex items-center gap-2 border-b border-primary/30 pb-1">
                <GitBranch className="h-4 w-4" /> LinkedIn: @wirre
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
