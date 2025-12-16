import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, GitPullRequest, Building2, Calendar, Users, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CandidateOpportunities() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [profileIncomplete, setProfileIncomplete] = useState(true); // Will check from DB later

  // Mock data - will be replaced with real data later
  const opportunities = [
    {
      id: 1,
      company: "Acme Corp",
      position: "Frontend Developer",
      title: "React & TypeScript Dashboard Challenge",
      repo: "acme-corp/frontend-challenge",
      duration: "48 hours",
      scheduledDate: "2025-12-20T10:00:00",
      difficulty: "Intermediate",
      positions: 2,
      technologies: ["React", "TypeScript", "Tailwind CSS"],
      description: "Build a responsive analytics dashboard with real-time data visualization. Focus on component architecture and state management.",
    },
    {
      id: 2,
      company: "TechStart Inc",
      position: "Backend Developer",
      positions: 3,
      technologies: ["Node.js", "PostgreSQL", "JWT"],
      description: "Implement secure authentication endpoints with proper password hashing, JWT tokens, and refresh token rotation.",
    },
    {
      id: 3,
      company: "DevHub",
      position: "Full Stack Engineer",
      title: "E-commerce Product Catalog",
      repo: "devhub/ecommerce-challenge",
      duration: "72 hours",
      scheduledDate: "2025-12-25T09:00:00",
      difficulty: "Intermediate",
      positions: 1,
      technologies: ["Next.js", "Prisma", "PostgreSQL"],
      description: "Create a product catalog with search, filtering, and cart functionality. Backend and frontend integration required.",
    },
    {
      id: 4,
      company: "CloudTech Solutions",
      position: "DevOps Engineer",
      title: "CI/CD Pipeline Setup",
      repo: "cloudtech/devops-challenge",
      duration: "48 hours",
      scheduledDate: "2025-12-27T10:00:00",
      difficulty: "Advanced",
      positions: 2neer",
      title: "CI/CD Pipeline Setup",
      repo: "cloudtech/devops-challenge",
      duration: "48 hours",
      scheduledDate: "2025-12-27T10:00:00",
      difficulty: "Advanced",
      technologies: ["Docker", "GitHub Actions", "Kubernetes"],
      description: "Set up automated deployment pipeline with containerization, testing, and monitoring.",
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive"> = {
      Beginner: "secondary",
      Intermediate: "default",
      Advanced: "destructive",
    };
    return colors[difficulty] || "default";
  };

  const formatScheduledDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
  const handleRegister = (oppId: number) => {
    if (profileIncomplete) {
      toast({
        title: "Complete your profile",
        description: "Add your GitHub and LinkedIn URLs before registering",
        variant: "destructive",
      });
    } else {
      toast({ mb-6">
              Browse upcoming assessment rounds from companies hiring on WIRRE
            </p>
            
            {profileIncomplete && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-mono text-sm flex items-center justify-between">
                  <span>Complete your profile with GitHub and LinkedIn URLs to register for rounds</span>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/candidate/profile">Complete Profile</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}ion: "You've been registered for this round",
      });
    }
  };

    });
  };

  return (
    <Layout>
      <section className="min-h-[calc(100vh-14rem)] py-24">
        <div className="container max-w-6xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold font-mono tracking-tight mb-4">
              Opportunities
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              Browse upcoming assessment rounds from companies hiring on WIRRE
            </p>
          </div>

          <div className="grid gap-6">
            {opportunities.map((opp) => (
              <Card key={opp.id} className="hover:border-foreground transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="font-mono text-lg">{opp.position}</CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {opp.company}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={getDifficultyColor(opp.difficulty)}>
                      {opp.difficulty}
                    </Badge>
                  </div>
                  <h3 className="font-mono text-sm font-semibold">{opp.title}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {opp.description}
                  </p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-mono text-xs">
                        {opp.positions} {opp.positions === 1 ? 'position' : 'positions'} available
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button size="sm" onClick={() => handleRegister(opp.id)} disabled={profileIncomplete}h} variant="outline" className="font-mono text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4 pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <GitPullRequest className="h-4 w-4" />
                      <code className="text-xs">{opp.repo}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-mono text-xs">{opp.duration} to complete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-mono text-xs">
                        Starts {formatScheduledDate(opp.scheduledDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button size="sm">
                      Register for Round
                    </Button>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {opportunities.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-mono text-lg font-semibold mb-2">
                  No opportunities available
                </h3>
                <p className="text-sm text-muted-foreground">
                  Check back later for new assessment rounds
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </Layout>
  );
}
