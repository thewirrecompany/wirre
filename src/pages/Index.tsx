import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, GitBranch, Terminal, Shield, Gauge, CheckCircle } from "lucide-react";

const steps = [
  { num: "01", title: "Company creates challenge repo", desc: "Real codebase with bugs, missing features, failing tests, and architectural issues" },
  { num: "02", title: "Candidate clones and runs locally", desc: "git clone, docker compose up, run tests, read existing code" },
  { num: "03", title: "Work on real problems", desc: "Debug issues, implement features, refactor code, fix tests, make architectural decisions" },
  { num: "04", title: "Submit via Pull Request", desc: "Commit changes, push code, open PR with description and reasoning" },
  { num: "05", title: "PR-based evaluation", desc: "Code quality, commit history, design decisions, tests added, tradeoff explanations" },
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
          <p className="mt-4 text-xl md:text-2xl text-muted-foreground font-mono">
            Hiring is infrastructure.
          </p>
          <p className="mt-8 max-w-2xl text-muted-foreground font-mono leading-relaxed">
            No DSA rounds. No live interviews. No whiteboard coding. No artificial problems.
            Just real codebases with bugs, missing features, and architectural issues. 
            Candidates clone repos, work locally with Docker, and open Pull Requests. 
            We evaluate real engineering work.
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
              <h3 className="font-mono font-bold mb-2">Real codebases, not puzzles</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Challenge repos contain actual bugs, missing features, refactors, failing tests, 
                and architectural issues. Not artificial problems designed for interviews.
              </p>
            </div>
            <div className="p-6 border border-border">
              <GitBranch className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Clone, work, submit PR</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Candidates use git, their IDE, and Docker. No browser editors. No time pressure. 
                Just real engineering work with standard workflows.
              </p>
            </div>
            <div className="p-6 border border-border">
              <Gauge className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Docker environments</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Environment parity via containers. Zero setup excuses. Deterministic evaluation. 
                No "works on my machine" problems.
              </p>
            </div>
            <div className="p-6 border border-border">
              <Shield className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">PR-based signals</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Evaluate diff quality, commit messages, file touch patterns, tests added, 
                PR descriptions, and tradeoff explanations. How real engineers are measured.
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
