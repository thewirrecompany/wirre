import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <Layout>
      <article className="py-24">
        <div className="container max-w-3xl">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-4">
            About
          </p>
          <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight mb-12">
            Why WIRRE exists
          </h1>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-mono mt-16 mb-6">
                Interviews are broken
              </h2>
              <p className="text-muted-foreground font-mono leading-relaxed">
                The modern technical interview is a performance. Candidates rehearse 
                solutions to known problems. Interviewers evaluate recall speed and 
                verbal fluency. The entire ritual measures interview preparation, 
                not engineering capability.
              </p>
              <p className="text-muted-foreground font-mono leading-relaxed">
                DSA puzzles select for candidates who have time to grind LeetCode. 
                System design interviews reward those who can narrate architectural 
                decisions in real-time. Take-home assignments lack standardization 
                and are trivially gamed with AI assistance or borrowed solutions.
              </p>
              <p className="text-muted-foreground font-mono leading-relaxed">
                The correlation between interview performance and job performance 
                is weak at best. We have optimized for the wrong metric.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-mono mt-16 mb-6">
                This is a measurement problem
              </h2>
              <p className="text-muted-foreground font-mono leading-relaxed">
                When measurement is unreliable, decisions are unreliable. Engineering 
                teams make million-dollar hiring decisions based on signals that barely 
                correlate with the work that needs to be done.
              </p>
              <p className="text-muted-foreground font-mono leading-relaxed">
                False positives pass interviews but struggle with production systems. 
                False negatives build excellent software but fail whiteboard theater. 
                The selection process systematically miscalibrates.
              </p>
              <p className="text-muted-foreground font-mono leading-relaxed">
                To fix hiring, we must fix measurement. Better instruments produce 
                better signals. Better signals produce better decisions.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-mono mt-16 mb-6">
                Infrastructure thinking
              </h2>
              <p className="text-muted-foreground font-mono leading-relaxed">
                Hiring is infrastructure. Like databases, authentication, and 
                deployment pipelines, it is foundational machinery that most 
                organizations treat as someone else's problem.
              </p>
              <p className="text-muted-foreground font-mono leading-relaxed">
                When infrastructure fails, everything built on top of it fails. 
                Broken hiring produces broken teams. Broken teams produce broken 
                systems. The cost compounds across every engineering decision made 
                by people who should not have been hired, and every decision not 
                made by people who were incorrectly rejected.
              </p>
              <p className="text-muted-foreground font-mono leading-relaxed">
                WIRRE applies infrastructure principles to hiring: documentation, 
                determinism, observability, governance. We build primitives that 
                teams can trust to produce reliable signals about engineering capability.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-mono mt-16 mb-6">
                Contribution-based evaluation
              </h2>
              <p className="text-muted-foreground font-mono leading-relaxed">
                WIRRE is not a test platform or a coding playground. It's a controlled, contribution-based hiring system built around real repositories and submission-based evaluation.
              </p>
              <p className="text-muted-foreground font-mono leading-relaxed">
                Companies create challenge repositories—real codebases with bugs, missing features, failing tests, and architectural issues. Candidates run the repo locally, make changes, and submit their solution through the platform.
              </p>
              <p className="text-muted-foreground font-mono leading-relaxed">
                Evaluation is based on code quality, commit history, design decisions, tests added, PR descriptions, and how candidates reason about tradeoffs. This mirrors how engineering work is reviewed in production.
              </p>
              <p className="text-muted-foreground font-mono leading-relaxed">
                No DSA rounds. No live interviews. No whiteboard coding. No artificial time pressure. Just real engineering work, evaluated the way engineers actually work.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-mono mt-16 mb-6">
                What we believe
              </h2>
              <ul className="space-y-4 text-muted-foreground font-mono">
                <li className="flex items-start gap-3">
                  <span className="text-foreground">→</span>
                  <span>The only way to know if someone can do the work is to have them do the work</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-foreground">→</span>
                  <span>Interviews should mirror actual job responsibilities, not test tangential skills</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-foreground">→</span>
                  <span>Clear environment instructions reduce "works on my machine" issues</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-foreground">→</span>
                  <span>Submission-based evaluation captures how engineers actually reason and make decisions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-foreground">→</span>
                  <span>Standardized measurement enables fair comparison and reduces bias</span>
                </li>
              </ul>
            </section>
          </div>

          <div className="mt-16 pt-16 border-t border-border">
            <p className="text-muted-foreground font-mono mb-6">
              If this resonates, we should talk.
            </p>
            <Button asChild size="lg">
              <Link to="/waitlist">Sign Up</Link>
            </Button>
          </div>
        </div>
      </article>
    </Layout>
  );
}
