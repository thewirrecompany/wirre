import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, GitPullRequest } from "lucide-react";
import { Link } from "react-router-dom";

export default function CompanyRounds() {
  // Mock data - will be replaced with real data later
  const activeRounds = [
    {
      id: 1,
      title: "Frontend Developer Assessment",
      repo: "acme-corp/frontend-challenge",
      candidates: 12,
      pendingReviews: 5,
      createdAt: "2025-12-10T10:00:00",
      deadline: "2025-12-20T23:59:59",
    },
    {
      id: 2,
      title: "Backend API Challenge",
      repo: "acme-corp/api-challenge",
      candidates: 8,
      pendingReviews: 2,
      createdAt: "2025-12-12T14:30:00",
      deadline: "2025-12-22T23:59:59",
    },
  ];

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const hours = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hours < 24) return `${hours}h remaining`;
    const days = Math.floor(hours / 24);
    return `${days} days remaining`;
  };

  return (
    <Layout>
      <section className="min-h-[calc(100vh-14rem)] py-24">
        <div className="container max-w-6xl">
          <div className="mb-12 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold font-mono tracking-tight mb-4">
                Assessments
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                Manage your active assessments and review candidate submissions
              </p>
            </div>
            {/* Create Assessment removed per request */}
          </div>

          {/* Active Assessments */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold font-mono mb-6">Active Assessments</h2>
            <div className="grid gap-6">
              {activeRounds.map((round) => (
                <Card key={round.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-mono">{round.title}</CardTitle>
                        <CardDescription className="font-mono mt-1">
                          <code className="text-xs">{round.repo}</code>
                        </CardDescription>
                      </div>
                      {round.pendingReviews > 0 && (
                        <Badge variant="default">
                          {round.pendingReviews} pending reviews
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="font-mono text-xs">
                          {round.candidates} candidates
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="h-4 w-4" />
                        <span className="font-mono text-xs">
                          {round.pendingReviews} PRs to review
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono text-xs">
                          {getTimeRemaining(round.deadline)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button size="sm">
                        Review Submissions
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        Invite Candidates
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Empty state if no assessments */}
          {activeRounds.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <GitPullRequest className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-mono text-lg font-semibold mb-2">
                  No active assessments
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Create your first assessment to start evaluating candidates
                </p>
                {/* Create New Role removed */}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </Layout>
  );
}
