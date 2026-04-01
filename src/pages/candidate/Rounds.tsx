import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Clock, CheckCircle } from "lucide-react";
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

    // Keep real-time updates working — invalidate cache on relevant DB changes
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

    const content = (
        <section className="py-2 md:py-8">
            <div className="container px-0 md:px-6 max-w-6xl">
                {isLoading ? <RoundsSkeleton /> : (
                    <>
                        {/* Upcoming Assessments */}
                        <div className="mb-8 md:mb-12">
                            <h3 className="text-lg md:text-xl font-bold font-mono mb-4 px-4 md:px-0 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Upcoming Assessments
                            </h3>
                            <div className="grid gap-4 md:gap-6">
                                {upcomingRounds.length === 0 ? (
                                    <div className="py-12 md:py-20 border border-border/30 bg-card/5 rounded-sm flex flex-col items-center justify-center text-center px-4">
                                        <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center mb-4 opacity-50">
                                            <Clock className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-[10px] md:text-xs text-muted-foreground font-mono uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
                                            No upcoming rounds currently scheduled
                                        </p>
                                    </div>
                                ) : (
                                    upcomingRounds.map((round) => (
                                        <Card key={round.id} className="border-border/50 hover:border-border transition-colors">
                                            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                                                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <CardTitle className="font-mono text-base md:text-xl truncate">{round.title}</CardTitle>
                                                            <Badge variant={round.is_paid ? "default" : "secondary"} className="text-[10px] md:text-xs h-5">
                                                                {round.is_paid ? "Paid" : "Unpaid"}
                                                            </Badge>
                                                        </div>
                                                        <CardDescription className="font-mono text-xs md:text-sm text-primary/80">{round.company}</CardDescription>
                                                    </div>
                                                    <div className="shrink-0">{getStatusBadge(round.status, round.start_at)}</div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs text-muted-foreground mb-6">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 shrink-0" />
                                                        <span className="font-mono">Start: {round.start_at ? new Date(round.start_at).toLocaleString('en-GB') : '—'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono">Duration: {round.duration_minutes ? `${round.duration_minutes}m` : '—'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button size="sm" variant="outline" asChild className="font-mono text-xs flex-1 sm:flex-none">
                                                        <Link to={`/candidate/assessment/${round.id}`}>View Details</Link>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Active Assessments */}
                        <div className="mb-8 md:mb-12">
                            <h3 className="text-lg md:text-xl font-bold font-mono mb-4 px-4 md:px-0 flex items-center gap-2 text-primary">
                                <CheckCircle className="h-4 w-4" />
                                Active Assessments
                            </h3>
                            <div className="grid gap-4 md:gap-6">
                                {activeRounds.length === 0 ? (
                                    <div className="py-12 md:py-20 border border-border/30 bg-card/5 rounded-sm flex flex-col items-center justify-center text-center px-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4 opacity-30">
                                            <CheckCircle className="h-5 w-5 text-primary" />
                                        </div>
                                        <p className="text-[10px] md:text-xs text-muted-foreground font-mono uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
                                            Zero active rounds at this moment
                                        </p>
                                    </div>
                                ) : (
                                    activeRounds.map((round) => (
                                        <Card key={round.id} className="border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors">
                                            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                                                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <CardTitle className="font-mono text-base md:text-xl truncate">{round.title}</CardTitle>
                                                            <Badge variant={round.is_paid ? "default" : "secondary"} className="text-[10px] md:text-xs h-5">
                                                                {round.is_paid ? "Paid" : "Unpaid"}
                                                            </Badge>
                                                        </div>
                                                        <CardDescription className="font-mono text-xs md:text-sm text-primary/80">{round.company}</CardDescription>
                                                    </div>
                                                    <div className="shrink-0">{getStatusBadge(round.status, round.start_at)}</div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-xs text-muted-foreground mb-6">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 shrink-0" />
                                                        <span className="font-mono">Start: {round.start_at ? new Date(round.start_at).toLocaleDateString('en-GB') : '—'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono">Duration: {round.duration_minutes ? `${round.duration_minutes}m` : '—'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <Button size="sm" variant="default" asChild className="font-mono text-xs flex-1 sm:flex-none">
                                                        <Link to={`/candidate/assessment/${round.id}`}>Continue Round</Link>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Completed Assessments */}
                        <div>
                            <h3 className="text-lg md:text-xl font-bold font-mono mb-4 px-4 md:px-0 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                Completed Assessments
                            </h3>
                            <div className="grid gap-4 md:gap-6">
                                {completedRounds.length === 0 ? (
                                    <div className="py-12 md:py-20 border border-border/30 bg-card/5 rounded-sm flex flex-col items-center justify-center text-center px-4">
                                        <div className="h-10 w-10 rounded-full bg-muted/30 flex items-center justify-center mb-4 opacity-50">
                                            <CheckCircle className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-[10px] md:text-xs text-muted-foreground font-mono uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
                                            No completed rounds found in history
                                        </p>
                                    </div>
                                ) : (
                                    completedRounds.map((round) => (
                                        <Card key={round.id} className="opacity-80 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all">
                                            <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                                                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        {round.emergency_abandoned && (
                                                            <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-sm">
                                                                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400">⚠️ Round Emergency Abandoned</span>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <CardTitle className="font-mono text-base md:text-xl truncate">{round.title}</CardTitle>
                                                            <Badge variant={round.is_paid ? "default" : "secondary"} className="text-[10px] md:text-xs h-5">
                                                                {round.is_paid ? "Paid" : "Unpaid"}
                                                            </Badge>
                                                        </div>
                                                        <CardDescription className="font-mono text-xs md:text-sm text-primary/80">{round.company}</CardDescription>
                                                    </div>
                                                    <div className="shrink-0">{getStatusBadge(round.status, round.start_at, true)}</div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                                                    <Clock className="h-4 w-4 shrink-0" />
                                                    <span className="font-mono">Completed {round.start_at ? new Date(round.start_at).toLocaleDateString('en-GB') : '—'}</span>
                                                </div>
                                                <Button size="sm" variant="outline" asChild className="font-mono text-xs flex-1 sm:flex-none w-full sm:w-auto">
                                                    <Link to={`/candidate/assessment/${round.id}/status`}>View Result Status</Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </section>
    );

    if (embedded) return content;
    return (
        <Layout>
            <section className="min-h-[calc(100vh-14rem)] py-8 md:py-24">
                <div className="container px-4 md:px-6 max-w-6xl">
                    <div className="mb-8 md:mb-12 text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-bold font-mono tracking-tight mb-4">My Assessment Rounds</h1>
                        <p className="text-muted-foreground font-mono text-xs md:text-sm">Manage your active and completed assessment rounds</p>
                    </div>
                </div>
                {content}
            </section>
        </Layout>
    );
}
