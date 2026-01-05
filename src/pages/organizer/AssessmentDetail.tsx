import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function AssessmentDetail() {
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
        const { data: regs } = await supabase.from('assessment_registrations').select('user_id,created_at').eq('assessment_id', id);
        const uids = (regs || []).map((r: any) => r.user_id).filter(Boolean);
        let users: any[] = [];
        if (uids.length > 0) {
          const { data: cands } = await supabase.from('candidates').select('user_id,full_name,github_username').in('user_id', uids as any[]);
          users = cands || [];
        }
        const enriched = (regs || []).map((r: any) => ({ ...r, user: users.find(u => u.user_id === r.user_id) || null }));
        setRegistrants(enriched);
      } catch (err: any) {
        console.error('Error loading assessment detail:', err);
        toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const handleDelete = async () => {
    if (!assessment || !profile?.id) return;
    const regsCount = registrants.length;
    if (regsCount >= 1) {
      const ok = window.confirm(`This assessment has ${regsCount} registrant(s). Deleting it will charge ₹1000 (simulation). Proceed?`);
      if (!ok) return;
      toast({ title: 'Payment required', description: 'Charging ₹1000 (simulation).' });
      await new Promise(r => setTimeout(r, 800));
    } else {
      const ok = window.confirm('Delete this upcoming assessment? This cannot be undone.');
      if (!ok) return;
    }

    try {
      const { error } = await supabase.rpc('company_delete_assessment', { p_assessment_id: id, p_user_id: profile.id });
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Assessment removed.' });
      navigate('/company/dashboard');
    } catch (err: any) {
      console.error('Delete failed', err);
      toast({ title: 'Delete failed', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  if (loading) return <Layout><div className="py-24 container">Loading...</div></Layout>;
  if (!assessment) return <Layout><div className="py-24 container">Assessment not found</div></Layout>;

  // Determine if editing should be disabled one week before start
  const editDisabled = (() => {
    if (!assessment?.start_at) return false;
    try {
      const start = new Date(assessment.start_at).getTime();
      const cutoff = start - 7 * 24 * 60 * 60 * 1000; // one week before
      return Date.now() >= cutoff;
    } catch (e) {
      return false;
    }
  })();

  return (
    <Layout>
      <div className="py-12">
        <div className="container max-w-4xl">
          <h1 className="text-2xl font-bold font-mono mb-2">{assessment.title}</h1>
          <p className="text-sm text-muted-foreground mb-4">{companyName}</p>

          <div className="border border-border p-6 mb-6">
            <h3 className="font-mono font-bold mb-2">Details</h3>
            <p className="font-mono text-sm mb-2">Positions: {assessment.positions || 1}</p>
            <p className="font-mono text-sm mb-2">Start: {assessment.start_at ? new Date(assessment.start_at).toLocaleString() : '—'}</p>
            <p className="font-mono text-sm mb-2">Duration: {assessment.duration_minutes ? `${assessment.duration_minutes} minutes` : '—'}</p>
            {(() => {
              const min = (assessment as any).min_salary ?? (assessment as any).minSalary;
              const max = (assessment as any).max_salary ?? (assessment as any).maxSalary;
              if (min == null && max == null) return null;
              const fmt = (v: any) => {
                try {
                  return Number(v).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
                } catch (e) { return String(v); }
              };
              return (
                <p className="font-mono text-sm mb-2">Salary: {min != null ? fmt(min) : '—'}{max != null ? ` — ${fmt(max)}` : ''}</p>
              );
            })()}
            <p className="font-mono text-sm mb-2">Technologies: {(assessment.technologies || []).join(', ')}</p>
            <p className="font-mono text-sm">Status: {assessment.status}</p>
          </div>

          <div className="border border-border p-6 mb-6">
            <h3 className="font-mono font-bold mb-2">Registrants ({registrants.length})</h3>
            {registrants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registrants yet</p>
            ) : (
              <ul className="space-y-2">
                {registrants.map((r) => (
                  <li key={r.user_id} className="font-mono text-sm">{r.user?.full_name || r.user_id} — {r.user?.github_username || ''} <span className="text-muted-foreground">({new Date(r.created_at).toLocaleString()})</span></li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => { if (id) navigate(`/company/assessments/${id}/edit`); }}
              disabled={editDisabled}
              title={editDisabled ? 'Editing locked one week before start' : 'Edit assessment'}
            >
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>Delete Round</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
