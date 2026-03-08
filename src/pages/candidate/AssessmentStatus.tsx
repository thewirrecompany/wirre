import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from '@/lib/supabase';

export default function AssessmentStatus() {
    const { id } = useParams();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [assessment, setAssessment] = useState<any | null>(null);
    const [registration, setRegistration] = useState<any | null>(null);
    const [companyData, setCompanyData] = useState<{ name: string, domain?: string } | null>(null);

    const [serverTimeOffset, setServerTimeOffset] = useState(0);

    useEffect(() => {
        if (!id || !profile?.id) return;
        let mounted = true;
        const loadData = async (isFirstLoad = false) => {
            if (isFirstLoad) setLoading(true);

            // Load assessment and time sync
            const [assessmentRes, regRes, serverTimeRes] = await Promise.all([
                supabase.from('assessments').select('*').eq('id', id).single(),
                supabase.from('assessment_registrations')
                    .select('id, score, notes, selection_status, created_at, coding_started_at, anonymous_id, peer_review_repo_url, peer_review_assigned_at, access_granted, coding_finished_at')
                    .eq('assessment_id', id)
                    .eq('user_id', profile.id)
                    .single(),
                supabase.rpc('get_server_time')
            ]);

            if (serverTimeRes.data && mounted) {
                setServerTimeOffset(new Date(serverTimeRes.data).getTime() - Date.now());
            }

            if (assessmentRes.data && mounted) setAssessment(assessmentRes.data);
            if (regRes.data && mounted) setRegistration(regRes.data);

            // Load company name if not already loaded
            if (assessmentRes.data?.company_user_id && mounted) {
                const { data: cData } = await supabase
                    .from('companies')
                    .select('name, domain')
                    .eq('user_id', assessmentRes.data.company_user_id)
                    .maybeSingle();
                if (mounted) setCompanyData(cData || null);
            }

            if (mounted) setLoading(false);
        };

        loadData(true);
        const interval = setInterval(() => loadData(false), 30000);

        const channel = supabase
            .channel('assessment-status-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assessments', filter: `id=eq.${id}` }, () => {
                loadData(false);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assessment_registrations' }, () => {
                loadData(false);
            })
            .subscribe();

        return () => {
            mounted = false;
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [id, profile?.id]);

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <p className="text-muted-foreground">Loading status...</p>
                </div>
            </Layout>
        );
    }

    if (!assessment || !registration) {
        return (
            <Layout>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-muted-foreground">Assessment not found or you are not registered</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const getSelectionStatusBadge = () => {
        // Check for intermediate round advancement (Selected but identity not revealed)
        if (!assessment?.identities_revealed && registration.selection_status === 'selected') {
            return (
                <Badge className="bg-blue-600 hover:bg-blue-700">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Advanced to Next Round
                </Badge>
            );
        }

        // Default under review if not revealed
        if (!assessment?.identities_revealed) {
            return (
                <Badge variant="secondary">
                    <Clock className="h-4 w-4 mr-1" />
                    Under Review
                </Badge>
            );
        }

        switch (registration.selection_status) {
            case 'selected':
                return (
                    <Badge className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Selected
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive">
                        <XCircle className="h-4 w-4 mr-1" />
                        Not Selected
                    </Badge>
                );
            default:
                return (
                    <Badge variant="secondary">
                        <Clock className="h-4 w-4 mr-1" />
                        Under Review
                    </Badge>
                );
        }
    };

    const getStatusMessage = () => {
        // Intermediate round advancement
        if (!assessment?.identities_revealed && registration.selection_status === 'selected') {
            return 'Congratulations! You have advanced to the next round. The new assessment will appear in your dashboard shortly.';
        }

        // Default under review
        if (!assessment?.identities_revealed) {
            return 'Your submission is being reviewed. Check back later for updates.';
        }

        switch (registration.selection_status) {
            case 'selected':
                return 'Congratulations! You have been selected for this position. The company will contact you soon.';
            case 'rejected':
                return 'Thank you for participating. Unfortunately, you were not selected for this position.';
            default:
                return 'Your submission is being reviewed. Check back later for updates.';
        }
    };

    return (
        <Layout>
            <div className="py-8 md:py-12">
                <div className="container px-4 md:px-6 max-w-4xl">
                    {assessment.emergency_abandoned && (
                        <div className="mb-8 p-6 bg-red-500/10 border border-red-500/30 rounded-lg animate-in fade-in slide-in-from-top-4 duration-500">
                            <h3 className="text-lg font-mono font-black text-red-500 uppercase tracking-widest flex items-center gap-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-[14px]">⚠️</span>
                                Round Emergency Abandoned
                            </h3>
                            <p className="text-sm text-red-400/80 font-mono mt-3 font-bold leading-relaxed">
                                This assessment was formally abandoned by the administrator. All pending evaluations have been finalized as is.
                            </p>
                        </div>
                    )}

                    {(() => {
                        const _codingStartMs = assessment?.is_sample
                            ? (registration?.coding_started_at ? new Date(registration.coding_started_at).getTime() : null)
                            : (assessment?.start_at ? new Date(assessment.start_at).getTime() : null);
                        const _durationMs = (assessment?.duration_minutes || 0) * 60000;
                        const _codingEndMs = _codingStartMs !== null
                            ? _codingStartMs + _durationMs
                            : null;

                        // Peer review phase: starts when coding ends, window duration is based on assignment time (for sample rounds)
                        const _peerReviewEndMs = assessment?.is_sample
                            ? (registration?.peer_review_assigned_at ? new Date(registration.peer_review_assigned_at).getTime() + 60 * 60 * 1000 : null)
                            : (_codingEndMs !== null ? _codingEndMs + 60 * 60 * 1000 : null);

                        const now = Date.now();
                        // If candidate has already finished (submitted or skipped peer review), never show the peer review banner.
                        const candidateFinished = !!registration?.coding_finished_at;
                        const isPeerReviewPhase = !candidateFinished && _codingEndMs !== null && now > _codingEndMs && (_peerReviewEndMs === null || now < _peerReviewEndMs);

                        if (isPeerReviewPhase) {
                            const hasPeer = !!registration?.peer_review_repo_url;
                            return (
                                <div className="mb-8 p-6 bg-indigo-500/10 border border-indigo-500/30 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <div>
                                        <h3 className="text-lg font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5" /> Phase 2: {hasPeer ? "Peer Review Active" : "Waiting for Opponent"}
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-mono mt-2">
                                            {hasPeer
                                                ? "The coding round has ended. You have been assigned a peer review task."
                                                : "The coding round has ended. Waiting for a competitor to finish... peer-review round will be available soon"
                                            }
                                        </p>
                                    </div>
                                    {hasPeer && (
                                        <Button
                                            onClick={() => window.location.href = `/candidate/assessment/${id}`}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono uppercase tracking-widest text-xs min-w-[160px]"
                                        >
                                            Start Peer Review
                                        </Button>
                                    )}
                                </div>
                            );
                        }
                        return null;
                    })()}

                    <div className="mb-8 md:mb-12 text-center md:text-left">
                        <p className="text-[10px] md:text-xs text-muted-foreground font-mono uppercase tracking-[0.2em] mb-2">Assessment Results</p>
                        <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-tight uppercase leading-tight">{assessment.title}</h1>
                        {companyData && (
                            companyData.domain ? (
                                <a
                                    href={companyData.domain.startsWith('http') ? companyData.domain : `https://${companyData.domain}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary font-mono mt-2 text-sm md:text-base tracking-widest hover:underline"
                                >
                                    {companyData.name}
                                </a>
                            ) : (
                                <p className="text-primary font-mono mt-2 text-sm md:text-base tracking-widest">{companyData.name}</p>
                            )
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Status Message */}
                        <div className="p-4 md:p-6 bg-primary/5 border border-primary/20 rounded-sm text-center md:text-left">
                            <p className="text-xs md:text-sm font-mono text-primary leading-relaxed">
                                {getStatusMessage()}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Status Card */}
                            <Card className="border-border/50 bg-card/10 rounded-sm">
                                <CardHeader className="p-4 md:p-6 pb-2 md:pb-4 border-b border-border/50">
                                    <CardTitle className="font-mono text-xs md:text-sm uppercase tracking-widest text-muted-foreground">Submission Data</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6 space-y-4">
                                    <div className="flex justify-between items-center text-xs md:text-sm border-b border-border/30 pb-3">
                                        <span className="text-muted-foreground font-mono uppercase tracking-tighter">Status</span>
                                        {getSelectionStatusBadge()}
                                    </div>
                                    <div className="flex justify-between items-center text-xs md:text-sm border-b border-border/30 pb-3">
                                        <span className="text-muted-foreground font-mono uppercase tracking-tighter">Submitted</span>
                                        <span className="font-mono text-foreground">{new Date(registration.created_at).toLocaleDateString('en-GB')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs md:text-sm">
                                        <span className="text-muted-foreground font-mono uppercase tracking-tighter">ID Tag</span>
                                        <span className="font-mono text-primary font-bold">{registration.anonymous_id}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Score Card - only show if identities revealed or unpaid practice round */}
                            {(assessment?.identities_revealed || !assessment?.is_paid) && registration.score !== null && registration.score !== undefined ? (
                                <Card className="border-primary/30 bg-primary/5 rounded-sm flex flex-col justify-center">
                                    <CardHeader className="p-4 md:p-6 pb-2 md:pb-4 border-b border-border/50">
                                        <CardTitle className="font-mono text-xs md:text-sm uppercase tracking-widest text-muted-foreground">Final Score</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 md:p-10 flex flex-col items-center justify-center text-center">
                                        <span className="text-4xl md:text-6xl font-bold font-mono text-primary tabular-nums tracking-tighter">{registration.score}</span>
                                        <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mt-4 mb-6">Out of 10</span>
                                        <Button variant="outline" size="sm" className="font-mono text-xs uppercase" onClick={() => window.location.href = `/leaderboard/assessment/${id}`}>
                                            View Leaderboard
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-dashed border-border/50 bg-muted/5 rounded-sm flex flex-col justify-center">
                                    <CardContent className="p-6 md:p-10 flex items-center justify-center text-center">
                                        <p className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-muted-foreground/60 leading-relaxed">
                                            Detailed scoring will be visible<br />once evaluation period ends
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
