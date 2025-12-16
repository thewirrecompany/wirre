import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, GitPullRequest, Building2, Calendar, Users, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";

export default function CandidateOpportunities() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [profileIncomplete, setProfileIncomplete] = useState(true);
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<any[]>([]);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('github_username, linkedin_url')
          .eq('user_id', profile.id)
          .single();

        if (error) {
          console.error('Error checking profile:', error);
          setLoading(false);
          return;
        }

        // Profile is complete if both github_username and linkedin_url are filled
        const isComplete = !!(data?.github_username && data?.linkedin_url);
        setProfileIncomplete(!isComplete);
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setLoading(false);
      }
    };

    checkProfileCompletion();
    loadOpportunities();
  }, [profile?.id]);

  async function loadOpportunities() {
    try {
      // ensure any due assessments are marked started
      try { await supabase.rpc('mark_due_assessments_started'); } catch (e) { /* ignore */ }

      // only show assessments that are marked ready
      const { data, error } = await supabase
        .from('assessments')
        .select('id,title,company_user_id,created_at,technologies,duration_minutes,start_at,positions')
        .eq('status', 'ready')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading opportunities:', error);
        return;
      }

      const assessments = data || [];

      // fetch company names for the company_user_id values
      const userIds = Array.from(new Set(assessments.map((a: any) => a.company_user_id).filter(Boolean)));
      let companiesMap: Record<string,string> = {};
      if (userIds.length > 0) {
        const { data: companies } = await supabase
          .from('companies')
          .select('user_id,name')
          .in('user_id', userIds as any[]);
        if (companies) {
          companiesMap = Object.fromEntries((companies as any[]).map(c => [c.user_id, c.name]));
        }
      }

      // fetch registrations for current user to filter out already-registered assessments
      const registeredIds: string[] = [];
      if (profile?.id) {
        const { data: regs } = await supabase
          .from('assessment_registrations')
          .select('assessment_id')
          .eq('user_id', profile.id);
        if (regs) regs.forEach((r: any) => registeredIds.push(r.assessment_id));
      }

      const enriched = assessments
        .filter((a: any) => !registeredIds.includes(a.id))
        .map((a: any) => ({ ...a, company_name: companiesMap[a.company_user_id] || '' }));

      setOpportunities(enriched);
    } catch (err) {
      console.error('Error loading opportunities:', err);
    }
  }

  // opportunities loaded from DB where status = 'ready'

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  const handleRegister = async (oppId: string) => {
    if (profileIncomplete) {
      toast({ title: "Complete your profile", description: "Add your GitHub and LinkedIn URLs before registering", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from('assessment_registrations').insert({ assessment_id: oppId, user_id: profile.id });
      if (error) throw error;
      toast({ title: "Registration successful", description: "You've been registered for this round" });
      // refresh lists
      loadOpportunities();
    } catch (err: any) {
      console.error('Error registering:', err);
      toast({ title: 'Registration failed', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  return (
    <Layout>
      <section className="min-h-[calc(100vh-14rem)] py-24">
        <div className="container max-w-6xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold font-mono tracking-tight mb-4">
              Opportunities
            </h1>
            <p className="text-muted-foreground font-mono text-sm mb-6">
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
            )}
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
                        <CardTitle className="font-mono text-lg">{opp.title || 'Assessment'}</CardTitle>
                        <CardDescription className="font-mono text-xs">{opp.company_name || ''}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4 pb-4 border-b">
                    {/* Repo and classroom links are intentionally hidden from candidates until they register and the round starts */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-mono text-xs">Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-mono text-xs">Posted {formatDate(opp.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="font-mono text-xs">{(opp.positions ?? 1)} positions</span>
                    </div>
                    <div className="flex gap-3">
                      <Button size="sm" onClick={() => handleRegister(opp.id)} disabled={profileIncomplete}>
                        Register
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/candidate/assessment/${opp.id}`}>View</Link>
                      </Button>
                    </div>
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