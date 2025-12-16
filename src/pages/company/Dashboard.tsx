import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Users, GitPullRequest } from "lucide-react";

const activeRoles = [
  { id: "1", role: "Senior Backend Engineer", positions: 2, candidates: 12, submissions: 8, avgScore: 78, created: "2024-01-15" },
  { id: "2", role: "Platform Engineer", positions: 3, candidates: 8, submissions: 5, avgScore: 82, created: "2024-01-10" },
  { id: "3", role: "Staff Systems Engineer", positions: 1, candidates: 5, submissions: 3, avgScore: 85, created: "2024-01-08" },
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
                Manage open roles and review candidates
              </p>
            </div>
            <Button asChild>
              <Link to="/company/assessments/new">
                <Plus className="h-4 w-4 mr-2" />
                Hire
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Active Roles</span>
              </div>
              <p className="text-3xl font-bold font-mono">{activeRoles.length}</p>
            </div>
            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Total Candidates</span>
              </div>
              <p className="text-3xl font-bold font-mono">{activeRoles.reduce((acc, r) => acc + r.candidates, 0)}</p>
            </div>
            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <GitPullRequest className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">PR Submissions</span>
              </div>
              <p className="text-3xl font-bold font-mono">{activeRoles.reduce((acc, r) => acc + r.submissions, 0)}</p>
            </div>
          </div>

          {/* Active Roles */}
          <section>
            <h2 className="text-xl font-bold font-mono mb-6">Active Roles</h2>
            <div className="border border-border">
              <div className="grid grid-cols-6 gap-4 p-4 border-b border-border text-sm text-muted-foreground font-mono uppercase tracking-wider">
                <span>Role</span>
                <span>Positions</span>
                <span>Candidates</span>
                <span>Submissions</span>
                <span>Avg Score</span>
                <span>Created</span>
              </div>
              {activeRoles.map((role) => (
                <Link 
                  key={role.id} 
                  to={`/company/role/${role.id}`}
                  className="grid grid-cols-6 gap-4 p-4 border-b border-border last:border-b-0 font-mono text-sm hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <span className="font-semibold">{role.role}</span>
                  <span>{role.positions}</span>
                  <span>{role.candidates}</span>
                  <span>{role.submissions}</span>
                  <span>{role.avgScore}/100</span>
                  <span className="text-muted-foreground">{role.created}</span>
                </Link>
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
