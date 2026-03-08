import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Clock, ExternalLink, CheckCircle } from "lucide-react";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CandidateRoundsProps {
    userId?: string | null;
    embedded?: boolean;
}

export default function CandidateRounds({ userId, embedded = false }: CandidateRoundsProps) {
    // Will load the assessments the candidate registered for from the backend
    const { profile } = useAuth();
    const [activeRounds, setActiveRounds] = useState<any[]>([]);
    const [completedRounds, setCompletedRounds] = useState<any[]>([]);
    const [upcomingRounds, setUpcomingRounds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const loadRounds = async () => {
            setLoading(true);
            const targetId = userId || profile?.id;
            if (!targetId) {
                setLoading(false);
                return;
            }
            try {
                // ensure due assessments are started
                try { await supabase.rpc('mark_due_assessments_started'); } catch (e) { /* ignore */ }

                // auto-complete expired assessments
                try { await supabase.rpc('auto_complete_expired_assessments'); } catch (e) { /* ignore */ }

                // 1) Fetch this user's registrations (IDs) and then load assessments by id (two-step avoids RLS recursion)
                const { data: regs, error: regsErr } = await supabase
                    .from('assessment_registrations')
                    .select('assessment_id,created_at,access_granted,coding_finished_at,peer_review_assigned_at,peer_review_skipped')
                    .eq('user_id', targetId)
                    .order('created_at', { ascending: false });

                let registeredAssessments: any[] = [];
                const accessGrantedMap: Record<string, boolean> = {};
                const registrationDataMap: Record<string, any> = {};
                if (!regsErr && regs && regs.length > 0) {
                    const ids = Array.from(new Set(regs.map((r: any) => r.assessment_id)));
                    // Build maps from registration data
                    regs.forEach((r: any) => {
                        accessGrantedMap[r.assessment_id] = r.access_granted;
                        registrationDataMap[r.assessment_id] = r;
                    });
                    const { data: asses } = await supabase
                        .from('assessments')
                        .select('id,title,status,start_at,duration_minutes,positions,company_user_id,created_at,is_paid,emergency_abandoned,is_sample')
                        .in('id', ids as any[])
                        .order('created_at', { ascending: false });
                    registeredAssessments = asses || [];
                }

                // build companies map for all referenced company_user_id values
                const allCompanyIds = Array.from(new Set((registeredAssessments || []).map((a: any) => a.company_user_id).filter(Boolean)));
                let companiesMap: Record<string, string> = {};
                if (allCompanyIds.length > 0) {
                    const { data: companies } = await supabase
                        .from('companies')
                        .select('user_id,name')
                        .in('user_id', allCompanyIds as any[]);
                    if (companies) companiesMap = Object.fromEntries((companies as any[]).map(c => [c.user_id, c.name]));
                }

                // split registered assessments into active/completed based on status & start time
                const now = new Date();

                // 1. Upcoming: Ready status AND start time is in the future
                const upcomingRegistered = registeredAssessments.filter((a: any) =>
                    a.status === 'ready' &&
                    a.start_at &&
                    new Date(a.start_at) > now
                );

                // 2. Completed: status=completed OR peer_review_skipped (explicit skip, both round types)
                //    OR time-based expiry for non-sample rounds.
                const completed = registeredAssessments.filter((a: any) => {
                    if (upcomingRegistered.includes(a)) return false;

                    const reg = registrationDataMap[a.id];

                    // Explicitly completed at assessment level
                    if (a.status === 'completed') return true;

                    // Candidate explicitly skipped peer review — applies to both sample and normal rounds.
                    // This is the canonical "fully done" signal regardless of round type.
                    if (reg?.peer_review_skipped) return true;

                    // For sample rounds: no time-based completion — each candidate runs independently.
                    // Only peer_review_skipped (above) or assessment-level status signals completion.
                    if (a.is_sample) return false;

                    // For normal rounds: completed once the full window (coding + 1h peer review) has elapsed.
                    // finished_at only means coding submitted; peer review may still be in progress.
                    if (a.start_at && a.duration_minutes) {
                        const endTime = new Date(new Date(a.start_at).getTime() + (a.duration_minutes + 60) * 60000);
                        if (now > endTime) return true;
                    }

                    return false;
                });

                // 3. Active: Everything else
                const active = registeredAssessments.filter((a: any) =>
                    !upcomingRegistered.includes(a) &&
                    !completed.includes(a)
                );

                if (mounted) {
                    setUpcomingRounds(upcomingRegistered.map((a: any) => ({ ...a, company: companiesMap[a.company_user_id] || '' })));
                    setActiveRounds(active.map((a: any) => ({ ...a, company: companiesMap[a.company_user_id] || '' })));
                    setCompletedRounds(completed.map((a: any) => ({ ...a, company: companiesMap[a.company_user_id] || '' })));
                }
            } catch (err) {
                console.error('Error loading assessments:', err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadRounds();

        const channel = supabase
            .channel('rounds-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assessment_registrations' }, () => {
                if (mounted) loadRounds();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments' }, () => {
                if (mounted) loadRounds();
            })
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, [profile?.id]);

    const getStatusBadge = (status: string, start_at?: string | null, isCompleted: boolean = false) => {
        // If this is in the completed section, always show Completed badge
        if (isCompleted) {
            return <Badge variant="outline">Completed</Badge>;
        }

        // If the assessment has a future start time, treat it as Upcoming regardless of status value
        if (start_at && new Date(start_at) > new Date()) {
            return <Badge variant="secondary">Upcoming</Badge>;
        }

        const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
            invited: { label: "Invited", variant: "secondary" },
            in_progress: { label: "In Progress", variant: "default" },
            under_review: { label: "Under Review", variant: "outline" },
            started: { label: "Active", variant: "default" },
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

    const content = (
        <section className="py-2 md:py-8">
            <div className="container px-0 md:px-6 max-w-6xl">
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
                                            <div className="shrink-0">
                                                {getStatusBadge(round.status, round.start_at)}
                                            </div>
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
                                            <div className="shrink-0">
                                                {getStatusBadge(round.status, round.start_at)}
                                            </div>
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
                                                        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-400">
                                                            ⚠️ Round Emergency Abandoned
                                                        </span>
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
                                            <div className="shrink-0">
                                                {getStatusBadge(round.status, round.start_at, true)}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
                                            <Clock className="h-4 w-4 shrink-0" />
                                            <span className="font-mono">
                                                Completed {round.start_at ? new Date(round.start_at).toLocaleDateString('en-GB') : '—'}
                                            </span>
                                        </div>

                                        <Button size="sm" variant="outline" asChild className="font-mono text-xs flex-1 sm:flex-none w-full sm:w-auto">
                                            <Link to={`/candidate/assessment/${round.id}/status`}>
                                                View Result Status
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
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
