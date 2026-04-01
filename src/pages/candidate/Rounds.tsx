import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, Search } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useCandidateRounds } from "@/hooks/queries/useCandidateRounds";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

interface CandidateRoundsProps {
    userId?: string | null;
    embedded?: boolean;
}

function RoundsSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-border p-4 md:p-6 rounded">
                    <div className="h-5 w-48 bg-muted rounded mb-2" />
                    <div className="h-3 w-32 bg-muted/60 rounded mb-4" />
                    <div className="h-8 w-28 bg-muted/40 rounded" />
                </div>
            ))}
        </div>
    );
}

export default function CandidateRounds({ userId, embedded = false }: CandidateRoundsProps) {
    const { profile } = useAuth();
    const queryClient = useQueryClient();
    const targetId = userId || profile?.id;

    const { data, isLoading } = useCandidateRounds(targetId);

    const activeRounds = data?.activeRounds ?? [];
    const completedRounds = data?.completedRounds ?? [];
    const upcomingRounds = data?.upcomingRounds ?? [];

    const hasAnyRounds = activeRounds.length > 0 || upcomingRounds.length > 0 || completedRounds.length > 0;

    useEffect(() => {
        if (!targetId) return;
        const channel = supabase
            .channel('rounds-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assessment_registrations' }, () => {
                queryClient.invalidateQueries({ queryKey: ['candidate-rounds', targetId] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments' }, () => {
                queryClient.invalidateQueries({ queryKey: ['candidate-rounds', targetId] });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [targetId, queryClient]);

    const getStatusBadge = (status: string, start_at?: string | null, isCompleted: boolean = false) => {
        if (isCompleted) return <Badge variant="outline">Completed</Badge>;
        if (start_at && new Date(start_at) > new Date()) return <Badge variant="secondary">Upcoming</Badge>;
        const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
            invited: { label: "Invited", variant: "secondary" },
            in_progress: { label: "In Progress", variant: "default" },
            under_review: { label: "Under Review", variant: "outline" },
            started: { label: "Active", variant: "default" },
        };
        const config = variants[status] || { label: status, variant: "secondary" };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const RoundCard = ({ round, isCompleted = false }: { round: any; isCompleted?: boolean }) => (
        <Card key={round.id} className={isCompleted
            ? "opacity-70 grayscale-[0.4] hover:opacity-100 hover:grayscale-0 transition-all"
            : round.status === 'started' || round.status === 'in_progress'
                ? "border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors"
                : "border-border/50 hover:border-border transition-colors"
        }>
            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        {round.emergency_abandoned && (
                            <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-sm">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400">⚠️ Round Emergency Abandoned</span>
                            </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <CardTitle className="font-mono text-base md:text-lg truncate">{round.title}</CardTitle>
                            <Badge variant={round.is_paid ? "default" : "secondary"} className="text-[10px] h-5">
                                {round.is_paid ? "Paid" : "Unpaid"}
                            </Badge>
                        </div>
                        <CardDescription className="font-mono text-xs text-primary/70">{round.company}</CardDescription>
                    </div>
                    <div className="shrink-0">{getStatusBadge(round.status, round.start_at, isCompleted)}</div>
                </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6 pt-0">
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-mono">
                            {isCompleted
                                ? `Completed ${round.start_at ? new Date(round.start_at).toLocaleDateString('en-GB') : '—'}`
                                : round.start_at ? new Date(round.start_at).toLocaleString('en-GB') : '—'
                            }
                        </span>
                    </div>
                    {round.duration_minutes && (
                        <span className="font-mono">{round.duration_minutes}m</span>
                    )}
                </div>
                {isCompleted ? (
                    <Button size="sm" variant="outline" asChild className="font-mono text-xs">
                        <Link to={`/candidate/assessment/${round.id}/status`}>View Result Status</Link>
                    </Button>
                ) : upcomingRounds.includes(round) ? (
                    <Button size="sm" variant="outline" asChild className="font-mono text-xs">
                        <Link to={`/candidate/assessment/${round.id}`}>View Details</Link>
                    </Button>
                ) : (
                    <Button size="sm" variant="default" asChild className="font-mono text-xs">
                        <Link to={`/candidate/assessment/${round.id}`}>Continue Round</Link>
                    </Button>
                )}
            </CardContent>
        </Card>
    );

    const content = (
        <section className="py-2 md:py-8">
            <div className="container px-0 md:px-6 max-w-6xl">
                {isLoading ? <RoundsSkeleton /> : !hasAnyRounds ? (
                    /* Single unified empty state */
                    <div className="py-20 border border-border/30 bg-card/5 rounded-sm flex flex-col items-center justify-center text-center px-4">
                        <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-4 opacity-50">
                            <Search className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="font-mono font-bold mb-1">No rounds yet</p>
                        <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-1 mb-6 max-w-[240px]">
                            Register for an assessment to start competing
                        </p>
                        <Button asChild size="sm" className="font-mono uppercase tracking-widest text-xs">
                            <Link to="/candidate/opportunities">Browse Opportunities</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {/* Active */}
                        {activeRounds.length > 0 && (
                            <div>
                                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-primary" /> Active Now
                                </h3>
                                <div className="grid gap-4">
                                    {activeRounds.map(r => <RoundCard key={r.id} round={r} />)}
                                </div>
                            </div>
                        )}

                        {/* Upcoming */}
                        {upcomingRounds.length > 0 && (
                            <div>
                                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5" /> Upcoming
                                </h3>
                                <div className="grid gap-4">
                                    {upcomingRounds.map(r => <RoundCard key={r.id} round={r} />)}
                                </div>
                            </div>
                        )}

                        {/* Completed */}
                        {completedRounds.length > 0 && (
                            <div>
                                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" /> Completed
                                </h3>
                                <div className="grid gap-4">
                                    {completedRounds.map(r => <RoundCard key={r.id} round={r} isCompleted />)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );

    if (embedded) return content;
    return (
        <Layout>
            <section className="min-h-[calc(100vh-14rem)] py-8 md:py-24">
                <div className="container px-4 md:px-6 max-w-6xl">
                    <div className="mb-8 md:mb-12">
                        <h1 className="text-3xl md:text-4xl font-bold font-mono tracking-tight mb-2">My Rounds</h1>
                        <p className="text-muted-foreground font-mono text-xs md:text-sm">Your active and completed assessment rounds</p>
                    </div>
                </div>
                {content}
            </section>
        </Layout>
    );
}
