import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Github, Linkedin, CheckCircle } from "lucide-react";

export default function CandidateProfile() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || '');
        setGithubUsername(data.github_username || '');
        setLinkedinUrl(data.linkedin_url || '');
        
        // Check if profile is complete
        const complete = !!(data.full_name && data.github_username && data.linkedin_url);
        setIsComplete(complete);
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!fullName || !githubUsername || !linkedinUrl) {
        throw new Error('All fields are required');
      }

      // Validate GitHub username format
      if (!/^[a-zA-Z0-9-]+$/.test(githubUsername)) {
        throw new Error('Invalid GitHub username format');
      }

      // Validate LinkedIn URL
      if (!linkedinUrl.includes('linkedin.com/in/')) {
        throw new Error('Please enter a valid LinkedIn profile URL');
      }

      const { error } = await supabase
        .from('candidates')
        .update({
          full_name: fullName,
          github_username: githubUsername,
          linkedin_url: linkedinUrl,
        })
        .eq('user_id', user!.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });

      setIsComplete(true);
      
      // Redirect to opportunities page after 1 second
      setTimeout(() => {
        navigate('/candidate/opportunities');
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="min-h-[calc(100vh-14rem)] flex items-center py-24">
        <div className="container max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="font-mono text-2xl">Complete Your Profile</CardTitle>
              <CardDescription className="font-mono">
                Add your GitHub and LinkedIn to participate in assessment rounds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isComplete && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-mono text-sm font-semibold text-green-500">Profile Complete</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      You can now register for assessment rounds
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="font-mono text-sm">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="font-mono"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="github" className="font-mono text-sm flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    GitHub Username
                  </Label>
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary text-muted-foreground text-sm font-mono">
                      github.com/
                    </span>
                    <Input
                      id="github"
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      placeholder="janedoe"
                      className="font-mono rounded-l-none"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Your GitHub username (e.g., "janedoe" from github.com/janedoe)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="font-mono text-sm flex items-center gap-2">
                    <Linkedin className="h-4 w-4" />
                    LinkedIn Profile URL
                  </Label>
                  <Input
                    id="linkedin"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/janedoe"
                    className="font-mono"
                    required
                  />
                  <p className="text-xs text-muted-foreground font-mono">
                    Your full LinkedIn profile URL
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Saving..." : isComplete ? "Update Profile" : "Complete Profile"}
                  </Button>
                  {isComplete && (
                    <Button type="button" variant="outline" onClick={() => navigate('/candidate/opportunities')}>
                      Browse Opportunities
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
}
