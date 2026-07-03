import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Building2, Calendar, Users, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useOpportunities } from "@/hooks/queries/useOpportunities";
import { useQueryClient } from "@tanstack/react-query";

function OpportunitiesSkeleton() {
    return (
        <Layout>
            <section className="min-h-[calc(100vh-14rem)] py-24">
                <div className="container max-w-6xl animate-pulse">
                    <div className="mb-12">
                        <div className="h-10 w-64 bg-muted rounded mb-3" />
                        <div className="h-4 w-96 bg-muted/60 rounded mb-6" />
                        <div className="flex gap-2 mb-6">
                            {[...Array(3)].map((_, i) => <div key={i} className="h-8 w-16 bg-muted rounded" />)}
                        </div>
                    </div>
                    <div className="grid gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="border border-border p-6 rounded">
                                <div className="h-5 w-48 bg-muted rounded mb-2" />
                                <div className="h-3 w-32 bg-muted/60 rounded mb-4" />
                                <div className="h-8 w-28 bg-muted/40 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </Layout>
    );
}

export default function CandidateOpportunities() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

    const { data, isLoading } = useOpportunities(profile?.id);
    const opportunities = data?.opportunities ?? [];
    const profileIncomplete = data?.profileIncomplete ?? true;

    // Keep real-time updates
    useEffect(() => {
        const channel = supabase
            .channel('opportunities-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments' }, () => {
                queryClient.invalidateQueries({ queryKey: ['opportunities', profile?.id] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assessment_registrations' }, () => {
                queryClient.invalidateQueries({ queryKey: ['opportunities', profile?.id] });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [profile?.id, queryClient]);

    if (isLoading) return <OpportunitiesSkeleton />;

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB');

    const handleRegister = async (oppId: string) => {
        if (profileIncomplete) {
            toast({ title: "Complete your profile", description: "Add your GitHub URL before registering", variant: "destructive" });
            return;
        }
        try {
            const { data: candidateData, error: candidateError } = await supabase
                .from('candidates')
                .select('github_username, linkedin_url')
                .eq('user_id', profile.id)
                .single();
            if (candidateError) throw new Error('Failed to fetch your profile data');

            const { data: assessmentCheck } = await supabase
                .from('assessments')
                .select('start_at, is_sample')
                .eq('id', oppId)
                .single();

            if (!assessmentCheck?.is_sample && assessmentCheck?.start_at && new Date(assessmentCheck.start_at) <= new Date()) {
                toast({ title: "Registration closed", description: "This assessment has already started and is no longer accepting registrations", variant: "destructive" });
                return;
            }

            const { data: existingReg } = await supabase
                .from('assessment_registrations')
                .select('id')
                .eq('assessment_id', oppId)
                .eq('user_id', profile.id)
                .single();
            if (existingReg) {
                toast({ title: "Already registered", description: "You've already registered for this assessment" });
                return;
            }

            const { error } = await supabase.from('assessment_registrations').insert({ assessment_id: oppId, user_id: profile.id });
            if (error) throw error;

            toast({ title: "Registration successful", description: "You've successfully registered for this assessment." });
            
            // Invalidate multiple queries to ensure all tabs are up to date
            queryClient.invalidateQueries({ queryKey: ['opportunities', profile?.id] });
            queryClient.invalidateQueries({ queryKey: ['candidate-rounds', profile?.id] });
        } catch (err: any) {
            toast({ title: 'Registration failed', description: err?.message || String(err), variant: 'destructive' });
        }
    };

    return (
        <Layout>
            <section className="min-h-[calc(100vh-14rem)] py-24">
                <div className="container max-w-6xl">
                    <div className="mb-12">
                        <h1 className="text-4xl font-bold font-mono tracking-tight mb-4">Upcoming Assessments</h1>
                        <p className="text-muted-foreground font-mono text-sm mb-6">
                            Browse upcoming assessment rounds from organizers hiring on WIRRE
                        </p>

                        <div className="flex gap-2 mb-6">
                            {(['all', 'paid', 'unpaid'] as const).map(f => (
                                <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="font-mono capitalize">
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </Button>
                            ))}
                        </div>

                        {profileIncomplete && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="font-mono text-sm flex items-center justify-between">
                                    <span>Complete your profile with your GitHub username to register for rounds</span>
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
                                                            <a href={opp.company.domain.startsWith('http') ? opp.company.domain : `https://${opp.company.domain}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-foreground transition-colors">
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
                                            {opp.is_paid && (
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Users className="h-4 w-4" />
                                                    <span className="font-mono text-xs">{(opp.positions ?? 1)} positions</span>
                                                </div>
                                            )}
                                            <div className="flex gap-3 ml-auto">
                                                {opp.isRegistered ? (
                                                    <Button size="sm" variant="secondary" disabled>Registered</Button>
                                                ) : (
                                                    <Button size="sm" onClick={() => handleRegister(opp.id)} disabled={profileIncomplete}>Register</Button>
                                                )}
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
                                <h3 className="font-mono text-lg font-semibold mb-2">No opportunities available</h3>
                                <p className="text-sm text-muted-foreground">Check back later for new assessment rounds</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </section>
        </Layout>
    );
}
