

import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, GitBranch, Terminal, Shield, Gauge, CheckCircle } from "lucide-react";

const steps = [
  { num: "01", title: "Choose or create a challenge", desc: "Students pick from a library of real-world challenges, or organizers create custom contests for their communities" },
  { num: "02", title: "Clone your own repo", desc: "Each participant gets their own private repository — reproducible environments ensure everyone starts from the same baseline" },
  { num: "03", title: "Code like you're contributing", desc: "Work in your IDE, debug locally, run tests, refactor — use the same tools you'd use for real open source contributions" },
  { num: "04", title: "Push and iterate", desc: "Commit your changes, push to your repo, get real-time feedback. Iterate until your solution works and performs well" },
  { num: "05", title: "Get evaluated on what matters", desc: "Scored on functionality, performance, code quality, and engineering judgment — the skills that matter in real projects" },
];

const metrics = [
  { icon: CheckCircle, title: "Functional correctness", desc: "Does the solution work as specified?" },
  { icon: Gauge, title: "Performance", desc: "Resource usage, latency, throughput under load" },
  { icon: Terminal, title: "Code quality", desc: "Structure, readability, maintainability" },
  { icon: Shield, title: "Security posture", desc: "Input validation, authentication, authorization patterns" },
  { icon: GitBranch, title: "Production readiness", desc: "Error handling, logging, configuration management" },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero */}
      <section className="min-h-[90vh] flex items-center border-b border-border">
        <div className="container py-24">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter font-mono">
            WIRRE
          </h1>
          <h2 className="mt-6 text-3xl md:text-5xl font-extrabold tracking-tight text-rose-600 font-mono">
            Launches on 1ST March 2026
          </h2>
          <p className="mt-4 text-xl md:text-2xl text-muted-foreground font-mono">
            Compete in Commits.
          </p>
          <p className="mt-8 max-w-2xl text-muted-foreground font-mono leading-relaxed">
            No DSA riddles. No whiteboard theater. No algorithm memorization.
            We built the infrastructure for real-world coding practice — a platform where students work on actual codebases, just like open source contributions. 
            Clone repos, fix bugs, add features, optimize performance, and push your code. Whether you're preparing for competitive programming, building your engineering portfolio, 
            or organizing development contests for your university club, WIRRE gives you the infrastructure used by real engineering teams.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link to="/signup">Start Practicing</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/platform">
                How It Works <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-4">
              The Problem
            </p>
            <h2 className="text-3xl md:text-4xl font-bold font-mono tracking-tight">
              LeetCode doesn't prepare you for real engineering
            </h2>
            <div className="mt-8 space-y-6 text-muted-foreground font-mono leading-relaxed">
              <p>
                Students grind DSA problems to pass interviews, but that's not how real software gets built. 
                Open source programs like GSoC don't ask you to invert a binary tree — they ask you to understand existing codebases, 
                fix real bugs, and make meaningful contributions.
              </p>
              <p>
                University coding clubs run contests on Codeforces and CodeChef, which are excellent for algorithms. 
                But there's no platform for development contests — where you clone a broken repo, optimize performance, 
                fix memory leaks, or refactor legacy code under time pressure.
              </p>
              <p>
                The gap between "solving puzzles" and "shipping code" is massive. WIRRE bridges that gap.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-4">
              The Solution
            </p>
            <h2 className="text-3xl md:text-4xl font-bold font-mono tracking-tight">
              Practice like you're contributing to open source
            </h2>
          </div>
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="p-6 border border-border">
              <Terminal className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Real-World Challenges</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Clone real codebases with actual bugs and missing features. Fix issues, add functionality, optimize performance — just like open source contributions.
              </p>
            </div>
            <div className="p-6 border border-border">
              <GitBranch className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Your IDE, Your Tools</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Work locally with your preferred editor and debugger. No browser-based editors. Use Git like a real developer — commit, push, iterate.
              </p>
            </div>
            <div className="p-6 border border-border">
              <Gauge className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Performance Matters</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Get scored not just on correctness, but on latency, memory usage, and code quality. Build the habits that matter in production systems.
              </p>
            </div>
            <div className="p-6 border border-border">
              <Shield className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">For Organizers Too</h3>
              <p className="text-sm text-muted-foreground font-mono">
                University clubs and contest organizers can create development contests. Like Codeforces, but for real engineering — not just algorithms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-4">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-mono tracking-tight mb-12">
            Five steps from practice to mastery
          </h2>
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={step.num} className="flex border-t border-border py-8 last:border-b">
                <span className="text-muted-foreground font-mono text-sm w-16 shrink-0">
                  {step.num}
                </span>
                <div>
                  <h3 className="font-mono font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground font-mono">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Measure */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-4">
            What We Measure*
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-mono tracking-tight mb-12">
            Real engineering skills, not puzzle-solving*
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
              <div key={metric.title} className="p-6 border border-border">
                <metric.icon className="h-5 w-5 mb-4 text-muted-foreground" />
                <h3 className="font-mono font-bold mb-2">{metric.title}</h3>
                <p className="text-sm text-muted-foreground font-mono">{metric.desc}</p>
              </div>
            ))}
          </div>

          {/* The Method */}
          <div className="mt-12 max-w-3xl">
            <h3 className="text-xl font-bold font-mono mb-3">The Method — Like Contributing to Open Source</h3>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              We evaluate you where you do your best work: in your local IDE using standard Git workflows. No algorithmic riddles, no whiteboard pressure — just Clone → Code → Push. You get your own repository, make real changes to real code, push your work, and get evaluated on what matters. Perfect preparation for open source programs, hackathons, and real software engineering work. Companies can also use this infrastructure for hiring.
            </p>
            <p className="mt-2 text-xs text-muted-foreground font-mono italic opacity-60">*AI evaluation is a future feature, not expected in the March 2026 launch</p>
          </div>

          {/* The 4 Pillars */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="p-6 border border-border">
              <h4 className="font-mono font-bold mb-2">Functional Correctness</h4>
              <p className="text-sm text-muted-foreground font-mono">Does the code solve the problem and pass the test suite?</p>
            </div>
            <div className="p-6 border border-border">
              <h4 className="font-mono font-bold mb-2">Code Quality & Maintainability</h4>
              <p className="text-sm text-muted-foreground font-mono">Structure, naming, abstractions and long-term maintainability.</p>
            </div>
            <div className="p-6 border border-border">
              <h4 className="font-mono font-bold mb-2">Production Readiness</h4>
              <p className="text-sm text-muted-foreground font-mono">Logging, security, performance and deployment considerations.</p>
            </div>
            <div className="p-6 border border-border">
              <h4 className="font-mono font-bold mb-2">Collaboration Signal</h4>
              <p className="text-sm text-muted-foreground font-mono">Commit structure, documentation, and how the candidate explains tradeoffs.</p>
            </div>
          </div>

          <p className="mt-6 text-xs text-muted-foreground font-mono italic opacity-60">*AI-powered evaluation features are planned for future releases, not expected in the March 2026 launch</p>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-24">
        <div className="container">
          <div className="max-w-3xl">
            <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-4">
              Who It's For
            </p>
            <h2 className="text-3xl md:text-4xl font-bold font-mono tracking-tight mb-8">
              For students, organizers, and anyone building real engineering skills
            </h2>
            <div className="space-y-6 text-muted-foreground font-mono leading-relaxed">
              <p>
                <span className="text-foreground font-bold">Students preparing for open source</span> — Practice 
                on real codebases with actual bugs and missing features. Build the skills that matter for programs like GSoC, 
                Outreachy, and meaningful contributions to real projects. Your portfolio shows real engineering work, not LeetCode scores.
              </p>
              <p>
                <span className="text-foreground font-bold">Contest organizers and university clubs</span> — Like Codeforces 
                admins but for development contests. Host competitions where participants fix memory leaks, optimize latency, 
                refactor legacy code, or build features under time pressure. Perfect for hackathons, club events, and coding competitions.
              </p>
              <p>
                <span className="text-foreground font-bold">Engineers who want to practice real skills</span> — Build your 
                engineering muscles on challenges that mirror production work. Learn debugging, performance optimization, 
                and systems thinking — not algorithm memorization.
              </p>
              <p className="text-sm italic">
                <span className="text-foreground font-bold">Companies hiring developers</span> can also leverage this same 
                infrastructure to evaluate candidates on real engineering work instead of whiteboard puzzles.
              </p>
            </div>
            <div className="mt-12">
              <Button asChild size="lg">
                <Link to="/signup">Start Practicing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
