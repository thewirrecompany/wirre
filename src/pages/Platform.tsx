import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Platform() {
  return (
    <Layout>
      <section className="py-24 border-b border-border">
        <div className="container">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-4">
            Platform
          </p>
          <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight">
            Infrastructure for engineering evaluation
          </h1>
          <p className="mt-6 max-w-2xl text-muted-foreground font-mono leading-relaxed">
            WIRRE provides the primitives for standardized, reproducible assessment of engineering work. 
            Built on containers, Git, and deterministic scoring.
          </p>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <h2 className="text-2xl font-bold font-mono mb-12">System Architecture</h2>
          <div className="font-mono text-sm overflow-x-auto">
            <pre className="text-muted-foreground leading-relaxed">
{`┌─────────────────────────────────────────────────────────────────────────┐
│                           WIRRE PLATFORM                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌───────────────────┐    ┌───────────────────┐    ┌─────────────────┐ │
│  │   CLIENT SIDE     │    │   GOVERNANCE      │    │  CANDIDATE SIDE │ │
│  │                   │    │                   │    │                 │ │
│  │  • Dashboard      │    │  • Templates      │    │  • Environment  │ │
│  │  • Config Builder │◄──►│  • Constraints    │◄──►│  • Git Workflow │ │
│  │  • Reports        │    │  • Scoring Rules  │    │  • Submission   │ │
│  │  • Analytics      │    │  • Audit Logs     │    │  • Status       │ │
│  │                   │    │                   │    │                 │ │
│  └───────────────────┘    └───────────────────┘    └─────────────────┘ │
│           │                        │                        │          │
│           └────────────────────────┼────────────────────────┘          │
│                                    │                                    │
│                                    ▼                                    │
│                    ┌───────────────────────────────┐                   │
│                    │      EVALUATION ENGINE        │                   │
│                    │                               │                   │
│                    │  ┌─────────┐  ┌───────────┐  │                   │
│                    │  │Container│  │Deterministic│  │                   │
│                    │  │Runtime  │  │  Scoring   │  │                   │
│                    │  └─────────┘  └───────────┘  │                   │
│                    │                               │                   │
│                    └───────────────────────────────┘                   │
│                                    │                                    │
│                                    ▼                                    │
│                    ┌───────────────────────────────┐                   │
│                    │     CAPABILITY REPORTS        │                   │
│                    └───────────────────────────────┘                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </div>
      </section>

      {/* Client Side */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-2xl font-bold font-mono mb-6">Client Side</h2>
              <p className="text-muted-foreground font-mono leading-relaxed mb-8">
                Engineering teams configure assessments through a governed interface. 
                Define role requirements, select evaluation criteria, and customize 
                scoring weights while maintaining organizational standards.
              </p>
              <ul className="space-y-4 font-mono text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Assessment configuration with role-specific templates</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Candidate pipeline management and tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Structured capability reports with comparative analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Audit trails for compliance and review</span>
                </li>
              </ul>
            </div>
            <div className="border border-border p-6">
              <div className="font-mono text-xs text-muted-foreground mb-4">
                client/dashboard.tsx
              </div>
              <pre className="font-mono text-sm text-muted-foreground">
{`interface Assessment {
  id: string;
  role: Role;
  template: Template;
  constraints: Constraint[];
  scoring: ScoringConfig;
  candidates: Candidate[];
  status: 'draft' | 'active' | 'closed';
}

interface ScoringConfig {
  functional: number;  // 0-100 weight
  performance: number;
  quality: number;
  security: number;
  production: number;
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Candidate Side */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16">
            <div className="order-2 md:order-1 border border-border p-6">
              <div className="font-mono text-xs text-muted-foreground mb-4">
                candidate/workflow.sh
              </div>
              <pre className="font-mono text-sm text-muted-foreground">
{`# Clone assessment repository
$ git clone git@wirre.dev:assess/abc123.git
$ cd abc123

# Start development environment
$ docker-compose up -d

# Work in familiar local environment
$ code .

# Submit via standard Git workflow
$ git add -A
$ git commit -m "Implementation complete"
$ git push origin solution

# Automated evaluation triggers on push
# Results available in dashboard`}
              </pre>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl font-bold font-mono mb-6">Candidate Side</h2>
              <p className="text-muted-foreground font-mono leading-relaxed mb-8">
                Engineers work in their own environment using familiar tools. 
                No browser-based editors. No artificial time pressure. 
                Just real engineering work with standard Git workflows.
              </p>
              <ul className="space-y-4 font-mono text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Clone and work locally with preferred tools</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Containerized environments for consistency</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Submit through standard PR workflow</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Real-time status and feedback</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Governance */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold font-mono mb-6">Governance</h2>
            <p className="text-muted-foreground font-mono leading-relaxed mb-8">
              Standardization is the foundation of valid measurement. WIRRE enforces organizational 
              policies across all assessments, ensuring consistency, fairness, and auditability.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="border border-border p-6">
              <h3 className="font-mono font-bold mb-4">Templates</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Pre-approved assessment patterns for different roles and levels. 
                Ensures assessments align with actual job requirements.
              </p>
            </div>
            <div className="border border-border p-6">
              <h3 className="font-mono font-bold mb-4">Constraints</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Organizational policies on time limits, allowed resources, and evaluation criteria. 
                Configurable per team or globally.
              </p>
            </div>
            <div className="border border-border p-6">
              <h3 className="font-mono font-bold mb-4">Audit Logs</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Complete record of all assessment configurations, candidate interactions, 
                and evaluation decisions for compliance review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold font-mono mb-4">
              Ready to evaluate real engineering work?
            </h2>
            <p className="text-muted-foreground font-mono mb-8">
              Request access to start building assessments that measure what matters.
            </p>
            <Button asChild size="lg">
              <Link to="/signup">Request Access</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
