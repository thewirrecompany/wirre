import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Users, Clock, Zap, CheckCircle } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useCompanyDashboard } from "@/hooks/queries/useCompanyDashboard";
import { useQueryClient } from "@tanstack/react-query";

interface CompanyDashboardProps {
  companyUserId?: string | null;
}

function DashboardSkeleton() {
  return (
    <Layout>
      <div className="py-12">
        <div className="container animate-pulse">
          {/* Header skeleton */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
            <div>
              <div className="h-8 w-40 bg-muted rounded mb-2" />
              <div className="h-4 w-64 bg-muted/60 rounded" />
            </div>
            <div className="h-10 w-32 bg-muted rounded" />
          </div>
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-border p-6">
                <div className="h-4 w-24 bg-muted rounded mb-3" />
                <div className="h-8 w-12 bg-muted rounded mb-1" />
                <div className="h-3 w-20 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
          {/* Table skeleton */}
          <div className="border border-border">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 p-4 border-b border-border last:border-b-0">
                <div className="h-4 bg-muted rounded col-span-2" />
                <div className="h-4 bg-muted/60 rounded" />
                <div className="h-4 bg-muted/60 rounded" />
                <div className="h-4 bg-muted/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function CompanyDashboard({ companyUserId }: CompanyDashboardProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const ownerId = companyUserId || profile?.id;

  const { data, isLoading } = useCompanyDashboard(ownerId);
  const queryClient = useQueryClient();

  // Add real-time listeners for instant updates
  useEffect(() => {
    if (!ownerId) return;

    const channel = supabase
      .channel('company-dashboard-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'assessments', 
        filter: `company_user_id=eq.${ownerId}` 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['company-dashboard', ownerId] });
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'assessment_registrations' 
      }, () => {
        // We invalidate on any registration since we don't have a direct company_id in that table
        // but we can optimize this if needed by checking the assessment_id
        queryClient.invalidateQueries({ queryKey: ['company-dashboard', ownerId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ownerId, queryClient]);

  if (isLoading) return <DashboardSkeleton />;

  const {
    assessments = [],
    upcomingCount = 0,
    activeAssessmentsCount = 0,
    pastAssessmentsCount = 0,
    activeRolesCount = 0,
    totalCandidates = 0,
    submissionsCount = 0,
    hasWebsite = true,
  } = data ?? {};

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
                  disabled={!hasWebsite}
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

          {/* Empty state — new company with no assessments */}
          {assessments.length === 0 ? (
            <div className="border border-border p-12 md:p-20 text-center max-w-lg mx-auto mt-8">
              <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-6 mx-auto opacity-60">
                <Briefcase className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="font-mono font-bold text-xl mb-2">No assessments yet</h2>
              <p className="text-sm text-muted-foreground font-mono leading-relaxed mb-8">
                Create your first assessment round to start evaluating candidates on real engineering work.
              </p>
              <div title={!hasWebsite ? "Add your website in Profile to create assessments" : ""}>
                <Button
                  asChild={hasWebsite}
                  disabled={!hasWebsite}
                  className="font-mono uppercase text-xs tracking-widest px-8"
                  onClick={(e) => { if (!hasWebsite) e.preventDefault(); }}
                >
                  {hasWebsite ? (
                    <Link to="/company/assessments/choose">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Assessment
                    </Link>
                  ) : (
                    <span><Plus className="h-4 w-4 mr-2" />Create First Assessment</span>
                  )}
                </Button>
              </div>
              {!hasWebsite && (
                <p className="mt-4 text-xs text-muted-foreground font-mono">
                  Add your website in <Link to="/company/profile" className="underline hover:text-foreground">Profile</Link> first.
                </p>
              )}
            </div>
          ) : (
            <>
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
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4 p-4 border-b border-border text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                <span>Role</span>
                <span>Status</span>
                <span className="hidden md:block">Positions</span>
                <span>Candidates</span>
                <span className="hidden md:block">Created</span>
              </div>
              {assessments.map((role) => (
                <Link
                  key={role.id}
                  to={`/company/assessments/${role.id}`}
                  className="grid grid-cols-3 md:grid-cols-5 gap-4 p-4 border-b border-border last:border-b-0 font-mono text-xs hover:bg-secondary/50 transition-colors cursor-pointer items-center"
                >
                  <span className="font-semibold uppercase truncate">{role.title}</span>
                  <span className={cn(
                    "text-[10px] uppercase tracking-tighter px-2 py-0.5 border w-fit",
                    role.status === 'published' ? "border-white bg-white text-black font-bold" : "border-muted-foreground text-muted-foreground"
                  )}>
                    {role.status === 'awaiting_classroom_setup' ? 'waiting for admin' : role.status}
                  </span>
                  <span className="hidden md:block">{role.is_paid ? role.positions : "-"}</span>
                  <span>{role.registrationsCount}</span>
                  <span className="text-muted-foreground whitespace-nowrap hidden md:block">{new Date(role.created_at).toLocaleDateString('en-GB')}</span>
                </Link>
              ))}
            </div>
          </section>
            </>
          )}

        </div>
      </div>
    </Layout>
  );
}
