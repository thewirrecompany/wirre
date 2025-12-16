import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Users, CheckCircle } from "lucide-react";

const activeAssessments = [
  { id: "1", role: "Senior Backend Engineer", candidates: 12, status: "active", created: "2024-01-15" },
  { id: "2", role: "Platform Engineer", candidates: 8, status: "active", created: "2024-01-10" },
  { id: "3", role: "Staff Systems Engineer", candidates: 5, status: "active", created: "2024-01-08" },
];

const candidatesInProgress = [
  { id: "1", name: "Candidate #A7B2", assessment: "Senior Backend Engineer", progress: 75, started: "2h ago" },
  { id: "2", name: "Candidate #C4D9", assessment: "Platform Engineer", progress: 40, started: "5h ago" },
  { id: "3", name: "Candidate #E1F3", assessment: "Senior Backend Engineer", progress: 90, started: "1d ago" },
];

const completedEvaluations = [
  { id: "1", name: "Candidate #G8H2", assessment: "Staff Systems Engineer", score: 87, completed: "2024-01-14" },
  { id: "2", name: "Candidate #I5J7", assessment: "Senior Backend Engineer", score: 72, completed: "2024-01-13" },
  { id: "3", name: "Candidate #K3L6", assessment: "Platform Engineer", score: 91, completed: "2024-01-12" },
];

export default function CompanyDashboard() {
  return (
    <Layout>
      <div className="py-12">
        <div className="container">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
            <div>
              <h1 className="text-3xl font-bold font-mono tracking-tight">
                Dashboard
              </h1>
              <p className="text-muted-foreground font-mono text-sm mt-1">
                Manage assessments and track candidates
              </p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" asChild>
                <Link to="/company/reports">
                  <FileText className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </Button>
              <Button asChild>
                <Link to="/company/assessments/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assessment
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Active</span>
              </div>
              <p className="text-3xl font-bold font-mono">{activeAssessments.length}</p>
            </div>
            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">In Progress</span>
              </div>
              <p className="text-3xl font-bold font-mono">{candidatesInProgress.length}</p>
            </div>
            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Completed</span>
              </div>
              <p className="text-3xl font-bold font-mono">{completedEvaluations.length}</p>
            </div>
          </div>

          {/* Active Assessments */}
          <section className="mb-12">
            <h2 className="text-xl font-bold font-mono mb-6">Active Assessments</h2>
            <div className="border border-border">
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-border text-sm text-muted-foreground font-mono uppercase tracking-wider">
                <span>Role</span>
                <span>Candidates</span>
                <span>Status</span>
                <span>Created</span>
              </div>
              {activeAssessments.map((assessment) => (
                <div key={assessment.id} className="grid grid-cols-4 gap-4 p-4 border-b border-border last:border-b-0 font-mono text-sm hover:bg-secondary/50 transition-colors">
                  <span>{assessment.role}</span>
                  <span>{assessment.candidates}</span>
                  <span className="uppercase text-xs tracking-wider">{assessment.status}</span>
                  <span className="text-muted-foreground">{assessment.created}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Candidates in Progress */}
          <section className="mb-12">
            <h2 className="text-xl font-bold font-mono mb-6">Candidates in Progress</h2>
            <div className="border border-border">
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-border text-sm text-muted-foreground font-mono uppercase tracking-wider">
                <span>Candidate</span>
                <span>Assessment</span>
                <span>Progress</span>
                <span>Started</span>
              </div>
              {candidatesInProgress.map((candidate) => (
                <div key={candidate.id} className="grid grid-cols-4 gap-4 p-4 border-b border-border last:border-b-0 font-mono text-sm hover:bg-secondary/50 transition-colors">
                  <span>{candidate.name}</span>
                  <span>{candidate.assessment}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-secondary">
                      <div 
                        className="h-1 bg-foreground" 
                        style={{ width: `${candidate.progress}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs">{candidate.progress}%</span>
                  </div>
                  <span className="text-muted-foreground">{candidate.started}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Completed Evaluations */}
          <section>
            <h2 className="text-xl font-bold font-mono mb-6">Recent Evaluations</h2>
            <div className="border border-border">
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-border text-sm text-muted-foreground font-mono uppercase tracking-wider">
                <span>Candidate</span>
                <span>Assessment</span>
                <span>Score</span>
                <span>Completed</span>
              </div>
              {completedEvaluations.map((evaluation) => (
                <div key={evaluation.id} className="grid grid-cols-4 gap-4 p-4 border-b border-border last:border-b-0 font-mono text-sm hover:bg-secondary/50 transition-colors">
                  <span>{evaluation.name}</span>
                  <span>{evaluation.assessment}</span>
                  <span>{evaluation.score}/100</span>
                  <span className="text-muted-foreground">{evaluation.completed}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Prototype Notice */}
          <div className="mt-12 p-4 border border-border bg-secondary/50">
            <p className="text-xs text-muted-foreground font-mono">
              Dashboard functionality not yet active. This is a frontend prototype only. All data is placeholder.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
