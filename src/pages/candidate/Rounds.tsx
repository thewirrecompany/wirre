import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { Clock, ExternalLink } from "lucide-react";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface CandidateRoundsProps {
  userId?: string | null;
  embedded?: boolean;
}

export default function CandidateRounds({ userId, embedded = false }: CandidateRoundsProps) {
  // Will load the rounds the candidate registered for from the backend
  const { profile } = useAuth();
  const [activeRounds, setActiveRounds] = useState<any[]>([]);
  const [completedRounds, setCompletedRounds] = useState<any[]>([]);
  const [upcomingRounds, setUpcomingRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const targetId = userId || profile?.id;
      if (!targetId) {
        setLoading(false);
        return;
      }
      try {
        // ensure due assessments are started
        try { await supabase.rpc('mark_due_assessments_started'); } catch(e) { /* ignore */ }

        // fetch registrations for the current user and include assessment details
        const { data, error } = await supabase
          .from('assessment_registrations')
          .select('assessment:assessments(id,title,status,start_at,duration_minutes,positions,company_user_id,created_at)')
          .eq('user_id', targetId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading my rounds:', error);
          return;
        }

        const assessments = (data || []).map((r: any) => r.assessment).filter(Boolean);

        const userIds = Array.from(new Set(assessments.map((a: any) => a.company_user_id).filter(Boolean)));
        let companiesMap: Record<string,string> = {};
        if (userIds.length > 0) {
          const { data: companies } = await supabase
            .from('companies')
            .select('user_id,name')
            .in('user_id', userIds as any[]);
          if (companies) companiesMap = Object.fromEntries((companies as any[]).map(c => [c.user_id, c.name]));
        }

        // split upcoming, active and completed by status & start time
        const now = new Date();
        const upcoming = assessments.filter((a: any) => a.status === 'ready' && a.start_at && new Date(a.start_at) > now);
        const completed = assessments.filter((a: any) => a.status === 'completed' || a.status === 'under_review');
        const active = assessments.filter((a: any) => !completed.includes(a) && !upcoming.includes(a));

        if (mounted) {
          setUpcomingRounds(upcoming.map((a: any) => ({ ...a, company: companiesMap[a.company_user_id] || '' })));
          setActiveRounds(active.map((a: any) => ({ ...a, company: companiesMap[a.company_user_id] || '' })));
          setCompletedRounds(completed.map((a: any) => ({ ...a, company: companiesMap[a.company_user_id] || '' })));
        }
      } catch (err) {
        console.error('Error loading rounds:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [profile?.id]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      invited: { label: "Invited", variant: "secondary" },
      in_progress: { label: "In Progress", variant: "default" },
      under_review: { label: "Under Review", variant: "outline" },
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
    <section className="py-8">
      <div className="container max-w-6xl">
        {/* Upcoming Rounds */}
        <div className="mb-8">
          <h3 className="text-xl font-bold font-mono mb-4">Upcoming Rounds</h3>
          <div className="grid gap-6">
            {upcomingRounds.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <h3 className="font-mono text-lg font-semibold mb-2">No opportunities available</h3>
                  <p className="text-sm text-muted-foreground">Check back later for upcoming rounds</p>
                </CardContent>
              </Card>
            ) : (
              upcomingRounds.map((round) => (
                <Card key={round.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-mono">{round.title}</CardTitle>
                        <CardDescription className="font-mono mt-1">{round.company}</CardDescription>
                      </div>
                      {getStatusBadge(round.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono text-xs">Start: {round.start_at ? new Date(round.start_at).toLocaleString() : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">Duration: {round.duration_minutes ? `${round.duration_minutes}m` : '—'}</span>
                      </div>
                    </div>
                      <div className="flex gap-3">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/candidate/assessment/${round.id}`}>View</Link>
                        </Button>
                      </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Active Rounds */}
        <div className="mb-8">
          <h3 className="text-xl font-bold font-mono mb-4">Active Rounds</h3>
          <div className="grid gap-6">
            {activeRounds.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <h3 className="font-mono text-lg font-semibold mb-2">No opportunities available</h3>
                  <p className="text-sm text-muted-foreground">You have no active rounds</p>
                </CardContent>
              </Card>
            ) : (
              activeRounds.map((round) => (
                <Card key={round.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-mono">{round.title}</CardTitle>
                        <CardDescription className="font-mono mt-1">{round.company}</CardDescription>
                      </div>
                      {getStatusBadge(round.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono text-xs">Start: {round.start_at ? new Date(round.start_at).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">Duration: {round.duration_minutes ? `${round.duration_minutes}m` : '—'}</span>
                      </div>
                    </div>
                      <div className="flex gap-3">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/candidate/assessment/${round.id}`}>View</Link>
                        </Button>
                      </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Completed Rounds */}
        <div>
          <h3 className="text-xl font-bold font-mono mb-4">Completed Rounds</h3>
          <div className="grid gap-6">
            {completedRounds.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <h3 className="font-mono text-lg font-semibold mb-2">No opportunities available</h3>
                  <p className="text-sm text-muted-foreground">You have no completed rounds</p>
                </CardContent>
              </Card>
            ) : (
              completedRounds.map((round) => (
                <Card key={round.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="font-mono">{round.title}</CardTitle>
                        <CardDescription className="font-mono mt-1">
                          {round.company}
                        </CardDescription>
                      </div>
                      {getStatusBadge(round.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono text-xs">
                          Submitted {new Date(round.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" asChild>
                      <a href={round.prLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Submission
                      </a>
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
      <section className="min-h-[calc(100vh-14rem)] py-24">
        <div className="container max-w-6xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold font-mono tracking-tight mb-4">Assessment Rounds</h1>
            <p className="text-muted-foreground font-mono text-sm">Manage your active and completed assessment rounds</p>
          </div>
        </div>
        {content}
      </section>
    </Layout>
  );
}