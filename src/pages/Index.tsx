

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
            Beta Testing is Open!
          </h2>
          <p className="mt-4 text-xl md:text-2xl text-muted-foreground font-mono">
            Compete in Commits.
          </p>
          <p className="mt-8 max-w-2xl text-muted-foreground font-mono leading-relaxed">
            The first arena for Competitive Software Engineering. While platforms like leetcode tests algorithms, WIRRE tests real systems work —
            Git workflows, debugging, refactoring, optimization. Host debugging rounds,
            refactoring contests, or performance sprints. Clone a repo, fix the bug, push your code, climb the leaderboard.
            This isn't practice — it's a sport.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link to="/signup">Start</Link>
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
              There's no arena for real engineering
            </h2>
            <div className="mt-8 space-y-6 text-muted-foreground font-mono leading-relaxed">
              <p>
                Platforms like codeforces have Competitive Programming (algorithms, trees, dynamic programming).
                Hackathons are about building new apps from scratch.
                But there's no platform for Competitive Software Engineering — debugging, refactoring sprints, latency optimization contests.
              </p>
              <p>
                No one hosts "Fix the Memory Leak" tournaments. No leaderboards for "Reduce API Latency by 50%" challenges.
                No 2-hour rounds where you race to refactor legacy code. The infrastructure to run these at scale doesn't exist.
              </p>
              <p>
                Until now. WIRRE is the first arena where engineering — not just algorithms — becomes a competitive sport.
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
              Competitive Software Engineering, not just algorithms
            </h2>
          </div>
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <div className="p-6 border border-border">
              <Terminal className="h-6 w-6 mb-4" />
              <h3 className="font-mono font-bold mb-2">Infinite Rounds</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Contests where you race to fix bugs, optimize latency, or refactor legacy code - the possibilities are infintie. Like cf rounds, but for systems work instead of algorithms.
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
              <h3 className="font-mono font-bold mb-2">Host Engineering Contests</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Run "Latency Optimization Sprints" or "Bug Hunt Tournaments" for your club. Leaderboards, time limits, real infrastructure — engineering as a competitive sport.
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
              For competitive engineers and contest organizers
            </h2>
            <div className="space-y-6 text-muted-foreground font-mono leading-relaxed">
              <p>
                <span className="text-foreground font-bold">Engineers who compete</span> — If you do Codeforces for algorithms,
                do WIRRE for systems. Compete in speed debugging rounds, refactoring contests, and latency optimization sprints.
                Climb leaderboards based on real engineering skills: Git, Docker, CI/CD, debugging, performance tuning.
              </p>
              <p>
                <span className="text-foreground font-bold">Contest organizers and university clubs</span> — Host the first
                "Engineering Olympics" for your community. Run 2-hour tournaments where participants race to fix bugs or optimize code.
                The infrastructure handles repo provisioning, leaderboards, and evaluation at scale.
              </p>
              <p>
                <span className="text-foreground font-bold">Students preparing for open source</span> — Build skills that matter
                for programs like GSoC through competitive practice. Your portfolio shows real engineering work, not LeetCode scores.
              </p>
              <p className="text-sm italic">
                <span className="text-foreground font-bold">Companies</span> can use this infrastructure to develop open source talent
                or evaluate candidates on real work instead of whiteboard puzzles.
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
