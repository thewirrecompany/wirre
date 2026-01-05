//platfomr

import { Layout } from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Platform() {
  return (
    <Layout>
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
              <g id="organizer-side">
                <rect x="50" y="100" width="180" height="140" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <text x="140" y="120" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12" fontFamily="monospace" fontWeight="bold">ORGANIZER SIDE</text>
                <text x="70" y="145" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Challenges</text>
                <text x="70" y="165" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Contests</text>
                <text x="70" y="185" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Leaderboards</text>
                <text x="70" y="205" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Analytics</text>
              </g>
              
              <g id="standards">
                <rect x="310" y="100" width="180" height="140" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <text x="400" y="120" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12" fontFamily="monospace" fontWeight="bold">STANDARDS</text>
                <text x="330" y="145" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Templates</text>
                <text x="330" y="165" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Environments</text>
                <text x="330" y="185" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Scoring Rules</text>
                <text x="330" y="205" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Benchmarks</text>
              </g>
              
              <g id="participant-side">
                <rect x="570" y="100" width="180" height="140" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <text x="660" y="120" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12" fontFamily="monospace" fontWeight="bold">PARTICIPANT SIDE</text>
                <text x="590" y="145" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Local IDE</text>
                <text x="590" y="165" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Git Workflow</text>
                <text x="590" y="185" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• Push Code</text>
                <text x="590" y="205" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="monospace">• View Results</text>
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
                <text x="400" y="530" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="12" fontFamily="monospace" fontWeight="bold">RESULTS & LEADERBOARDS</text>
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
              <h2 className="text-2xl font-bold font-mono mb-6">Organizer Side</h2>
              <p className="text-muted-foreground font-mono leading-relaxed mb-8">
                Contest organizers, university clubs, and open-source communities configure 
                challenges through our platform. Create development contests like Codeforces does 
                for algorithms — but for real engineering. Define challenge requirements, set up 
                test suites, and configure performance benchmarks.
              </p>
              <ul className="space-y-4 font-mono text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Challenge library with real bugs, missing features, and optimization tasks</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Create custom contests for your university club or community</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Leaderboards with performance metrics, not just correctness</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Track participant progress and evaluate submissions (manual or AI*)</span>
                </li>
              </ul>
            </div>
            <div className="border border-border p-6">
              <div className="font-mono text-xs text-muted-foreground mb-4">
                organizer/challenge.tsx
              </div>
              <pre className="font-mono text-sm text-muted-foreground">
{`interface Challenge {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'bug-fix' | 'feature' | 'optimization' | 'refactor';
  repo: Repository;
  tests: TestSuite;
  constraints: Constraint[];
  scoring: ScoringConfig;
  participants: Participant[];
  status: 'draft' | 'active' | 'closed';
}

interface ScoringConfig {
  functional: number;  // 0-100 weight
  performance: number; // latency, memory
  quality: number;     // code structure
  collaboration: number; // commits, docs
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
                participant/workflow.sh
              </div>
              <pre className="font-mono text-sm text-muted-foreground">
{`# Clone your challenge repository
$ git clone git@wirre.dev:challenge/dev-contest-123.git
$ cd dev-contest-123

# Start development environment (managed)
$ ./scripts/setup-dev.sh

# Work in your preferred IDE
$ code .  # or vim, emacs, IntelliJ...

# Run tests locally, debug, iterate
$ npm test
$ npm run benchmark  # check performance

# Submit via standard Git workflow
$ git add -A
$ git commit -m "Fix memory leak in cache layer"
$ git push origin main

# Get evaluated on functionality + performance
# View results in leaderboard
# *AI evaluation: future feature`}
              </pre>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl font-bold font-mono mb-6">Student/Participant Side</h2>
              <p className="text-muted-foreground font-mono leading-relaxed mb-8">
                Students and engineers work in their own local environment using familiar tools. 
                No browser-based editors. No artificial constraints. 
                Just real engineering work with standard Git workflows — exactly like contributing to real open source projects.
              </p>
              <ul className="space-y-4 font-mono text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Clone and work locally with your preferred IDE and debugger</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Reproducible environments — everyone gets the same starting point</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-muted-foreground">→</span>
                  <span>Push to your own repository — like real engineering and open source</span>
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
            <h2 className="text-2xl font-bold font-mono mb-6">Standards & Fairness</h2>
            <p className="text-muted-foreground font-mono leading-relaxed mb-8">
              Reproducibility and fairness are critical for development contests and practice platforms. 
              WIRRE ensures every participant gets the same starting point, the same tools, and the same evaluation criteria — 
              whether you're preparing for open source programs or competing in a university hackathon.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="border border-border p-6">
              <h3 className="font-mono font-bold mb-4">Challenge Templates</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Pre-built challenges for different skill levels and types: bug fixes, feature additions, 
                performance optimization, refactoring. Custom templates for organizers.
              </p>
            </div>
            <div className="border border-border p-6">
              <h3 className="font-mono font-bold mb-4">Reproducible Environments</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Deterministic dev environments ensure everyone starts from the same baseline. 
                No "works on my machine" excuses — just fair, standardized evaluation.
              </p>
            </div>
            <div className="border border-border p-6">
              <h3 className="font-mono font-bold mb-4">Performance Benchmarks</h3>
              <p className="text-sm text-muted-foreground font-mono">
                Score not just on correctness but on latency, memory usage, and throughput. 
                Learn to optimize like production engineers do.
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
              Ready to practice real engineering?
            </h2>
            <p className="text-muted-foreground font-mono mb-8">
              Sign up to access challenges, compete in contests, or organize your own development competitions.
            </p>
            <Button asChild size="lg">
              <Link to="/signup">Start Practicing</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
