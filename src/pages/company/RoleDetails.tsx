import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitPullRequest, Clock, TrendingUp, User, Briefcase } from "lucide-react";

export default function RoleDetails() {
  const { roleId } = useParams();

  // Mock data - will be replaced with real data later
  const role = {
    id: roleId,
    title: "Senior Backend Engineer",
    repo: "acme-corp/backend-challenge",
    description: "Build scalable REST APIs with Node.js and PostgreSQL",
    deadline: "2025-12-20T23:59:59",
    positions: 2,
    totalCandidates: 12,
    submissions: 8,
    avgScore: 78,
    createdAt: "2024-01-15",
  };

  const topCandidates = [
    { id: "1", candidateId: "#A7B2", score: 94, prLink: "https://github.com/acme/challenge/pull/42", submittedAt: "2025-12-14T10:30:00", codeQuality: 92, architecture: 95, testing: 93 },
    { id: "2", candidateId: "#C4D9", score: 89, prLink: "https://github.com/acme/challenge/pull/38", submittedAt: "2025-12-13T15:20:00", codeQuality: 88, architecture: 90, testing: 89 },
    { id: "3", candidateId: "#E1F3", score: 85, prLink: "https://github.com/acme/challenge/pull/35", submittedAt: "2025-12-12T09:45:00", codeQuality: 87, architecture: 84, testing: 84 },
    { id: "4", candidateId: "#G8H2", score: 82, prLink: "https://github.com/acme/challenge/pull/31", submittedAt: "2025-12-11T18:00:00", codeQuality: 83, architecture: 81, testing: 82 },
    { id: "5", candidateId: "#I5J7", score: 78, prLink: "https://github.com/acme/challenge/pull/29", submittedAt: "2025-12-11T12:30:00", codeQuality: 79, architecture: 77, testing: 78 },
    { id: "6", candidateId: "#K3L6", score: 75, prLink: "https://github.com/acme/challenge/pull/26", submittedAt: "2025-12-10T16:15:00", codeQuality: 76, architecture: 74, testing: 75 },
    { id: "7", candidateId: "#M9N4", score: 71, prLink: "https://github.com/acme/challenge/pull/23", submittedAt: "2025-12-10T10:00:00", codeQuality: 72, architecture: 70, testing: 71 },
    { id: "8", candidateId: "#O2P8", score: 68, prLink: "https://github.com/acme/challenge/pull/19", submittedAt: "2025-12-09T14:45:00", codeQuality: 69, architecture: 67, testing: 68 },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <Layout>
      <section className="min-h-[calc(100vh-14rem)] py-24">
        <div className="container max-w-6xl">
          {/* Back Button */}
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/company/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          {/* Role Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold font-mono tracking-tight mb-2">
              {role.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono">
              <code className="text-xs">{role.repo}</code>
              <span>•</span>
              <span>Created {new Date(role.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="mt-4 text-muted-foreground">{role.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Positions</span>
                </div>
                <p className="text-3xl font-bold font-mono">{role.positions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Candidates</span>
                </div>
                <p className="text-3xl font-bold font-mono">{role.totalCandidates}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <GitPullRequest className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Submissions</span>
                </div>
                <p className="text-3xl font-bold font-mono">{role.submissions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Avg Score</span>
                </div>
                <p className="text-3xl font-bold font-mono">{role.avgScore}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Deadline</span>
                </div>
                <p className="text-lg font-bold font-mono">
                  {new Date(role.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Candidates */}
          <div>
            <h2 className="text-2xl font-bold font-mono mb-6">Top Candidates</h2>
            <div className="border border-border">
              <div className="grid grid-cols-6 gap-4 p-4 border-b border-border text-sm text-muted-foreground font-mono uppercase tracking-wider">
                <span>Rank</span>
                <span>Candidate</span>
                <span>Overall Score</span>
                <span>Code Quality</span>
                <span>Architecture</span>
                <span>Testing</span>
              </div>
              {topCandidates.map((candidate, index) => (
                <Link
                  key={candidate.id}
                  to={`/company/candidate/${candidate.id}`}
                  className="grid grid-cols-6 gap-4 p-4 border-b border-border last:border-b-0 font-mono text-sm hover:bg-secondary/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {index < 3 && (
                      <Badge variant={index === 0 ? "default" : "secondary"} className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                    )}
                    {index >= 3 && (
                      <span className="text-muted-foreground">{index + 1}</span>
                    )}
                  </div>
                  <span className="font-mono font-semibold">{candidate.candidateId}</span>
                  <span className={`font-bold ${getScoreColor(candidate.score)}`}>
                    {candidate.score}/100
                  </span>
                  <span className="text-muted-foreground">{candidate.codeQuality}/100</span>
                  <span className="text-muted-foreground">{candidate.architecture}/100</span>
                  <span className="text-muted-foreground">{candidate.testing}/100</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
