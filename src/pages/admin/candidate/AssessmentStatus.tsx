import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
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
  const [companyName, setCompanyName] = useState<string>('');

  useEffect(() => {
    if (!id || !profile?.id) return;
    let mounted = true;
    (async () => {
      setLoading(true);

      // Load assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .single();

      if (assessmentError) {
        console.error('Error loading assessment:', assessmentError);
      }
      if (mounted) setAssessment(assessmentData || null);

      // Load registration with score and selection status
      const { data: regData, error: regError } = await supabase
        .from('assessment_registrations')
        .select('id, score, notes, selection_status, created_at, anonymous_id')
        .eq('assessment_id', id)
        .eq('user_id', profile.id)
        .single();

      if (regError) {
        console.error('Error loading registration:', regError);
      }
      if (mounted) setRegistration(regData || null);

      // Load company name
      if (assessmentData?.company_user_id) {
        try {
          const { data: companyData } = await supabase
            .from('companies')
            .select('name')
            .eq('user_id', assessmentData.company_user_id)
            .maybeSingle();
          if (mounted) setCompanyName(companyData?.name || '');
        } catch (e) {
          console.debug('Company lookup failed', e);
        }
      }

      setLoading(false);
    })();
    return () => { mounted = false; };
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
          <div className="mb-8 md:mb-12 text-center md:text-left">
            <p className="text-[10px] md:text-xs text-muted-foreground font-mono uppercase tracking-[0.2em] mb-2">Assessment Results</p>
            <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-tight uppercase leading-tight">{assessment.title}</h1>
            {companyName && (
              <p className="text-primary font-mono mt-2 text-sm md:text-base tracking-widest">{companyName}</p>
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
                    <span className="text-[10px] md:text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground mt-4">Out of 10</span>
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
