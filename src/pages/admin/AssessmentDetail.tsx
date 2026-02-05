
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function AdminAssessmentDetail() {
    const { id } = useParams();
    const { profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [assessment, setAssessment] = useState<any | null>(null);
    const [companyName, setCompanyName] = useState<string>('');
    const [registrants, setRegistrants] = useState<any[]>([]);

    useEffect(() => {
        if (!id) return;
        let mounted = true;
        (async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase.from('assessments').select('*').eq('id', id).single();
                if (error) throw error;
                if (!mounted) return;
                setAssessment(data);

                if (data?.company_user_id) {
                    try {
                        const { data: c } = await supabase.from('companies').select('name').eq('user_id', data.company_user_id).single();
                        if (c) setCompanyName((c as any).name || '');
                    } catch (e) { /* ignore */ }
                }

                // load registrants
                // Admins can see real names/usernames if they want, but let's stick to what we have in the DB (github_username is on candidate profile usually, or reg logic)
                // Similar to dashboard logic
                const { data: regs } = await supabase
                    .from('assessment_registrations')
                    .select('*, candidates:user_id(github_username)')
                    .eq('assessment_id', id);

                setRegistrants(regs || []);
            } catch (err: any) {
                console.error('Error loading assessment detail:', err);
                toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [id]);

    const handleMarkUnready = async () => {
        if (!id) return;
        const confirmed = window.confirm("Are you sure you want to mark this assessment as unready? This will move it back to 'Awaiting Setup'.");
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('assessments')
                .update({ status: 'awaiting_classroom_setup' })
                .eq('id', id);

            if (error) throw error;

            toast({ title: "Status Updated", description: "Assessment marked as unready." });
            // Refresh local state or navigate
            navigate('/admin/dashboard');
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    if (loading) return <Layout><div className="py-24 container">Loading...</div></Layout>;
    if (!assessment) return <Layout><div className="py-24 container">Assessment not found</div></Layout>;

    return (
        <Layout>
            <div className="py-8 md:py-12">
                <div className="container px-4 md:px-6 max-w-4xl">
                    <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent hover:text-primary" onClick={() => navigate('/admin/dashboard')}>
                        ← Back to Dashboard
                    </Button>

                    <div className="text-center md:text-left mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-tight mb-2 uppercase">{assessment.title}</h1>
                        <p className="text-xs md:text-sm text-muted-foreground font-mono tracking-widest uppercase">{companyName} • ADMIN VIEW</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="border border-foreground/20 p-6 bg-card/30 rounded-sm">
                            <h3 className="font-mono font-bold mb-4 text-xs md:text-sm uppercase tracking-wider text-muted-foreground">Details</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground">ID</span>
                                    <span className="font-mono text-xs md:text-sm font-bold">{assessment.id.split('-')[0]}</span>
                                </div>
                                {assessment.is_paid && (
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground">Positions</span>
                                        <span className="font-mono text-xs md:text-sm font-bold">{assessment.positions || 1}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground">Start</span>
                                    <span className="font-mono text-xs md:text-sm">{assessment.start_at ? new Date(assessment.start_at).toLocaleString('en-GB') : '—'}</span>
                                </div>
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground">Duration</span>
                                    <span className="font-mono text-xs md:text-sm">{assessment.duration_minutes ? `${assessment.duration_minutes} min` : '—'}</span>
                                </div>
                                <div className="flex flex-col gap-1 pb-2">
                                    <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground">Technologies</span>
                                    <span className="font-mono text-xs md:text-sm">{(assessment.technologies || []).join(', ')}</span>
                                </div>
                                <div className="flex justify-between pt-2">
                                    <span className="font-mono text-[10px] md:text-xs uppercase text-muted-foreground">Status</span>
                                    <Badge variant="outline" className="font-mono text-[10px] uppercase h-5 text-foreground border-foreground/50">
                                        {assessment.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="border border-foreground/20 p-6 bg-card/30 rounded-sm">
                            <h3 className="font-mono font-bold mb-4 text-xs md:text-sm uppercase tracking-wider text-muted-foreground">Registrations ({registrants.length})</h3>
                            {registrants.length === 0 ? (
                                <div className="flex items-center justify-center py-8 border border-dashed border-white/10 rounded-sm">
                                    <p className="text-xs text-muted-foreground font-mono">No participants yet</p>
                                </div>
                            ) : (
                                <div className="max-h-[250px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {registrants.map((r) => {
                                        // Attempt to resolve github username from joined table or fallback
                                        const gh = r.candidates?.github_username || r.github_username || 'Unknown';
                                        return (
                                            <div key={r.id} className="font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 bg-background/50 border border-white/10 rounded-sm">
                                                <span className="font-bold text-primary">@{gh}</span>
                                                <div className="flex gap-2 text-[10px] text-muted-foreground overflow-x-auto whitespace-nowrap">
                                                    {r.repo_provisioned && <span className="text-green-500">Repo ✓</span>}
                                                    {r.access_granted && <span className="text-green-500">Access ✓</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                        <Button
                            onClick={() => navigate(`/admin/assessment/${id}/setup`)}
                            variant="outline"
                            className="font-mono w-full sm:w-auto h-11 uppercase"
                        >
                            Configure Repository
                        </Button>

                        <Button
                            variant="destructive"
                            className="font-mono w-full sm:w-auto h-11 uppercase"
                            onClick={handleMarkUnready}
                            disabled={assessment.status === 'awaiting_classroom_setup'}
                        >
                            Mark as Unready
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
