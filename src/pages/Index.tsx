import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, GitBranch, Terminal, Gauge, Trophy, ShieldAlert } from "lucide-react";

export default function Index() {
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
      {/* ─── Hero ─── */}
      <section className="min-h-[92vh] flex flex-col justify-center border-b border-border">
        <div className="container py-32 max-w-5xl">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-6">
            The arena for pure engineering.
          </p>
          <h1 className="text-7xl md:text-[clamp(4rem,11vw,9rem)] font-bold tracking-tighter font-mono leading-none">
            WIRRE
          </h1>
          <p className="mt-5 text-2xl md:text-3xl font-mono text-muted-foreground tracking-tight">
            Competitive Programming - For Codebases.
          </p>
          <p className="mt-6 text-base md:text-lg text-muted-foreground font-mono max-w-xl leading-relaxed">
            Enter our secure, browser-based environment.
            Navigate the codebase. Fix the bugs. Make the features. Climb the leaderboard.<br />
            Engineering — in its purest form — as a sport. <br />
            Not algorithms. No AI. Real engineering.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="font-mono uppercase tracking-widest px-8 h-12">
              <Link to={user ? dashboardLink : "/login"}>
                {user ? "Dashboard" : "Start Competing"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {!user && (
              <Button asChild variant="ghost" size="lg" className="font-mono uppercase tracking-widest px-8 h-12 text-muted-foreground hover:text-foreground">
                <Link to="/about">How It Works</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Three Pillars ─── */}
      <section className="py-24 border-b border-border">
        <div className="container max-w-5xl">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-12">
            What makes WIRRE different
          </p>
          <div className="grid md:grid-cols-3 gap-px bg-border">
            <div className="bg-background p-8">
              <Terminal className="h-5 w-5 mb-6 text-muted-foreground" />
              <h3 className="font-mono font-bold text-lg mb-3">Real engineering work</h3>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                Debug memory leaks, optimize API latency, refactor legacy code.
                Not algorithm puzzles — actual systems work.
              </p>
            </div>
            <div className="bg-background p-8">
              <ShieldAlert className="h-5 w-5 mb-6 text-primary" />
              <h3 className="font-mono font-bold text-lg mb-3">Zero AI Tolerance</h3>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                Work in a sandboxed IDE where Copilot and ChatGPT can't help you.
                Show the world you actually know how to code.
              </p>
            </div>
            <div className="bg-background p-8">
              <Gauge className="h-5 w-5 mb-6 text-muted-foreground" />
              <h3 className="font-mono font-bold text-lg mb-3">Score what matters</h3>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                Scored on correctness, performance, code quality, and peer review.
                Skills that show up in your first week at work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 border-b border-border">
        <div className="container max-w-5xl">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mb-12">
            How it works
          </p>
          <div className="grid md:grid-cols-3 gap-12">
            <div>
              <span className="font-mono text-5xl font-bold text-muted-foreground/20 block mb-4">01</span>
              <h3 className="font-mono font-bold mb-2">Enter</h3>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                Join a round and launch our browser-based sandboxed environment.
              </p>
            </div>
            <div>
              <span className="font-mono text-5xl font-bold text-muted-foreground/20 block mb-4">02</span>
              <h3 className="font-mono font-bold mb-2">Solve</h3>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                Debug, refactor, and optimize using our built-in editor and terminal.
              </p>
            </div>
            <div>
              <span className="font-mono text-5xl font-bold text-muted-foreground/20 block mb-4">03</span>
              <h3 className="font-mono font-bold mb-2">Compete</h3>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                Get scored automatically. Peer-review another submission. Climb the leaderboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Peer Review callout ─── */}
      <section className="py-24 border-b border-border">
        <div className="container max-w-5xl">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            <div className="md:w-1/2">
              <Trophy className="h-5 w-5 mb-6 text-muted-foreground" />
              <h2 className="text-3xl md:text-4xl font-bold font-mono tracking-tight mb-4">
                The round doesn't end when you push.
              </h2>
              <p className="text-muted-foreground font-mono leading-relaxed">
                After coding, every participant reviews a peer's submission — finding
                real bugs in real code. Your final score is coding + review.
                Both halves matter.
              </p>
            </div>
            <div className="md:w-1/2 border border-border p-6 space-y-0">
              {[
                "Coding round ends. Submissions locked.",
                "You receive a peer's repo and the original spec.",
                "1-hour review window. Find the bugs — not the nitpicks.",
                "Final score = coding score + review score.",
              ].map((text, i) => (
                <div key={i} className="flex gap-4 border-t border-border py-4 first:border-t-0">
                  <span className="font-mono text-xs text-muted-foreground/50 shrink-0 pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm font-mono text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="py-32">
        <div className="container max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold font-mono tracking-tighter">
                Ready to compete?
              </h2>
              <p className="mt-3 text-muted-foreground font-mono text-sm">
                Join the first arena for competitive software engineering.
              </p>
            </div>
            <Button asChild size="lg" className="font-mono uppercase tracking-widest px-10 h-12 shrink-0">
              <Link to={user ? dashboardLink : "/login"}>
                {user ? "Go to Dashboard" : "Get Started"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
