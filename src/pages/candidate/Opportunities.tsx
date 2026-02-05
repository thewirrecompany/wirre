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
    const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

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
                .select('id,title,company_user_id,created_at,technologies,duration_minutes,start_at,positions,is_paid')
                .eq('status', 'ready')
                .order('created_at', { ascending: false });

            console.log('Opportunities raw data:', data);
            console.log('Opportunities error:', error);

            if (error) {
                console.error('Error loading opportunities:', error);
                return;
            }

            const assessments = data || [];

            // fetch organizer names for the company_user_id values
            const userIds = Array.from(new Set(assessments.map((a: any) => a.company_user_id).filter(Boolean)));
            let companiesMap: Record<string, string> = {};
            if (userIds.length > 0) {
                const { data: companies } = await supabase
                    .from('companies')
                    .select('user_id,name,domain')
                    .in('user_id', userIds as any[]);
                if (companies) {
                    console.log('Fetched companies:', companies);
                    companiesMap = Object.fromEntries((companies as any[]).map(c => [
                        c.user_id,
                        { name: c.name, domain: c.domain }
                    ] as any));
                } else {
                    console.log('No companies fetched (likely RLS restriction)');
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
                .map((a: any) => ({ ...a, company: companiesMap[a.company_user_id] || { name: 'Unknown', domain: '' } }));

            setOpportunities(enriched);
        } catch (err) {
            console.error('Error loading opportunities:', err);
        }
    }

    // opportunities loaded from DB where status = 'ready'

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB');
    };

    const handleRegister = async (oppId: string) => {
        if (profileIncomplete) {
            toast({ title: "Complete your profile", description: "Add your GitHub and LinkedIn URLs before registering", variant: "destructive" });
            return;
        }

        try {
            // First, get the candidate's profile data
            const { data: candidateData, error: candidateError } = await supabase
                .from('candidates')
                .select('github_username, linkedin_url')
                .eq('user_id', profile.id)
                .single();

            if (candidateError) {
                console.error('Error fetching candidate profile:', candidateError);
                throw new Error('Failed to fetch your profile data');
            }

            const githubUsername = candidateData?.github_username || '';

            // Check if assessment has started (block registrations after start_at)
            const { data: assessmentCheck } = await supabase
                .from('assessments')
                .select('start_at')
                .eq('id', oppId)
                .single();

            if (assessmentCheck?.start_at && new Date(assessmentCheck.start_at) <= new Date()) {
                toast({
                    title: "Registration closed",
                    description: "This assessment has already started and is no longer accepting registrations",
                    variant: "destructive"
                });
                return;
            }

            // Step 1: Check if already registered
            const { data: existingReg } = await supabase
                .from('assessment_registrations')
                .select('id')
                .eq('assessment_id', oppId)
                .eq('user_id', profile.id)
                .single();

            if (existingReg) {
                toast({
                    title: "Already registered",
                    description: "You've already registered for this assessment",
                    variant: "default"
                });
                return;
            }

            // Step 2: Register in assessment_registrations table
            const { error } = await supabase.from('assessment_registrations').insert({ assessment_id: oppId, user_id: profile.id });
            if (error) throw error;

            toast({
                title: "Registration successful",
                description: "Setting up your private repository...",
            });

            // Step 2: Provision private repository for candidate (but don't grant access yet)
            if (githubUsername) {
                const provisionResponse = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/provision-candidate-repo`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                        },
                        body: JSON.stringify({
                            assessmentId: oppId,
                            candidateUserId: profile.id,
                            candidateGithubUsername: githubUsername,
                        }),
                    }
                );

                if (!provisionResponse.ok) {
                    const errorData = await provisionResponse.json();
                    console.error('Failed to provision repository:', errorData);
                    console.error('Full error details:', JSON.stringify(errorData, null, 2));

                    // If organizer hasn't set up GitHub access, show appropriate message
                    if (errorData.error?.includes('GitHub installation not found')) {
                        toast({
                            title: "Registration complete",
                            description: "The organizer will set up your repository soon. You'll get access when the assessment starts.",
                            variant: "default",
                        });
                    } else {
                        // Log the actual error for debugging
                        console.error('Provisioning error message:', errorData.error);
                        toast({
                            title: "Registration complete",
                            description: "Your repository will be provisioned shortly. You'll get access when the assessment starts.",
                            variant: "default",
                        });
                    }
                } else {
                    const result = await provisionResponse.json();
                    toast({
                        title: "All set!",
                        description: `Repository created. You'll get access when the assessment starts.`,
                    });
                }
            } else {
                toast({
                    title: "Registration successful",
                    description: "You'll receive your repository access when the assessment starts"
                });
            }

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
                            Upcoming Assessments
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm mb-6">
                            Browse upcoming assessment rounds from organizers hiring on WIRRE
                        </p>

                        <div className="flex gap-2 mb-6">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                                className="font-mono"
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === 'paid' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('paid')}
                                className="font-mono"
                            >
                                Paid
                            </Button>
                            <Button
                                variant={filter === 'unpaid' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('unpaid')}
                                className="font-mono"
                            >
                                Unpaid
                            </Button>
                        </div>

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
                        {opportunities
                            .filter((opp) => {
                                if (filter === 'paid') return opp.is_paid;
                                if (filter === 'unpaid') return !opp.is_paid;
                                return true;
                            })
                            .map((opp) => (
                                <Card key={opp.id} className="hover:border-foreground transition-colors">
                                    <CardHeader>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <CardTitle className="font-mono text-lg">{opp.title || 'Assessment'}</CardTitle>
                                                        <Badge variant={opp.is_paid ? "default" : "secondary"} className="text-xs">
                                                            {opp.is_paid ? "Paid" : "Unpaid"}
                                                        </Badge>
                                                    </div>
                                                    <div className="font-mono text-xs text-muted-foreground">
                                                        {opp.company?.domain ? (
                                                            <a
                                                                href={opp.company.domain.startsWith('http') ? opp.company.domain : `https://${opp.company.domain}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="hover:underline hover:text-foreground transition-colors"
                                                            >
                                                                {opp.company?.name || 'Unknown Organizer'}
                                                            </a>
                                                        ) : (
                                                            <span>{opp.company?.name || 'Unknown Organizer'}</span>
                                                        )}
                                                    </div>
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
                                            {/* Positions - Only show for Paid assessments */}
                                            {opp.is_paid && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Users className="h-4 w-4" />
                                                    <span className="font-mono text-xs">{(opp.positions ?? 1)} positions</span>
                                                </div>
                                            )}
                                            <div className="flex gap-3 ml-auto">
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
