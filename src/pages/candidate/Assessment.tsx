import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { GitBranch, Terminal, Clock } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function Assessment() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [assessment, setAssessment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [companyName, setCompanyName] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('assessments').select('*').eq('id', id).single();
      if (error) console.error('Error loading assessment:', error);
      if (mounted) setAssessment(data || null);

      // fetch company name (try common keys: companies.user_id, companies.id)
      if (data?.company_user_id) {
        try {
          // primary: companies.user_id = company_user_id
          let compRes = await supabase.from('companies').select('name').eq('user_id', data.company_user_id).maybeSingle();
          let name = compRes.data?.name;
          if (!name) {
            // fallback: companies.id = company_user_id
            compRes = await supabase.from('companies').select('name').eq('id', data.company_user_id).maybeSingle();
            name = compRes.data?.name;
          }
          if (mounted) setCompanyName(name || '');
        } catch (e) {
          console.debug('Company lookup failed', e);
        }
      }

      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [id]);

  // check registration (if table exists) so we only reveal classroom/repo when allowed
  useEffect(() => {
    if (!id || !profile?.id) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('assessment_registrations')
          .select('id')
          .eq('assessment_id', id)
          .eq('user_id', profile.id)
          .single();
        if (!error && data && mounted) setIsRegistered(true);
      } catch (err) {
        // If the registrations table doesn't exist or another error occurs,
        // we fail-safe by not marking the user as registered.
        console.debug('registration check failed or not present', err);
      }
    })();
    return () => { mounted = false; };
  }, [id, profile?.id]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </Layout>
    );
  }

  if (!assessment) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Assessment not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  const classroomUrl = assessment.github_classroom_url || '';
  const repoUrl = ''; // intentionally never expose original company repo to candidates
  const description = assessment.description || '';

  return (
    <Layout>
      <div className="py-12">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <p className="text-sm text-muted-foreground font-mono uppercase tracking-wider mb-2">Assessment</p>
                <h1 className="text-3xl font-bold font-mono tracking-tight">{assessment.title}</h1>
                {companyName ? (
                  <p className="text-muted-foreground font-mono mt-1">{companyName}</p>
                ) : null}
              </div>

              {/* Repository URL (moved above description) */}
              <div className="border border-border p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <GitBranch className="h-5 w-5" />
                  <h2 className="font-mono font-bold">Repository</h2>
                </div>
                <div className="flex items-center gap-4">
                  {isRegistered && assessment.start_at && new Date(assessment.start_at) <= new Date() ? (
                    <>
                      <code className="flex-1 p-3 bg-secondary font-mono text-sm">{classroomUrl || 'Assignment link will be available'}</code>
                      <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(classroomUrl || '')}>Copy</Button>
                    </>
                  ) : (
                    <div className="flex-1 p-3 bg-secondary font-mono text-sm text-muted-foreground">Assignment link is hidden until the round starts.</div>
                  )}
                </div>
              </div>

              {/* Problem Description (only show if present) */}
              {description && description.trim() ? (
                <div>
                  <h2 className="font-mono font-bold mb-4">Description:</h2>
                  <div className="border border-border p-6 mb-8">
                    <div className="prose prose-invert max-w-none">
                      <div className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
                        {description.split('\n').map((line: string, i: number) => {
                          if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-8 mb-4 first:mt-0">{line.replace('## ', '')}</h2>;
                          if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-6 mb-3">{line.replace('### ', '')}</h3>;
                          if (line.startsWith('- **')) {
                            const [label, ...rest] = line.replace('- **', '').split('**:');
                            return <p key={i} className="my-2"><strong>{label}</strong>:{rest.join('')}</p>;
                          }
                          if (line.match(/^\d+\./)) return <p key={i} className="my-1 ml-4">{line}</p>;
                          return <p key={i} className={line ? 'my-2 text-muted-foreground' : 'my-4'}>{line}</p>;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Status Panel */}
              <div className="border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Terminal className="h-5 w-5" />
                  <h2 className="font-mono font-bold">Status</h2>
                </div>
                <div className="space-y-3 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className="uppercase text-xs tracking-wider">
                      {assessment.start_at && new Date(assessment.start_at) > new Date() ? 'UPCOMING' : (assessment.status || '').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deadline / Start */}
              <div className="border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="h-5 w-5" />
                  <h2 className="font-mono font-bold">Schedule</h2>
                </div>
                <p className="font-mono text-sm">Start: {assessment.start_at ? new Date(assessment.start_at).toLocaleString() : '—'}</p>
                <p className="font-mono text-sm mt-2">Duration: {assessment.duration_minutes ? `${assessment.duration_minutes} minutes` : '—'}</p>
                <p className="font-mono text-sm mt-2">Positions: {assessment.positions || 1}</p>
              </div>

              {/* Technologies (moved to sidebar under Schedule) */}
              {Array.isArray(assessment.technologies) && assessment.technologies.length ? (
                <div className="border border-border p-4">
                  <p className="text-sm text-muted-foreground">Technologies</p>
                  <p className="font-medium text-sm mt-1 text-right">{assessment.technologies.join(', ')}</p>
                </div>
              ) : null}

              {/* Actions */}
              <div className="space-y-2">
                {(!isRegistered) ? (
                  // Not registered -> show Register button (if start is in future or no start provided)
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={async () => {
                      if (!id || !profile?.id) return;
                      try {
                        const { error } = await supabase.from('assessment_registrations').insert([{ assessment_id: id, user_id: profile.id }]);
                        if (error) throw error;
                        setIsRegistered(true);
                        toast({ title: 'Registered', description: 'You are registered for this assessment.' });
                      } catch (err: any) {
                        console.error('Register failed', err);
                        toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
                      }
                    }}
                  >
                    Register
                  </Button>
                ) : (
                  // Registered: if assessment started allow Finish, otherwise show Unregister
                  <>
                    {assessment.start_at && new Date(assessment.start_at) <= new Date() ? (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={async () => {
                          if (!id) return;
                          try {
                            const { data, error } = await supabase.rpc('candidate_finish_assessment', { p_assessment_id: id });
                            if (error) throw error;
                            setAssessment((a: any) => ({ ...a, status: 'completed' }));
                            toast({ title: 'Finished', description: 'Assessment marked completed.' });
                          } catch (err: any) {
                            console.error('Finish failed', err);
                            toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
                          }
                        }}
                      >
                        Finish
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" onClick={async () => {
                        if (!id || !profile?.id) return;
                        const ok = window.confirm('Unregister from this assessment? This will return it to Opportunities.');
                        if (!ok) return;
                        try {
                          const { error } = await supabase
                            .from('assessment_registrations')
                            .delete()
                            .eq('assessment_id', id)
                            .eq('user_id', profile.id);
                          if (error) throw error;
                          setIsRegistered(false);
                          toast({ title: 'Unregistered', description: 'You have been unregistered from this assessment.' });
                        } catch (err: any) {
                          console.error('Unregister failed', err);
                          toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
                        }
                      }}>Unregister</Button>
                    )}
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
