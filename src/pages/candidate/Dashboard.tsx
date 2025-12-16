import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Terminal, Clock, CheckCircle, ArrowRight } from "lucide-react";

const activeAssessments = [
  { id: "abc123", role: "Senior Backend Engineer", company: "Acme Corp", deadline: "2024-01-20", status: "in_progress" },
  { id: "def456", role: "Platform Engineer", company: "TechCo", deadline: "2024-01-22", status: "not_started" },
];

const pastAttempts = [
  { id: "ghi789", role: "Backend Engineer", company: "StartupX", completed: "2024-01-10", score: 82 },
  { id: "jkl012", role: "Systems Engineer", company: "BigCorp", completed: "2024-01-05", score: 76 },
];

const capabilityReports = [
  { id: "1", assessment: "Backend Engineer @ StartupX", date: "2024-01-10", status: "available" },
  { id: "2", assessment: "Systems Engineer @ BigCorp", date: "2024-01-05", status: "available" },
];

export default function CandidateDashboard() {
  return (
    <Layout>
      <div className="py-12">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold font-mono tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">
              Your assessments and capability reports
            </p>
          </div>

          {/* Terminal-style status */}
          <div className="mb-12 border border-border p-6 font-mono">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
              <Terminal className="h-4 w-4" />
              <span>status</span>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="text-muted-foreground">active_assessments:</span> {activeAssessments.length}</p>
              <p><span className="text-muted-foreground">completed:</span> {pastAttempts.length}</p>
              <p><span className="text-muted-foreground">reports_available:</span> {capabilityReports.length}</p>
            </div>
          </div>

          {/* Active Assessments */}
          <section className="mb-12">
            <h2 className="text-xl font-bold font-mono mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Assessments
            </h2>
            <div className="space-y-2">
              {activeAssessments.map((assessment) => (
                <Link
                  key={assessment.id}
                  to={`/candidate/assessment/${assessment.id}`}
                  className="block border border-border p-6 hover:border-foreground transition-colors group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-mono font-bold">{assessment.role}</h3>
                      <p className="text-sm text-muted-foreground font-mono mt-1">
                        {assessment.company}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-mono uppercase tracking-wider ${
                        assessment.status === "in_progress" 
                          ? "text-foreground" 
                          : "text-muted-foreground"
                      }`}>
                        {assessment.status.replace("_", " ")}
                      </span>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        Due: {assessment.deadline}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    <span className="font-mono">Open assessment</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Past Attempts */}
          <section className="mb-12">
            <h2 className="text-xl font-bold font-mono mb-6 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Past Attempts
            </h2>
            <div className="border border-border">
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-border text-sm text-muted-foreground font-mono uppercase tracking-wider">
                <span>Role</span>
                <span>Company</span>
                <span>Score</span>
                <span>Completed</span>
              </div>
              {pastAttempts.map((attempt) => (
                <div key={attempt.id} className="grid grid-cols-4 gap-4 p-4 border-b border-border last:border-b-0 font-mono text-sm">
                  <span>{attempt.role}</span>
                  <span>{attempt.company}</span>
                  <span>{attempt.score}/100</span>
                  <span className="text-muted-foreground">{attempt.completed}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Capability Reports */}
          <section className="mb-12">
            <h2 className="text-xl font-bold font-mono mb-6">Capability Reports</h2>
            <div className="space-y-2">
              {capabilityReports.map((report) => (
                <div key={report.id} className="border border-border p-4 flex justify-between items-center">
                  <div>
                    <p className="font-mono text-sm">{report.assessment}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{report.date}</p>
                  </div>
                  <button className="font-mono text-xs uppercase tracking-wider border border-border px-4 py-2 hover:bg-foreground hover:text-background transition-colors">
                    View Report
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Prototype Notice */}
          <div className="p-4 border border-border bg-secondary/50">
            <p className="text-xs text-muted-foreground font-mono">
              Dashboard functionality not yet active. This is a frontend prototype only. All data is placeholder.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
