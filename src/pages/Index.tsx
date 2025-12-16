import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, GitBranch, Terminal, Shield, Gauge, CheckCircle } from "lucide-react";

const steps = [
  { num: "01", title: "Configure workflow", desc: "Define evaluation criteria, environment constraints, and scoring parameters" },
  { num: "02", title: "Candidate works locally", desc: "Engineers work in their own environment using familiar tools" },
  { num: "03", title: "PR submission", desc: "Submit work through standard Git workflows" },
  { num: "04", title: "Automated evaluation", desc: "Deterministic scoring against defined criteria" },
  { num: "05", title: "Capability report", desc: "Structured analysis of engineering competencies" },
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
            WIRRE is infrastructure for evaluating real engineering work using production-grade workflows. 
            Stop measuring interview performance. Start measuring engineering capability.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link to="/signup">Request Access</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/platform">
                View Platform <ArrowRight className="ml-2 h-4 w-4" />
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
              Evaluate real work in real environments
            </h2>
          </div>
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="p-6 border border-border">
              <Terminal className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Docker-based workflows</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Reproducible, isolated environments that mirror production infrastructure. 
                No local setup variance. No platform dependencies.
              </p>
            </div>
            <div className="p-6 border border-border">
              <GitBranch className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Git + PR submission</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Candidates work using the same tools and workflows they use professionally. 
                Commit history, branch strategy, and code review patterns are all observable.
              </p>
            </div>
            <div className="p-6 border border-border">
              <Gauge className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Deterministic scoring</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Automated evaluation against defined criteria. Same input, same output, every time. 
                Eliminates interviewer bias and inconsistency.
              </p>
            </div>
            <div className="p-6 border border-border">
              <Shield className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Real environments</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Not puzzles. Not toy problems. Actual engineering tasks with production constraints, 
                failure modes, and operational considerations.
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
                <Link to="/signup">Request Access</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
