import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Users, User, Save, Building, Clock, Zap, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

interface CompanyDashboardProps {
  companyUserId?: string | null;
}

export default function CompanyDashboard({ companyUserId }: CompanyDashboardProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ownerId = companyUserId || profile?.id;
  const [upcomingCount, setUpcomingCount] = useState<number>(0);
  const [activeAssessmentsCount, setActiveAssessmentsCount] = useState<number>(0);
  const [pastAssessmentsCount, setPastAssessmentsCount] = useState<number>(0);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [activeRolesCount, setActiveRolesCount] = useState<number>(0);
  const [totalCandidates, setTotalCandidates] = useState<number>(0);
  const [submissionsCount, setSubmissionsCount] = useState<number>(0);
  const [hasWebsite, setHasWebsite] = useState<boolean>(true); // default true to avoid flicker
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!ownerId) return;
      try {
        // fetch assessments for this company
        const { data: aData, error: aErr } = await supabase
          .from('assessments')
          .select('id,title,positions,created_at,status,start_at,payment_confirmed,is_paid')
          .eq('company_user_id', ownerId)
          .order('created_at', { ascending: false });

        // fetch company profile to check website
        const { data: cData } = await supabase
          .from('companies')
          .select('domain')
          .eq('user_id', ownerId)
          .single();

        if (mounted) {
          setHasWebsite(!!cData?.domain);
          setLoadingProfile(false);
        }

        if (aErr) throw aErr;
        const aList = aData || [];

        const assessmentIds = aList.map((a: any) => a.id).filter(Boolean);

        // compute statuses
        const upcoming = aList.filter((a: any) =>
          a.status !== 'completed' &&
          a.start_at &&
          new Date(a.start_at) > new Date()
        ).length;

        const activeAss = aList.filter((a: any) => a.status === 'published').length;
        const pastAss = aList.filter((a: any) => a.status === 'completed').length;

        if (mounted) {
          setUpcomingCount(upcoming);
          setActiveAssessmentsCount(activeAss);
          setPastAssessmentsCount(pastAss);
        }

        // fetch registrations for these assessments
        let regs: any[] = [];
        if (assessmentIds.length > 0) {
          const { data: rData } = await supabase
            .from('assessment_registrations')
            .select('assessment_id,user_id')
            .in('assessment_id', assessmentIds as any[]);
          regs = rData || [];
        }

        // compute registrations count per assessment and unique candidate set
        const regsByAssessment: Record<string, number> = {};
        const uniqueCandidates = new Set<string>();
        regs.forEach(r => {
          regsByAssessment[r.assessment_id] = (regsByAssessment[r.assessment_id] || 0) + 1;
          if (r.user_id) uniqueCandidates.add(r.user_id);
        });

        // fetch submission audits
        let audits: any[] = [];
        if (assessmentIds.length > 0) {
          const { data: aAudits } = await supabase
            .from('assessment_audits')
            .select('assessment_id')
            .in('assessment_id', assessmentIds as any[])
            .eq('action', 'submission');
          audits = aAudits || [];
        }
        const submissionsByAssessment: Record<string, number> = {};
        audits.forEach(x => { submissionsByAssessment[x.assessment_id] = (submissionsByAssessment[x.assessment_id] || 0) + 1; });

        // enrich assessments
        const enriched = aList.map((a: any) => ({
          ...a,
          registrationsCount: regsByAssessment[a.id] || 0,
          submissionsCount: submissionsByAssessment[a.id] || 0,
        }));

        // compute aggregate metrics
        const activeRoles = aList
          .filter((a: any) => a.status !== 'completed' && a.is_paid)
          .reduce((sum: number, a: any) => sum + (a.positions || 0), 0);

        const totalRegs = uniqueCandidates.size;
        const totalSubmissions = audits.length;

        if (mounted) {
          setAssessments(enriched);
          setActiveRolesCount(activeRoles);
          setTotalCandidates(totalRegs);
          setSubmissionsCount(totalSubmissions);
        }
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      }
    })();
    return () => { mounted = false; };
  }, [ownerId]);

  return (
    <Layout>
      <div className="py-12">
        <div className="container">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
            <div>
              <h1 className="text-3xl font-bold font-mono tracking-tight uppercase">
                Dashboard
              </h1>
              <p className="text-muted-foreground font-mono text-sm mt-1">
                Manage open assessments and review candidates
              </p>
            </div>
            <div className="flex gap-4">
              <div title={!hasWebsite ? "Add your website in Profile to create assessments" : ""}>
                <Button
                  asChild={hasWebsite}
                  disabled={!hasWebsite || loadingProfile}
                  variant={!hasWebsite ? "outline" : "default"}
                  className="font-mono uppercase text-xs tracking-widest px-8"
                  onClick={(e) => { if (!hasWebsite) e.preventDefault(); }}
                >
                  {hasWebsite ? (
                    <Link to="/company/assessments/choose">
                      <Plus className="h-4 w-4 mr-2" />
                      Assessment
                    </Link>
                  ) : (
                    <span>
                      <Plus className="h-4 w-4 mr-2" />
                      Assessment
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Active Roles</span>
              </div>
              <p className="text-3xl font-bold font-mono">{activeRolesCount}</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-1 uppercase">Paid Positions</p>
            </div>

            <div className="border border-border p-6 bg-secondary/10">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Upcoming</span>
              </div>
              <p className="text-3xl font-bold font-mono">{upcomingCount}</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-1 uppercase">Assessments</p>
            </div>

            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Active</span>
              </div>
              <p className="text-3xl font-bold font-mono">{activeAssessmentsCount}</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-1 uppercase">Published</p>
            </div>

            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Past</span>
              </div>
              <p className="text-3xl font-bold font-mono">{pastAssessmentsCount}</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-1 uppercase">Completed</p>
            </div>
          </div>

          {/* Assessments Overview */}
          <section>
            <h2 className="text-xl font-bold font-mono mb-6 uppercase tracking-tight">Assessments Overview</h2>
            <div className="border border-border">
              <div className="grid grid-cols-5 gap-4 p-4 border-b border-border text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                <span>Role</span>
                <span>Status</span>
                <span>Positions</span>
                <span>Candidates</span>
                <span>Created</span>
              </div>
              {assessments.length === 0 && (
                <div className="p-8 text-center text-muted-foreground font-mono text-sm">
                  No assessments found.
                </div>
              )}
              {assessments.map((role) => (
                <Link
                  key={role.id}
                  to={`/company/assessments/${role.id}`}
                  className="grid grid-cols-5 gap-4 p-4 border-b border-border last:border-b-0 font-mono text-xs hover:bg-secondary/50 transition-colors cursor-pointer items-center"
                >
                  <span className="font-semibold uppercase truncate">{role.title}</span>
                  <span className={cn(
                    "text-[10px] uppercase tracking-tighter px-2 py-0.5 border w-fit",
                    role.status === 'published' ? "border-white bg-white text-black font-bold" : "border-muted-foreground text-muted-foreground"
                  )}>
                    {role.status === 'awaiting_classroom_setup' ? 'waiting for admin' : role.status}
                  </span>
                  <span>{role.is_paid ? role.positions : "-"}</span>
                  <span>{role.registrationsCount}</span>
                  <span className="text-muted-foreground whitespace-nowrap">{new Date(role.created_at).toLocaleDateString('en-GB')}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
