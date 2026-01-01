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
            Controlled, contribution-based hiring system
          </h1>
          <p className="mt-6 max-w-2xl text-muted-foreground font-mono leading-relaxed">
            Built around real repositories, reproducible environments, and PR-based evaluation.
            Not a test platform. Not an interview tool. Infrastructure for measuring real engineering work.
          </p>
          <div className="mt-6 max-w-2xl">
            <h3 className="text-lg font-bold font-mono mb-2">The Method — Real Engineering, Not Brainteasers</h3>
            <p className="text-sm text-muted-foreground font-mono leading-relaxed">
              WIRRE evaluates candidates by recreating a real engineering workflow: we provision a private working copy, candidates clone, branch, and open a Pull Request. Our evaluation is driven by artifacts — PRs, commits, tests and explanations — not isolated puzzles.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="py-24 border-b border-border">
        <div className="container">
          <h2 className="text-2xl font-bold font-mono mb-12">System Architecture</h2>
          <div className="border border-border p-8 bg-background">
            <svg viewBox="0 0 800 600" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
              {/* Platform Container */}
              <rect x="20" y="20" width="760" height="560" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
              <text x="400" y="50" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="16" fontFamily="monospace" fontWeight="bold">WIRRE PLATFORM</text>
              <line x1="20" y1="65" x2="780" y2="65" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
              
              {/* Top Row - Three Boxes */}
              <g id="client-side">
                <rect x="50" y="100" width="180" height="140" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <text x="140" y="120" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12" fontFamily="monospace" fontWeight="bold">CLIENT SIDE</text>
                <text x="70" y="145" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Dashboard</text>
                <text x="70" y="165" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Config Builder</text>
                <text x="70" y="185" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Reports</text>
                <text x="70" y="205" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Analytics</text>
              </g>
              
              <g id="governance">
                <rect x="310" y="100" width="180" height="140" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <text x="400" y="120" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12" fontFamily="monospace" fontWeight="bold">GOVERNANCE</text>
                <text x="330" y="145" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Templates</text>
                <text x="330" y="165" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Constraints</text>
                <text x="330" y="185" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Scoring Rules</text>
                <text x="330" y="205" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Audit Logs</text>
              </g>
              
              <g id="candidate-side">
                <rect x="570" y="100" width="180" height="140" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <text x="660" y="120" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12" fontFamily="monospace" fontWeight="bold">CANDIDATE SIDE</text>
                <text x="590" y="145" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Environment</text>
                <text x="590" y="165" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Git Workflow</text>
                <text x="590" y="185" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Submission</text>
                <text x="590" y="205" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Status</text>
              </g>
              
              {/* Arrows between top boxes */}
              <line x1="230" y1="170" x2="290" y2="170" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
              <line x1="290" y1="170" x2="230" y2="170" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
              <line x1="490" y1="170" x2="550" y2="170" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
              <line x1="550" y1="170" x2="490" y2="170" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
              
              {/* Vertical connections to evaluation engine */}
              <line x1="140" y1="240" x2="140" y2="280" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
              <line x1="400" y1="240" x2="400" y2="280" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
              <line x1="660" y1="240" x2="660" y2="280" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
              <line x1="140" y1="280" x2="660" y2="280" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
              <line x1="400" y1="280" x2="400" y2="320" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
              
              {/* Evaluation Engine */}
              <g id="evaluation-engine">
                <rect x="250" y="330" width="300" height="120" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <text x="400" y="355" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12" fontFamily="monospace" fontWeight="bold">EVALUATION ENGINE</text>
                <rect x="275" y="375" width="100" height="50" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
                <text x="325" y="395" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">Container</text>
                <text x="325" y="410" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">Runtime</text>
                <rect x="425" y="375" width="100" height="50" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
                <text x="475" y="395" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">Deterministic</text>
                <text x="475" y="410" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">Scoring</text>
              </g>
              
              {/* Arrow to capability reports */}
              <line x1="400" y1="450" x2="400" y2="490" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" markerEnd="url(#arrowhead)"/>
              
              {/* Capability Reports */}
              <g id="capability-reports">
                <rect x="275" y="500" width="250" height="50" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <text x="400" y="530" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12" fontFamily="monospace" fontWeight="bold">CAPABILITY REPORTS</text>
              </g>
              
              {/* Arrow marker definition */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                  <polygon points="0 0, 10 3, 0 6" fill="rgba(255,255,255,0.3)" />
                </marker>
              </defs>
            </svg>
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

# Start development environment (managed)
$ ./scripts/setup-dev.sh

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
                  <span>Reproducible environments for consistency</span>
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
              Sign up to start building assessments that measure what matters.
            </p>
            <Button asChild size="lg">
              <Link to="/signup">Sign Up</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
