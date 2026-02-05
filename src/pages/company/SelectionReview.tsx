import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mail, User, Github } from 'lucide-react';

export default function SelectionReview() {
  const { id } = useParams(); // assessment ID
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [identitiesRevealed, setIdentitiesRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [companyName, setCompanyName] = useState<string>('The Company');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      // Get assessment details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      // Fetch company name separately
      if (assessmentData.company_user_id) {
        const { data: cData } = await supabase
          .from('companies')
          .select('name')
          .eq('user_id', assessmentData.company_user_id)
          .maybeSingle();
        if (cData?.name) setCompanyName(cData.name);
      }

      // Check if identities already revealed
      if (assessmentData.identities_revealed) {
        setIdentitiesRevealed(true);
      }

      // Get selected anonymous IDs from URL
      const selectedIds = searchParams.get('selected')?.split(',') || [];

      // Get candidate registrations with scores
      const { data: registrations, error: regError } = await supabase
        .from('assessment_registrations')
        .select('anonymous_id, user_id, score, notes, selection_status')
        .eq('assessment_id', id)
        .in('anonymous_id', selectedIds);

      if (regError) {
        console.error('Registration query error:', regError);
        throw regError;
      }

      console.log('Registrations:', registrations);

      // Get candidate details if we have user IDs
      const userIds = registrations?.map(r => r.user_id).filter(Boolean) || [];
      let candidateData = [];

      if (userIds.length > 0) {
        const { data, error } = await supabase
          .from('candidates')
          .select('user_id, full_name, github_username, email')
          .in('user_id', userIds);

        console.log('Candidates response:', { data, error });
        candidateData = data || [];
      }

      // Merge registration and candidate data
      const merged = registrations?.map(reg => ({
        ...reg,
        candidate: candidateData?.find(c => c.user_id === reg.user_id)
      })) || [];

      console.log('Merged candidates:', merged);

      setCandidates(merged);
    } catch (error: any) {
      console.error('Error loading selection review:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevealIdentities = async () => {
    if (revealing) return; // Prevent multiple clicks

    const positions = assessment?.positions || 1;
    const selectedCount = candidates.length;

    console.log('handleRevealIdentities called', { positions, selectedCount, assessmentId: id });

    setRevealing(true);
    try {
      // First, mark all candidates as "selected" in database
      const anonymousIds = candidates.map(c => c.anonymous_id);
      const { error: selectionError } = await supabase
        .from('assessment_registrations')
        .update({ selection_status: 'selected' })
        .eq('assessment_id', id)
        .in('anonymous_id', anonymousIds);

      if (selectionError) throw selectionError;

      if (selectedCount <= positions) {
        // Can reveal identities directly
        console.log('Selections within limit, revealing identities...');

        // Get current assessment data to preserve start_at
        const { data: currentAssessment } = await supabase
          .from('assessments')
          .select('start_at')
          .eq('id', id)
          .single();

        // Mark assessment as finalized with identities revealed
        const { error: updateError } = await supabase
          .from('assessments')
          .update({
            identities_revealed: true,
            finalized_at: new Date().toISOString(),
            start_at: currentAssessment?.start_at,
            status: 'completed'
          })
          .eq('id', id);

        if (updateError) throw updateError;

        setIdentitiesRevealed(true);
        await loadData();

        toast({
          title: 'Identities Revealed',
          description: 'Candidate identities are now visible for all selected candidates.'
        });

        // Notify candidates via email
        try {
          await supabase.functions.invoke('notify-selection', {
            body: {
              candidates: candidates.map(c => ({
                email: c.candidate?.email,
                name: c.candidate?.full_name,
              })).filter(c => c.email),
              companyName,
              assessmentTitle: assessment.title,
            }
          });
          console.log('Selection emails sent successfully');
        } catch (emailError) {
          console.error('Failed to send selection emails:', emailError);
          // Don't block the UI - emails are best-effort
        }
      } else {
        // Too many selections - proceed to Round 2 without revealing identities
        console.log('Selections exceed positions, proceeding to Round 2...');

        // Update assessment status to under_review (candidates stay anonymous)
        const { error: updateError } = await supabase
          .from('assessments')
          .update({ status: 'under_review' })
          .eq('id', id);

        if (updateError) throw updateError;

        // Mark candidates as selected (so they see "Advanced" status)
        await supabase
          .from('assessment_registrations')
          .update({ selection_status: 'selected' })
          .in('anonymous_id', candidates.map(c => c.anonymous_id));

        toast({
          title: 'Candidates Selected',
          description: `${selectedCount} candidates selected for Round 2. Identities remain anonymous until final selection.`
        });


        // Notify candidates about round advancement
        try {
          const nextRound = (assessment.round_number || 1) + 1;

          await supabase.functions.invoke('notify-selection', {
            body: {
              candidates: candidates.map(c => ({
                email: c.candidate?.email,
                name: c.candidate?.full_name,
              })).filter(c => c.email),
              companyName,
              assessmentTitle: assessment.title,
              type: 'next_round',
              nextRoundNumber: nextRound
            }
          });
          console.log('Advancement emails sent successfully');
        } catch (emailError) {
          console.error('Failed to send advancement emails:', emailError);
        }

        // Navigate to create Round 2
        const selectedIds = candidates.map(c => c.anonymous_id).join(',');
        navigate(`/company/assessments/new?from=${id}&selected=${selectedIds}`);
      }
    } catch (error: any) {
      console.error('Error processing selection:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setRevealing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-24 container">Loading...</div>
      </Layout>
    );
  }

  if (!assessment) {
    return (
      <Layout>
        <div className="py-24 container">Assessment not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8 md:py-12">
        <div className="container px-4 md:px-6 max-w-6xl">
          <div className="mb-8 flex flex-col md:flex-row md:items-center gap-6">
            <Button variant="ghost" size="sm" className="w-fit font-mono" onClick={() => {
              if (identitiesRevealed) {
                navigate('/company/dashboard');
              } else {
                navigate(`/company/assessments/${id}/submissions`);
              }
            }}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {identitiesRevealed ? 'Dashboard' : 'Submissions'}
            </Button>
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold font-mono uppercase tracking-tight">{assessment.title}</h1>
              <p className="text-xs md:text-sm text-muted-foreground font-mono mt-1">
                Selection: {candidates.length} candidate(s) | Positions: {assessment.positions || 1}
              </p>
            </div>
          </div>

          {!identitiesRevealed && (
            <Card className="mb-8 border-primary/50 bg-primary/5 rounded-sm">
              <CardContent className="p-4 md:p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                  <div className="flex-1">
                    <h3 className="font-mono font-bold mb-2 uppercase text-sm md:text-base">Ready to Reveal Identities?</h3>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                      {candidates.length <= (assessment.positions || 1)
                        ? 'Reveal candidate details to contact them for the next steps.'
                        : `You've selected ${candidates.length} candidates for ${assessment.positions || 1} position. Creating another round is recommended.`}
                    </p>
                  </div>
                  <Button onClick={handleRevealIdentities} disabled={revealing} className="w-full md:w-auto font-mono h-11 px-8">
                    {revealing ? 'Processing...' : (candidates.length <= (assessment.positions || 1) ? 'Reveal Identities' : 'Create Next Round')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {identitiesRevealed && (
            <div className="mb-8 p-4 border border-primary/20 bg-primary/5 rounded-sm">
              <p className="text-sm font-mono text-primary/80 leading-relaxed">
                We have notified the selected candidates about their selections. All further proceedings should be between the company and the candidate directly.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {candidates.map((item) => (
              <Card key={item.anonymous_id} className="border-border/50 bg-card/10 hover:border-border transition-colors rounded-sm">
                <CardHeader className="p-4 md:p-6 pb-2 md:pb-4">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-base md:text-xl font-bold truncate">
                        {(identitiesRevealed && item.selection_status === 'selected' && item.candidate?.full_name)
                          ? item.candidate.full_name
                          : item.anonymous_id}
                      </div>
                      {identitiesRevealed && item.selection_status === 'selected' && item.candidate?.github_username && (
                        <div className="text-xs md:text-sm font-mono text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1">
                          <span className="text-primary tracking-wider">@{item.candidate.github_username}</span>
                          <span className="opacity-50">|</span>
                          <span>{item.candidate.email}</span>
                        </div>
                      )}
                    </div>
                    {item.score && (
                      <Badge variant="default" className="font-mono text-[10px] md:text-xs h-6 px-3">
                        Score: {item.score}/10
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-2 md:pt-0">
                  {(identitiesRevealed && item.selection_status === 'selected' && item.candidate && item.candidate.email) ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-background/50 border border-border/50 rounded-sm">
                          <Mail className="h-4 w-4 text-primary shrink-0" />
                          <a href={`mailto:${item.candidate.email}`} className="text-xs md:text-sm font-mono hover:text-primary transition-colors truncate">
                            {item.candidate.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-background/50 border border-border/50 rounded-sm">
                          <Github className="h-4 w-4 text-primary shrink-0" />
                          <a
                            href={`https://github.com/${item.candidate.github_username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs md:text-sm font-mono hover:text-primary transition-colors truncate"
                          >
                            github.com/{item.candidate.github_username}
                          </a>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="p-4 bg-muted/20 border border-border/30 rounded-sm">
                          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Evaluation Notes</p>
                          <p className="text-xs md:text-sm font-mono leading-relaxed">{item.notes}</p>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-mono text-xs h-10 w-full sm:w-auto"
                          onClick={() => navigate(`/company/assessments/${id}/submissions/${item.anonymous_id}`)}
                        >
                          Review All Code
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {item.notes && (
                        <div className="p-4 bg-muted/20 border border-border/30 rounded-sm">
                          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Internal Notes</p>
                          <p className="text-xs md:text-sm font-mono leading-relaxed">{item.notes}</p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-mono text-xs h-10 w-full sm:w-auto"
                        onClick={() => navigate(`/company/assessments/${id}/submissions/${item.anonymous_id}`)}
                      >
                        Anonymous Code Review
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
