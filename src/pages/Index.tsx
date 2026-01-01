import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, GitBranch, Terminal, Shield, Gauge, CheckCircle } from "lucide-react";

const steps = [
  { num: "01", title: "Company prepares a challenge", desc: "A curated repo with real bugs, missing features, failing tests, and architecture to evaluate" },
  { num: "02", title: "Delivered with reproducibility", desc: "Challenges arrive ready-to-run via our managed delivery layer so environments behave the same for everyone" },
  { num: "03", title: "Solve and iterate locally", desc: "Use your normal dev tools — run, debug, refactor, and add tests locally" },
  { num: "04", title: "Push, PR, explain", desc: "Create a branch, push changes, open a PR, and explain your tradeoffs" },
  { num: "05", title: "Signals that matter", desc: "We score diffs, commits, tests, and rationale — the signals that predict real engineering success" },
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
            Launches on 26TH January 2026
          </h2>
          <p className="mt-4 text-xl md:text-2xl text-muted-foreground font-mono">
            Hiring is infrastructure.
          </p>
          <p className="mt-8 max-w-2xl text-muted-foreground font-mono leading-relaxed">
            No DSA rounds. No whiteboard theater. No contrived puzzles.
            We built something a little crazy — a battle-tested delivery layer that spins up reproducible challenge repos. Candidates run the code locally, iterate like they would at work, and submit changes through standard Git workflows. We score real engineering output — not interview theater.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link to="/signup">Sign Up</Link>
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
              Technical interviews measure the wrong thing
            </h2>
            <div className="mt-8 space-y-6 text-muted-foreground font-mono leading-relaxed">
              <p>
                DSA puzzles test algorithmic recall under artificial time pressure. 
                Take-home assignments lack standardization and are trivially gamed. 
                System design interviews reward verbal fluency over actual engineering judgment.
              </p>
              <p>
                The result: false positives who interview well but underperform on real work, 
                and false negatives who build excellent systems but struggle with whiteboard theater.
              </p>
              <p>
                This is a measurement problem. The instruments are miscalibrated.
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
              Contribution-based evaluation, like GSoC
            </h2>
          </div>
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="p-6 border border-border">
              <Terminal className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Shipable challenges</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Real engineering problems — not interview contrivances. Fix issues you'd actually encounter on the job.
              </p>
            </div>
            <div className="p-6 border border-border">
              <GitBranch className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Run, iterate, repeat</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Reproducible repos remove "works on my machine" excuses. Use your IDE, run locally, and iterate until it ships.
              </p>
            </div>
            <div className="p-6 border border-border">
              <Gauge className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Deterministic dev</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Deterministic environments let reviewers see exactly what candidates see — stable, fair evaluation with no setup friction.
              </p>
            </div>
            <div className="p-6 border border-border">
              <Shield className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Signals, not quizzes</h3>
              <p className="text-sm text-muted-foreground font-mono">
                We evaluate the artifacts that matter — diffs, commits, tests, and written tradeoffs. That's how hiring reflects real work.
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
            Five steps to engineering truth
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
            What We Measure
          </p>
          <h2 className="text-3xl md:text-4xl font-bold font-mono tracking-tight mb-12">
            Engineering capability, not interview performance
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
            <h3 className="text-xl font-bold font-mono mb-3">The Method — Real Engineering, Not Brainteasers</h3>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              We evaluate candidates where they do their best work: in their local IDE using standard Git workflows. No algorithmic riddles, no whiteboard theater — just Clone → Branch → Pull Request. Candidates make real changes to real code, submit a PR, and our system evaluates the work that actually matters.
            </p>
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
              <p className="text-sm text-muted-foreground font-mono">PR description, commit structure, and how the candidate explains tradeoffs.</p>
            </div>
          </div>

          {/* The Feedback Loop */}
          <div className="mt-8 max-w-3xl">
            <h3 className="text-xl font-bold font-mono mb-3">The Promise — The Feedback Loop</h3>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              Every submission receives automated, line-by-line feedback and a clear capability report. Candidates walk away with actionable notes about strengths and areas for growth — no black holes, no silence.
            </p>
            <p className="mt-3 text-xs text-muted-foreground font-mono">We keep weighting and hidden tests private to prevent gaming; we do, however, show the pillars and the signals we measure.</p>
          </div>
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
              For teams that take engineering seriously
            </h2>
            <div className="space-y-6 text-muted-foreground font-mono leading-relaxed">
              <p>
                <span className="text-foreground font-bold">Engineering teams</span> building systems 
                where reliability, security, and performance matter. Teams that ship infrastructure, 
                not just features.
              </p>
              <p>
                <span className="text-foreground font-bold">Backend and systems roles</span> where 
                algorithmic puzzles don't capture the work. Database design, API architecture, 
                distributed systems, platform engineering.
              </p>
              <p>
                <span className="text-foreground font-bold">Serious candidates</span> who want to 
                demonstrate real capability rather than rehearsed performance. Engineers who build 
                better than they talk.
              </p>
            </div>
            <div className="mt-12">
              <Button asChild size="lg">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
