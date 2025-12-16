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
                WIRRE applies infrastructure principles to hiring: reproducibility, 
                determinism, observability, governance. We build primitives that 
                teams can trust to produce reliable signals about engineering capability.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-mono mt-16 mb-6">
                Real work in real environments
              </h2>
              <p className="text-muted-foreground font-mono leading-relaxed">
                The only way to know if someone can do the work is to have them 
                do the work. Not a simplified version. Not a puzzle that tests 
                tangential skills. The actual work, in an environment that mirrors 
                production constraints.
              </p>
              <p className="text-muted-foreground font-mono leading-relaxed">
                WIRRE provides containerized environments, Git-based workflows, 
                and deterministic evaluation. Candidates work locally using familiar 
                tools. Evaluation is automated and consistent. The output is a 
                structured capability report, not a binary pass/fail from a single 
                interviewer having a bad day.
              </p>
              <p className="text-muted-foreground font-mono leading-relaxed">
                This is not revolutionary. It is obvious. The surprising thing is 
                that it took this long for someone to build it properly.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold font-mono mt-16 mb-6">
                What we believe
              </h2>
              <ul className="space-y-4 text-muted-foreground font-mono">
                <li className="flex items-start gap-3">
                  <span className="text-foreground">1.</span>
                  <span>Hiring outcomes should be determined by engineering capability, not interview preparation.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-foreground">2.</span>
                  <span>Measurement must be standardized, reproducible, and auditable.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-foreground">3.</span>
                  <span>Candidates deserve to be evaluated on their actual work, not their performance under artificial pressure.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-foreground">4.</span>
                  <span>Engineering teams deserve reliable signals about candidate capabilities.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-foreground">5.</span>
                  <span>Hiring is too important to be left to broken processes and uncalibrated gut instinct.</span>
                </li>
              </ul>
            </section>
          </div>

          <div className="mt-16 pt-16 border-t border-border">
            <p className="text-muted-foreground font-mono mb-6">
              If this resonates, we should talk.
            </p>
            <Button asChild size="lg">
              <Link to="/signup">Request Access</Link>
            </Button>
          </div>
        </div>
      </article>
    </Layout>
  );
}
