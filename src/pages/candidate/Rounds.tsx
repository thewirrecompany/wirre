import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, GitPullRequest, ExternalLink } from "lucide-react";

export default function CandidateRounds() {
  // Mock data - will be replaced with real data later
  const activeRounds = [
    {
      id: 1,
      title: "Frontend Developer Assessment",
      company: "Acme Corp",
      repo: "acme-corp/frontend-challenge",
      deadline: "2025-12-18T23:59:59",
      status: "in_progress",
      description: "Build a responsive dashboard with React and TypeScript",
    },
    {
      id: 2,
      title: "Backend API Challenge",
      company: "TechStart Inc",
      repo: "techstart/api-challenge",
      deadline: "2025-12-20T23:59:59",
      status: "invited",
      description: "Create REST API endpoints with proper authentication",
    },
  ];

  const completedRounds = [
    {
      id: 3,
      title: "Full Stack Assessment",
      company: "DevHub",
      submittedAt: "2025-12-14T10:30:00",
      status: "under_review",
      prLink: "https://github.com/devhub/challenge/pull/42",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      invited: { label: "Invited", variant: "secondary" },
      in_progress: { label: "In Progress", variant: "default" },
      under_review: { label: "Under Review", variant: "outline" },
    };
    
    const config = variants[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const hours = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hours < 24) return `${hours}h remaining`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  };

  return (
    <Layout>
      <section className="min-h-[calc(100vh-14rem)] py-24">
        <div className="container max-w-6xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold font-mono tracking-tight mb-4">
              Assessment Rounds
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              Manage your active and completed assessment rounds
            </p>
          </div>

          {/* Active Rounds */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold font-mono mb-6">Active Rounds</h2>
            <div className="grid gap-6">
              {activeRounds.map((round) => (
                <Card key={round.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-mono">{round.title}</CardTitle>
                        <CardDescription className="font-mono mt-1">
                          {round.company}
                        </CardDescription>
                      </div>
                      {getStatusBadge(round.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {round.description}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <GitPullRequest className="h-4 w-4" />
                        <code className="text-xs">{round.repo}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono text-xs">
                          {getTimeRemaining(round.deadline)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {round.status === "invited" ? (
                        <Button size="sm">
                          Start Assessment
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Repository
                          </Button>
                          <Button size="sm">
                            Submit Pull Request
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Completed Rounds */}
          <div>
            <h2 className="text-2xl font-bold font-mono mb-6">Completed Rounds</h2>
            <div className="grid gap-6">
              {completedRounds.map((round) => (
                <Card key={round.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-mono">{round.title}</CardTitle>
                        <CardDescription className="font-mono mt-1">
                          {round.company}
                        </CardDescription>
                      </div>
                      {getStatusBadge(round.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono text-xs">
                          Submitted {new Date(round.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" asChild>
                      <a href={round.prLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Pull Request
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
