import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type Company, type Candidate } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Layout } from '@/components/layout/Layout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, Building2, Terminal, ShieldAlert, Users } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  // Helper: is logged-in user superadmin?
  const isSuperadmin = profile?.role === 'superadmin';
  const isAdmin = profile?.role === 'admin' || isSuperadmin;
  const [companies, setCompanies] = useState<(Company & { email: string })[]>([]);
  const [candidates, setCandidates] = useState<(Candidate & { email: string })[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'awaiting_classroom_setup' | 'completed'>('all');
  const [loading, setLoading] = useState(true);

  const [adminProfiles, setAdminProfiles] = useState<any[]>([]);
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState<'company' | 'candidate' | 'admin' | 'superadmin'>('candidate');
  const [updatingRole, setUpdatingRole] = useState(false);
  const [upcomingAssessments, setUpcomingAssessments] = useState<any[]>([]);
  const [grantingAccess, setGrantingAccess] = useState<string | null>(null);
  const [revokingAccess, setRevokingAccess] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'companies';

  const setActiveTab = (tab: string) => {
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    }, { replace: true });
  };

  // Filters & Modals
  const [assessmentCompanyFilter, setAssessmentCompanyFilter] = useState('all');
  const [assessmentDateFilter, setAssessmentDateFilter] = useState('');
  const [upcomingCompanyFilter, setUpcomingCompanyFilter] = useState('all');
  const [viewAllModalOpen, setViewAllModalOpen] = useState(false);
  const [selectedAssessmentForModal, setSelectedAssessmentForModal] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadAssessments();
    loadUpcomingAssessments();
  }, []);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('admin_dashboard_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assessment_registrations' },
        () => {
          loadUpcomingAssessments();
          loadAssessments();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies' },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        () => {
          loadData();
          loadUpcomingAssessments();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assessments' },
        () => {
          loadAssessments();
          loadUpcomingAssessments();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadAssessments() {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`id,title,status,github_repo_owner,github_repo_name,company_user_id,created_at,start_at,duration_minutes,is_paid,positions,technologies,is_sample,emergency_abandoned`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading assessments:', error);
        throw error;
      }

      // Fetch company names for all assessments
      const companyIds = Array.from(new Set(data?.map(a => a.company_user_id).filter(Boolean)));
      let companiesMap: Record<string, string> = {};

      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from('companies')
          .select('user_id,name')
          .in('user_id', companyIds as any[]);
        if (companies) {
          companiesMap = Object.fromEntries(companies.map(c => [c.user_id, c.name]));
        }
      }

      const enrichedData = (data || []).map(a => ({
        ...a,
        company_name: companiesMap[a.company_user_id] || 'Unknown'
      }));

      setAssessments(enrichedData);
    } catch (err) {
      console.error('Error loading assessments:', err);
    }
  }

  async function loadUpcomingAssessments() {
    try {
      // Get all registrations for assessments
      const { data: allRegistrations, error: regError } = await supabase
        .from('assessment_registrations')
        .select('assessment_id, id, user_id, access_granted, repo_provisioned, github_username, private_repo_url, selection_status, score'); // Added score

      console.log('All registrations:', allRegistrations);

      // Get ALL assessments regardless of status or timing
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select('id, title, start_at, duration_minutes, status, created_at, company_user_id, identities_revealed, is_paid') // Added is_paid
        .order('created_at', { ascending: false })
        .limit(100);

      console.log('All assessments for access management:', assessmentsData);

      if (assessmentsError) throw assessmentsError;

      // Fetch company names
      const companyIds = Array.from(new Set(assessmentsData?.map(a => a.company_user_id).filter(Boolean) || []));
      let companiesMap: Record<string, string> = {};

      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from('companies')
          .select('user_id,name')
          .in('user_id', companyIds as any[]);
        if (companies) {
          companiesMap = Object.fromEntries(companies.map(c => [c.user_id, c.name]));
        }
      }

      // Combine assessments with their registrations
      const enrichedAssessments = await Promise.all(
        (assessmentsData || []).map(async (assessment) => {
          const regs = (allRegistrations || []).filter(r => r.assessment_id === assessment.id);

          // Enrich with candidate data if needed
          const enrichedRegs = await Promise.all(
            regs.map(async (reg) => {
              if (!reg.github_username) {
                const { data: candidate } = await supabase
                  .from('candidates')
                  .select('github_username')
                  .eq('user_id', reg.user_id)
                  .single();

                return { ...reg, github_username: candidate?.github_username || 'Unknown' };
              }
              return reg;
            })
          );

          console.log(`Assessment ${assessment.title} has ${enrichedRegs.length} registrations:`, enrichedRegs);
          return {
            ...assessment,
            assessment_registrations: enrichedRegs,
            company_name: companiesMap[assessment.company_user_id] || 'Unknown'
          };
        })
      );

      console.log('Final enriched assessments:', enrichedAssessments);
      setUpcomingAssessments(enrichedAssessments);
    } catch (err) {
      console.error('Error loading upcoming assessments:', err);
    }
  }

  async function handleGrantAccess(assessmentId: string) {
    setGrantingAccess(assessmentId);
    try {
      const assessment = upcomingAssessments.find(a => a.id === assessmentId);
      if (!assessment) return;

      const registrations = assessment.assessment_registrations.filter((reg: any) =>
        reg.repo_provisioned && !reg.access_granted
      );

      if (registrations.length === 0) {
        toast({
          title: 'No Access to Grant',
          description: 'No candidates waiting for access',
        });
        setGrantingAccess(null);
        return;
      }

      let successCount = 0;
      let failCount = 0;
      const updatedRegistrationIds: string[] = [];

      for (const reg of registrations) {
        try {
          const { error } = await supabase.functions.invoke('grant-assessment-access', {
            body: {
              assessmentId,
              candidateUserId: reg.user_id,
              candidateGithubUsername: reg.github_username
            }
          });

          if (error) throw error;
          successCount++;
          updatedRegistrationIds.push(reg.id);
        } catch (err) {
          console.error('Failed to grant access for registration:', reg.id, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        // Update UI immediately after successful grants
        setUpcomingAssessments(prev => prev.map(a => {
          if (a.id !== assessmentId) return a;
          return {
            ...a,
            assessment_registrations: a.assessment_registrations.map((reg: any) => {
              if (updatedRegistrationIds.includes(reg.id)) {
                return { ...reg, access_granted: true };
              }
              return reg;
            })
          };
        }));

        toast({
          title: 'Access Granted',
          description: `Granted access to ${successCount} candidate${successCount > 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
      } else {
        toast({
          title: 'Failed',
          description: 'Could not grant access to any candidates',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error('Error granting access:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to grant access',
        variant: 'destructive'
      });
    } finally {
      setGrantingAccess(null);
    }
  }

  async function handleEmergencyDeleteRound(assessmentId: string) {
    if (revokingAccess) return;
    const confirmed = window.confirm(
      'EMERGENCY DELETE ROUND\n\nThis will:\n• Auto-submit all candidates\n• Revoke all GitHub access\n• Mark the round as completed (abandoned)\n\nThis cannot be undone. Continue?'
    );
    if (!confirmed) return;

    setRevokingAccess(assessmentId);
    try {
      const assessment = upcomingAssessments.find(a => a.id === assessmentId);
      if (!assessment) return;

      // 1. Revoke all GitHub collaborator access FIRST (while access_granted is still true in DB,
      //    so the edge function can find the registrations to process)
      await supabase.functions.invoke('revoke-assessment-access', {
        body: { assessmentId }
      });

      // 2. Now mark all registrations finished + complete the round as abandoned
      const { error: rpcError } = await supabase.rpc('admin_emergency_delete_round', {
        p_assessment_id: assessmentId
      });
      if (rpcError) throw rpcError;

      // 3. Update UI immediately
      setUpcomingAssessments(prev => prev.map(a => {
        if (a.id !== assessmentId) return a;
        return {
          ...a,
          status: 'completed',
          emergency_abandoned: true,
          assessment_registrations: a.assessment_registrations.map((reg: any) => ({
            ...reg,
            access_granted: false
          }))
        };
      }));

      toast({
        title: 'Round Emergency Deleted',
        description: 'All candidates auto-submitted, access revoked, and round completed.',
      });
    } catch (err: any) {
      console.error('Emergency delete round failed:', err);
      loadUpcomingAssessments();
      toast({
        title: 'Error',
        description: err.message || 'Failed to emergency delete round',
        variant: 'destructive'
      });
    } finally {
      setRevokingAccess(null);
    }
  }

  async function handleGrantSingleAccess(assessmentId: string, registration: any) {
    if (grantingAccess) return; // simple lock
    setGrantingAccess(`${assessmentId}-${registration.id}`);

    try {
      // Optimistic update
      setUpcomingAssessments(prev => prev.map(a => {
        if (a.id !== assessmentId) return a;
        return {
          ...a,
          assessment_registrations: a.assessment_registrations.map((reg: any) => {
            if (reg.id === registration.id) return { ...reg, access_granted: true };
            return reg;
          })
        };
      }));

      const { error } = await supabase.functions.invoke('grant-assessment-access', {
        body: {
          assessmentId,
          candidateUserId: registration.user_id,
          candidateGithubUsername: registration.github_username
        }
      });

      if (error) throw error;

      toast({
        title: 'Access Granted',
        description: `Granted access to ${registration.github_username}`,
      });
    } catch (err: any) {
      console.error('Failed to grant single access:', err);
      // Revert optimistic
      loadUpcomingAssessments();
      toast({
        title: 'Error',
        description: err.message || 'Failed to grant access',
        variant: 'destructive'
      });
    } finally {
      setGrantingAccess(null);
    }
  }

  // candidateTabCount is computed later (after `allCandidates` is available)

  async function loadData() {
    try {
      setLoading(true);

      // Fetch companies with email from profiles
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select(`
          *,
          profiles!companies_user_id_fkey (email)
        `)
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      // Fetch candidates with email from profiles
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select(`
          *,
          profiles!candidates_user_id_fkey (email, role)
        `)
        .order('created_at', { ascending: false });

      if (candidatesError) throw candidatesError;

      // Fetch global admin profiles so admins can be viewed in the candidates tab.
      // Use case-insensitive match and fall back to a client-side filter if needed.
      let adminsData: any[] | null = null;
      try {
        const adminsRes = await supabase
          .from('profiles')
          .select('*')
          .ilike('role', '%admin%')
          .order('created_at', { ascending: false });
        if (adminsRes.error) {
          console.warn('Failed to load admin profiles via ilike, continuing without admins', adminsRes.error);
          adminsData = [];
        } else {
          adminsData = adminsRes.data as any[];
        }
      } catch (err) {
        console.warn('Admin profiles fetch failed', err);
        adminsData = [];
      }

      // If no admins returned, fetch all profiles and filter client-side (handles RLS quirks or unexpected role values)
      if ((!adminsData || adminsData.length === 0)) {
        try {
          const allProfilesRes = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          if (!allProfilesRes.error && allProfilesRes.data) {
            adminsData = (allProfilesRes.data as any[]).filter(p => (p.role || '').toString().toLowerCase().includes('admin'));
          }
        } catch (err) {
          console.warn('Fallback all-profiles fetch failed', err);
        }
      }

      // Format data
      const formattedCompanies = companiesData?.map((c: any) => ({
        ...c,
        email: c.profiles?.email || 'N/A',
      })) || [];

      const formattedCandidates = candidatesData?.map((c: any) => ({
        ...c,
        email: c.profiles?.email || 'N/A',
        role: c.profiles?.role || 'candidate'
      })) || [];

      const formattedAdmins = adminsData?.map((p: any) => ({
        id: p.id,
        user_id: p.id,
        full_name: p.full_name || p.name || ((p.first_name || '') + (p.last_name ? ` ${p.last_name}` : '')) || p.email || 'Admin',
        email: p.email || 'N/A',
        role: p.role || 'admin',
        github_username: p.github_username,
        linkedin_url: p.linkedin_url,
        created_at: p.created_at
      })) || [];

      // If the candidates table is empty, fall back to profiles with role 'candidate'
      let finalCandidates = formattedCandidates;
      if ((!finalCandidates || finalCandidates.length === 0)) {
        try {
          const { data: profCandidates, error: profCandidatesError } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'candidate')
            .order('created_at', { ascending: false });

          if (!profCandidatesError && profCandidates) {
            finalCandidates = (profCandidates as any[]).map((p: any) => ({
              id: p.id,
              user_id: p.id,
              full_name: p.full_name || p.name || ((p.first_name || '') + (p.last_name ? ` ${p.last_name}` : '')) || p.email || 'Candidate',
              email: p.email || 'N/A',
              role: p.role || 'candidate',
              github_username: p.github_username,
              linkedin_url: p.linkedin_url,
              created_at: p.created_at
            }));
          }
        } catch (err) {
          console.warn('Fallback profile candidates fetch failed', err);
        }
      }

      setCompanies(formattedCompanies);
      setCandidates(finalCandidates || []);
      setAdminProfiles(formattedAdmins);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  function openEditModal(user: any) {
    if (!profile || profile.role !== 'superadmin') {
      toast({ title: 'Not allowed', description: 'Only superadmins can change roles', variant: 'destructive' });
      return;
    }
    setEditingUser(user);
    setNewRole((user.role || 'candidate') as any);
  }

  async function saveRoleChange() {
    if (!editingUser) return;
    setUpdatingRole(true);
    try {
      const userId = editingUser.user_id || editingUser.id;
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      toast({ title: 'Role updated', description: `User role changed to ${newRole}` });
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to update role', err);
      toast({ title: 'Update failed', description: err.message || String(err), variant: 'destructive' });
    } finally {
      setUpdatingRole(false);
    }
  }

  function viewAsCompany(userId: string) {
    navigate(`/admin/view-as/company/${userId}`);
  }

  function viewAsCandidate(userId: string) {
    navigate(`/admin/view-as/candidate/${userId}`);
  }

  const filteredAssessments = assessments.filter((a) => {
    // Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        const startTime = a.start_at ? new Date(a.start_at) : null;
        const now = new Date();
        const endTime = startTime && a.duration_minutes
          ? new Date(startTime.getTime() + a.duration_minutes * 60000)
          : null;
        const hasEnded = endTime && now >= endTime;
        // Check for time-based completion OR explicit status
        const isExplicitlyCompleted = a.status === 'completed' || a.status === 'under_review';

        if (!hasEnded && !isExplicitlyCompleted) return false;
      } else {
        if (a.status !== statusFilter) return false;
      }
    }

    // Company Filter
    if (assessmentCompanyFilter !== 'all' && a.company_name !== assessmentCompanyFilter) return false;

    // Date Filter (Start Date)
    if (assessmentDateFilter) {
      if (!a.start_at) return false;
      const d = new Date(a.start_at);
      if (isNaN(d.getTime())) return false; // Invalid date safety
      const dateStr = d.toISOString().split('T')[0];
      if (dateStr !== assessmentDateFilter) return false;
    }

    return true;
  });

  const filteredUpcomingAssessments = upcomingAssessments.filter((a) => {
    if (upcomingCompanyFilter !== 'all' && a.company_name !== upcomingCompanyFilter) return false;
    return true;
  });

  // Derived list of unique company names from loaded companies for the dropdown
  const uniqueCompanyNames = Array.from(new Set(companies.map(c => c.name))).sort();

  // Prepare candidates/admins list depending on the current user's role.
  // - If NOT superadmin: show only users (no admins/superadmins)
  // - If superadmin: merge admins + users, excluding superadmins
  const allCandidates = candidates.slice();
  // Compute candidate tab count appropriate for the current viewer:
  // - Regular admins: count only users (no admins/superadmins)
  // - Superadmins: count admins + users (exclude superadmins)
  let candidateTabCount = 0;
  if (!isSuperadmin) {
    candidateTabCount = allCandidates.filter((c: any) => {
      const role = (c.role || '').toLowerCase();
      return role !== 'admin' && role !== 'superadmin';
    }).length;
  } else {
    const map = new Map<string, any>();
    for (const a of adminProfiles) {
      if ((a.role || '').toLowerCase() !== 'superadmin') map.set(String(a.user_id || a.id), a);
    }
    for (const c of allCandidates as any[]) {
      const role = (c.role || '').toLowerCase();
      if (role !== 'superadmin') map.set(String(c.user_id || c.id), c);
    }
    candidateTabCount = map.size;
  }

  let filteredCandidates: any[] = [];

  if (!isSuperadmin) {
    // Regular admin: always show only users (no admins, no superadmins)
    filteredCandidates = allCandidates.filter((c: any) => {
      const role = (c.role || '').toLowerCase();
      return role !== 'admin' && role !== 'superadmin';
    });
  } else {
    // Superadmin: merge admins and candidates, exclude superadmins
    const map = new Map<string, any>();
    for (const a of adminProfiles) {
      if ((a.role || '').toLowerCase() !== 'superadmin') {
        map.set(String(a.user_id || a.id), a);
      }
    }
    for (const c of allCandidates as any[]) {
      const key = String(c.user_id || c.id);
      const role = (c.role || '').toLowerCase();
      if (!map.has(key) && role !== 'superadmin') map.set(key, c);
    }
    filteredCandidates = Array.from(map.values());
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center font-mono">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-primary/20 border-t-primary animate-spin rounded-full" />
            <p className="text-xs uppercase tracking-[0.3em] opacity-50">Synchronizing Dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-8 md:py-12 bg-background/95">
        <div className="container px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 text-center md:text-left">
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                <h1 className="text-3xl md:text-5xl font-black font-mono tracking-tighter uppercase">Admin Dashboard</h1>
                {isSuperadmin && (
                  <Badge className="bg-primary hover:bg-primary px-3 py-1 text-[10px] font-black tracking-[0.2em] rounded-sm uppercase">Superadmin</Badge>
                )}
              </div>
              <p className="text-white font-mono text-xs md:text-sm tracking-widest uppercase font-bold">
                Manage companies, assessments and user permissions
              </p>
            </div>
            {isSuperadmin && (
              <div className="hidden lg:block p-4 border border-primary/20 bg-primary/5 rounded-sm">
                <p className="text-[10px] font-mono text-primary uppercase tracking-[0.1em] leading-tight text-right text-muted-foreground">
                  System Authorization: Level 0<br />
                  <span className="opacity-60 text-[9px]">All protocols editable</span>
                </p>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-white font-black ml-1">
                Select Viewport
              </label>
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full md:w-[320px] h-14 bg-card/40 border-border/50 rounded-none font-mono text-xs uppercase tracking-[0.2em] focus:ring-1 focus:ring-primary/30 group transition-all hover:bg-card/60 px-5">
                  <SelectValue placeholder="Navigate Registry" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-border/50 rounded-none p-0 overflow-hidden backdrop-blur-xl">
                  <SelectItem value="companies" className="font-mono text-[10px] uppercase tracking-widest py-4 focus:bg-primary/10 focus:text-primary rounded-none border-b border-border/10 last:border-0 cursor-pointer">
                    <div className="flex items-center justify-between w-full min-w-[260px]">
                      <span className="flex items-center gap-3">
                        <Building2 className="w-3 h-3 text-white" />
                        Companies
                      </span>
                      <Badge variant="outline" className="text-[9px] min-w-8 justify-center rounded-none font-bold text-white border-primary/50">{companies.length}</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="assessments" className="font-mono text-[10px] uppercase tracking-widest py-4 focus:bg-primary/10 focus:text-primary rounded-none border-b border-border/10 last:border-0 cursor-pointer">
                    <div className="flex items-center justify-between w-full min-w-[260px]">
                      <span className="flex items-center gap-3">
                        <Terminal className="w-3 h-3 text-white" />
                        Assessments
                      </span>
                      <Badge variant="outline" className="text-[9px] min-w-8 justify-center rounded-none font-bold text-white border-primary/50">{assessments.length}</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="upcoming" className="font-mono text-[10px] uppercase tracking-widest py-4 focus:bg-primary/10 focus:text-primary rounded-none border-b border-border/10 last:border-0 cursor-pointer">
                    <div className="flex items-center justify-between w-full min-w-[260px]">
                      <span className="flex items-center gap-3">
                        <ShieldAlert className="w-3 h-3 text-white" />
                        Access Settings
                      </span>
                      <Badge variant="outline" className="text-[9px] min-w-8 justify-center rounded-none font-bold text-white border-primary/50">{upcomingAssessments.length}</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="candidates" className="font-mono text-[10px] uppercase tracking-widest py-4 focus:bg-primary/10 focus:text-primary rounded-none border-b border-border/10 last:border-0 cursor-pointer">
                    <div className="flex items-center justify-between w-full min-w-[260px]">
                      <span className="flex items-center gap-3">
                        <Users className="w-3 h-3 text-white" />
                        Candidates
                      </span>
                      <Badge variant="outline" className="text-[9px] min-w-8 justify-center rounded-none font-bold text-white border-primary/50">{candidateTabCount}</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="companies" className="space-y-6">
              {companies.length === 0 ? (
                <div className="py-20 border border-dashed border-border/50 text-center rounded-sm">
                  <p className="text-xs text-white font-bold font-mono uppercase tracking-widest">No companies registered</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companies.map((company) => (
                    <Card key={company.id} className="border border-white/30 bg-card/30 rounded-sm hover:border-white/60 transition-all flex flex-col">
                      <CardHeader className="p-6 pb-4">
                        <CardTitle className="font-mono text-lg uppercase tracking-tight truncate font-bold text-white">{company.name}</CardTitle>
                        <CardDescription className="font-mono text-[11px] truncate text-gray-300 font-semibold">{company.email}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 pt-0 space-y-4 flex-1">
                        <div className="space-y-2 border-t border-white/20 pt-4">
                          {company.domain && (
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-gray-300 uppercase font-bold">Domain</span>
                              <span className="text-primary truncate ml-4 font-bold">{company.domain}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-gray-300 uppercase font-bold">Joined</span>
                            <span className="text-white font-semibold">{new Date(company.created_at).toLocaleDateString('en-GB')}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => viewAsCompany(company.user_id)}
                          className="w-full font-mono text-[10px] h-10 uppercase tracking-widest mt-auto shadow-none rounded-none border-white/40 hover:bg-white/10 text-white font-semibold"
                        >
                          View as Company
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assessments" className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-border/20">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Status Filter */}
                  <div className="flex items-center gap-0 bg-secondary/20 p-1 rounded-sm border border-border/30">
                    <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 font-bold text-white">Status</span>
                    <select className="font-mono text-[10px] p-1 px-3 bg-transparent outline-none cursor-pointer w-32 border-l border-border/30 text-white" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                      <option value="all">ALL</option>
                      <option value="ready">READY</option>
                      <option value="awaiting_classroom_setup">AWAITING SETUP</option>
                      <option value="completed">COMPLETED</option>
                    </select>
                  </div>

                  {/* Company Filter */}
                  <div className="flex items-center gap-0 bg-secondary/20 p-1 rounded-sm border border-border/30">
                    <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 font-bold text-white">Company</span>
                    <select className="font-mono text-[10px] p-1 px-3 bg-transparent outline-none cursor-pointer w-32 border-l border-border/30 text-white" value={assessmentCompanyFilter} onChange={(e) => setAssessmentCompanyFilter(e.target.value)}>
                      <option value="all">ALL</option>
                      {uniqueCompanyNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div className="flex items-center gap-0 bg-secondary/20 p-1 rounded-sm border border-border/30">
                    <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 font-bold text-white">Date</span>
                    <Input
                      type="date"
                      className="h-6 w-32 rounded-none border-0 border-l border-border/30 bg-transparent px-2 text-[10px] font-mono uppercase text-white shadow-none focus-visible:ring-0"
                      value={assessmentDateFilter}
                      onChange={(e) => setAssessmentDateFilter(e.target.value)}
                    />
                  </div>
                </div>

                <div className="font-mono text-[10px] uppercase tracking-widest text-white font-bold">
                  Showing {filteredAssessments.length} / {assessments.length} assessments
                </div>
              </div>

              {filteredAssessments.length === 0 ? (
                <div className="py-20 border border-dashed border-border/50 text-center rounded-sm">
                  <p className="text-xs text-white font-bold font-mono uppercase tracking-widest">No assessments found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredAssessments.map((a) => {
                    const startTime = a.start_at ? new Date(a.start_at) : null;
                    const now = new Date();
                    const hasStarted = startTime && now >= startTime;
                    const endTime = startTime && a.duration_minutes
                      ? new Date(startTime.getTime() + a.duration_minutes * 60000)
                      : null;
                    const hasEnded = endTime && now >= endTime;

                    // Time-based status logic (same as company dashboard)
                    // Active = started but not ended
                    // Completed = time has elapsed
                    const needsSetup = a.status === 'awaiting_classroom_setup' || a.status === 'draft';
                    const isReady = ((a.status === 'ready' || a.status === 'started') && !hasStarted) || (a.is_sample && (a.status === 'ready' || a.status === 'started'));
                    const isActive = hasStarted && !hasEnded && !a.is_sample;
                    const isCompleted = hasEnded && !a.is_sample;

                    // Determine display status based purely on time
                    const displayStatus = needsSetup ? 'Setup Required' :
                      isCompleted ? 'Completed' :
                        isActive ? 'Active' :
                          isReady ? 'Ready' : a.status;

                    return (
                      <Card key={a.id} className={`border border-white/30 bg-card/30 rounded-sm hover:border-white/60 transition-all ${isActive ? 'border-primary/50 bg-primary/5' : ''}`}>
                        <CardHeader className="p-6 pb-2">
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <div>
                              <CardTitle className="font-mono text-lg uppercase tracking-tight font-bold text-white">{a.title || 'Untitled Assessment'}</CardTitle>
                              <p className="text-[10px] font-mono uppercase tracking-widest text-primary mt-1 font-semibold">{a.company_name}</p>
                            </div>
                            <Badge variant={isCompleted ? "secondary" : isActive ? "default" : "outline"} className="text-[9px] px-2 h-5 uppercase tracking-widest font-black rounded-none">
                              {displayStatus}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-6">
                          <div className="grid grid-cols-2 gap-y-3 gap-x-6 border-y border-white/20 py-4">
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-300 block font-bold">Assessment ID</span>
                              <span className="text-[10px] font-mono break-all text-white font-semibold">#{a.id.split('-')[0]}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-300 block font-bold">Billing</span>
                              <span className="text-[10px] font-mono text-primary font-bold">{a.is_paid ? 'PAID' : 'FREE'}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-300 block font-bold">Registrations</span>
                              <span className="text-[10px] font-mono font-bold uppercase text-white">{a.positions} Positions</span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono uppercase tracking-widest text-gray-300 block font-bold">Status</span>
                              <span className="text-[10px] font-mono uppercase truncate text-white font-semibold">
                                {displayStatus}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs">
                            {/* Ready and not started - show view details + reset */}
                            {isReady && (
                              <>
                                <Button size="sm" className="h-9 px-6 font-mono text-[10px] uppercase tracking-widest rounded-none" onClick={() => navigate(`/admin/assessment/${a.id}`)}>View Details</Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9 px-6 font-mono text-[10px] uppercase tracking-widest rounded-none border-primary/20"
                                  onClick={async () => {
                                    try {
                                      const { error } = await supabase
                                        .from('assessments')
                                        .update({ status: 'awaiting_classroom_setup' })
                                        .eq('id', a.id);
                                      if (error) throw error;
                                      toast({ title: 'Status Reset', description: 'Assessment reset to setup phase' });
                                      loadAssessments();
                                    } catch (err: any) {
                                      toast({ title: 'Error', description: err.message, variant: 'destructive' });
                                    }
                                  }}
                                >
                                  Reset State
                                </Button>
                              </>
                            )}
                            {/* Needs setup - show setup button */}
                            {needsSetup && (
                              <Button size="sm" className="h-9 px-6 font-mono text-[10px] uppercase tracking-widest rounded-none" onClick={() => navigate(`/admin/assessment/${a.id}/setup`)}>
                                Setup Assessment
                              </Button>
                            )}
                            {/* In progress - show monitor button */}
                            {isActive && (
                              <Button size="sm" className="h-9 px-6 font-mono text-[10px] uppercase tracking-widest rounded-none" onClick={() => navigate(`/admin/assessment/${a.id}`)}>
                                Monitor Session
                              </Button>
                            )}
                            {/* Completed - show view submissions (for admin view) */}
                            {isCompleted && (
                              <Button size="sm" variant="outline" className="h-9 px-6 font-mono text-[10px] uppercase tracking-widest rounded-none border-primary/20" onClick={() => navigate(`/admin/assessment/${a.id}`)}>
                                View Submissions
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-6">
              <div className="flex justify-end pb-4">
                <div className="flex items-center gap-0 bg-secondary/20 p-1 rounded-sm border border-border/30">
                  <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 font-bold text-white">Company Filter</span>
                  <select className="font-mono text-[10px] p-1 px-3 bg-transparent outline-none cursor-pointer w-32 border-l border-border/30 text-white" value={upcomingCompanyFilter} onChange={(e) => setUpcomingCompanyFilter(e.target.value)}>
                    <option value="all">ALL</option>
                    {uniqueCompanyNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredUpcomingAssessments.length === 0 ? (
                <div className="py-20 border border-dashed border-border/50 text-center rounded-sm">
                  <p className="text-xs text-white font-bold font-mono uppercase tracking-widest">No assessments requiring access management</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {filteredUpcomingAssessments.map((assessment) => {
                    const totalRegistrations = assessment.assessment_registrations.length;
                    const pendingRegistrations = assessment.assessment_registrations.filter((reg: any) =>
                      reg.repo_provisioned && !reg.access_granted
                    );
                    const unprovisionedRegistrations = assessment.assessment_registrations.filter((reg: any) =>
                      !reg.repo_provisioned
                    );
                    const accessGrantedCount = assessment.assessment_registrations.filter((reg: any) =>
                      reg.access_granted
                    ).length;
                    const startTime = assessment.start_at ? new Date(assessment.start_at) : null;
                    const now = new Date();
                    const endTime = startTime && assessment.duration_minutes
                      ? new Date(startTime.getTime() + assessment.duration_minutes * 60000)
                      : null;
                    const hasEnded = endTime && now >= endTime;

                    let timingText = 'No start time set';
                    if (startTime) {
                      const timeUntilStart = Math.round((startTime.getTime() - now.getTime()) / 60000);
                      const hasStarted = now >= startTime;

                      if (hasEnded && !assessment.is_sample) {
                        timingText = 'COMPLETED';
                      } else if (hasStarted) {
                        timingText = `ACTIVE: ${Math.abs(timeUntilStart)}m ago`;
                      } else {
                        const days = Math.floor(timeUntilStart / (60 * 24));
                        const hours = Math.floor((timeUntilStart % (60 * 24)) / 60);
                        const minutes = timeUntilStart % 60;

                        let timeString = '';
                        if (days > 0) timeString += `${days}d `;
                        if (hours > 0) timeString += `${hours}h `;
                        if (days === 0 || hours === 0) timeString += `${minutes}m`; // Always show minutes if short duration, or if just days+hours? Maybe simple logic:

                        // Cleaner Logic:
                        const parts = [];
                        if (days > 0) parts.push(`${days}d`);
                        if (hours > 0) parts.push(`${hours}h`);
                        parts.push(`${minutes}m`);

                        timingText = `STARTS IN: ${parts.join(' ')}`;
                      }
                    }

                    return (
                      <Card key={assessment.id} className="border border-white/30 bg-card/30 rounded-sm overflow-hidden flex flex-col">
                        <div className="h-1.5 w-full bg-primary/10">
                          <div
                            className="h-full bg-primary transition-all overflow-hidden relative"
                            style={{ width: `${(accessGrantedCount / Math.max(totalRegistrations, 1)) * 100}%` }}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-pulse" />
                          </div>
                        </div>
                        <CardHeader className="p-6 pb-2">
                          <CardTitle className="font-mono text-lg uppercase tracking-tight font-bold text-white">{assessment.title || 'Untitled Assessment'}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-[9px] font-mono tracking-widest h-5 uppercase px-2 border-primary/30 text-primary rounded-none">
                              {timingText}
                            </Badge>
                            <span className="text-[10px] font-mono text-gray-200 uppercase tracking-widest font-bold">{assessment.company_name}</span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-6 flex-1 flex flex-col">
                          <div className={`grid gap-2 mt-4 ${(assessment.status === 'completed' || assessment.status === 'under_review') ? 'grid-cols-1' : 'grid-cols-3'}`}>
                            <div className="bg-secondary/20 p-3 rounded-none text-center">
                              <span className="text-[9px] font-mono uppercase text-white block mb-1 tracking-tighter font-black">Total</span>
                              <span className="text-xl font-mono font-bold leading-none">{totalRegistrations}</span>
                            </div>
                            {(assessment.status !== 'completed' && assessment.status !== 'under_review') && (
                              <div className="bg-primary/5 p-3 rounded-none text-center border border-primary/10">
                                <span className="text-[9px] font-mono uppercase text-primary block mb-1 tracking-tighter font-bold">Granted</span>
                                <span className="text-xl font-mono font-bold text-primary leading-none">{accessGrantedCount}</span>
                              </div>
                            )}
                            {(assessment.status !== 'completed' && assessment.status !== 'under_review') ? (
                              <div className="bg-orange-500/5 p-3 rounded-none text-center border border-orange-500/10">
                                <span className="text-[9px] font-mono uppercase text-orange-500 block mb-1 tracking-tighter font-bold">Pending</span>
                                <span className="text-xl font-mono font-bold text-orange-500 leading-none">{pendingRegistrations.length}</span>
                              </div>
                            ) : null}
                          </div>

                          {/* Only show Pending Environment box if assessment is NOT complete */}
                          {(assessment.status !== 'completed' && assessment.status !== 'under_review') && unprovisionedRegistrations.length > 0 && (
                            <div className="p-4 bg-muted/30 border border-border/50 rounded-none">
                              <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                                Environments Pending ({unprovisionedRegistrations.length})
                              </h4>
                              <div className="grid grid-cols-1 gap-1 text-[9px] font-mono text-muted-foreground overflow-hidden">
                                {unprovisionedRegistrations.slice(0, 5).map((reg: any) => (
                                  <div key={reg.id} className="truncate select-none">• @{reg.github_username || 'Unknown'}</div>
                                ))}
                                {unprovisionedRegistrations.length > 5 && <div className="italic opacity-50">+ {unprovisionedRegistrations.length - 5} more...</div>}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-3 mt-auto pt-6">
                            {(assessment.status === 'completed' || assessment.status === 'under_review') ? (
                              // Read-only view for completed assessments
                              <div className="flex flex-col gap-2">
                                <div className="p-3 bg-secondary/10 border border-white/10 rounded-sm text-center">
                                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
                                    Assessment Completed • Read Only
                                  </p>
                                </div>
                              </div>
                            ) : (
                              // Active assessment - show actions
                              <>
                                {pendingRegistrations.length > 0 && (
                                  <Button
                                    size="lg"
                                    onClick={() => handleGrantAccess(assessment.id)}
                                    disabled={grantingAccess === assessment.id}
                                    className="w-full font-mono text-[10px] uppercase tracking-widest h-12 rounded-none shadow-[0_0_20px_-5px_rgba(var(--primary),0.4)]"
                                  >
                                    {grantingAccess === assessment.id ? 'Granting Access...' : 'Grant Access to All'}
                                  </Button>
                                )}
                                {accessGrantedCount > 0 && (
                                  <Button
                                    size="lg"
                                    onClick={() => handleEmergencyDeleteRound(assessment.id)}
                                    disabled={revokingAccess === assessment.id}
                                    variant="outline"
                                    className="w-full font-mono text-[10px] uppercase tracking-widest text-red-500 border-red-500/30 hover:bg-red-500/5 h-12 rounded-none"
                                  >
                                    {revokingAccess === assessment.id ? 'Processing...' : 'Emergency Delete Round'}
                                  </Button>
                                )}
                              </>
                            )}
                            {totalRegistrations === 0 && (
                              <p className="text-[10px] font-mono text-white/80 font-bold text-center italic tracking-widest uppercase">No candidates linked to assessment</p>
                            )}
                          </div>

                          {/* Candidate List - Individual Management */}
                          {totalRegistrations > 0 && (
                            <div className="mt-8 border-t border-white/10 pt-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-white">Registered Candidates</h4>
                                {totalRegistrations > 1 && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-[9px] font-mono uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10"
                                    onClick={() => {
                                      setSelectedAssessmentForModal(assessment);
                                      setViewAllModalOpen(true);
                                    }}
                                  >
                                    View All ({totalRegistrations})
                                  </Button>
                                )}
                              </div>

                              {/* If only 1 candidate, show inline. If > 1, show Manage All button (requested: "not in the card itself") */}
                              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {totalRegistrations === 1 ? (
                                  assessment.assessment_registrations.map((reg: any) => (
                                    <div key={reg.id} className="flex items-center justify-between p-3 bg-secondary/10 border border-white/5 rounded-sm hover:bg-secondary/20 transition-colors group">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className={`h-1.5 w-1.5 rounded-full ${reg.access_granted ? 'bg-primary' : reg.repo_provisioned ? 'bg-orange-500' : 'bg-muted-foreground/30'}`} />
                                          <span className="font-mono text-xs font-bold text-white">{reg.github_username || 'Unknown'}</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-gray-300 font-semibold uppercase tracking-tight pl-3.5">
                                          {(assessment.status === 'completed' || assessment.status === 'under_review')
                                            ? 'Assessment Ended'
                                            : reg.access_granted ? 'Access Granted' : reg.repo_provisioned ? 'Ready for Access' : 'Initializing...'}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {(assessment.status === 'completed' || assessment.status === 'under_review') ? (
                                          <Badge variant={reg.selection_status === 'selected' ? 'default' : reg.selection_status === 'rejected' ? 'destructive' : 'outline'} className="text-[8px] font-mono uppercase tracking-widest h-5 px-2 rounded-none">
                                            {!assessment.is_paid ? `Score: ${reg.score !== null ? reg.score : '-'}/10` : reg.selection_status === 'selected' ? (assessment.identities_revealed ? 'Selected' : 'Advanced') : reg.selection_status === 'rejected' ? 'Rejected' : 'Not Selected'}
                                          </Badge>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 px-3 text-[9px] font-mono uppercase tracking-widest rounded-none border-primary/30 text-primary hover:bg-primary/10"
                                            onClick={() => handleGrantSingleAccess(assessment.id, reg)}
                                            disabled={grantingAccess === `${assessment.id}-${reg.id}` || !reg.repo_provisioned}
                                          >
                                            {grantingAccess === `${assessment.id}-${reg.id}` ? '...' : reg.access_granted ? 'Re-Grant' : 'Grant'}
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-4 bg-secondary/5 border border-dashed border-white/10 rounded-sm text-center">
                                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                                      {totalRegistrations} candidates registered
                                    </p>
                                    <Button
                                      variant="link"
                                      className="h-auto p-0 text-[10px] font-mono uppercase tracking-widest text-primary mt-1"
                                      onClick={() => {
                                        setSelectedAssessmentForModal(assessment);
                                        setViewAllModalOpen(true);
                                      }}
                                    >
                                      Manage All Access
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="candidates" className="space-y-6">
              {filteredCandidates.length === 0 ? (
                <div className="py-20 border border-dashed border-border/50 text-center rounded-sm">
                  <p className="text-xs text-white font-bold font-mono uppercase tracking-widest">No candidates registered</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCandidates.map((candidate) => {
                    const isAdminUser = (candidate.role || '').toLowerCase().includes('admin');
                    const isSuperadminUser = (candidate.role || '').toLowerCase() === 'superadmin';
                    const canEdit = isSuperadmin || (!isAdminUser && !isSuperadminUser);
                    return (
                      <Card key={candidate.id} className="border border-white/30 bg-card/30 rounded-sm hover:border-white/60 transition-all flex flex-col">
                        <CardHeader className="p-6 pb-2">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle className="font-mono text-base uppercase tracking-tight truncate font-bold text-white">
                                {candidate.full_name && candidate.full_name !== candidate.email ? candidate.full_name : (candidate.email || '').split('@')[0]}
                              </CardTitle>
                              {isSuperadminUser ? (
                                <Badge className="bg-purple-700 hover:bg-purple-700 text-[8px] font-black h-4 px-1 rounded-none tracking-tighter">SUPER</Badge>
                              ) : isAdminUser ? (
                                <Badge className="bg-red-700 hover:bg-red-700 text-[8px] font-black h-4 px-1 rounded-none tracking-tighter">ADMIN</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[8px] font-black h-4 px-1 rounded-none tracking-tighter opacity-40">USER</Badge>
                              )}
                            </div>
                            <CardDescription className="font-mono text-[10px] truncate leading-none text-gray-300 font-semibold">{candidate.email}</CardDescription>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-4 flex-1 flex flex-col">
                          <div className="space-y-1.5 border-t border-white/20 pt-4 flex-1">
                            {candidate.github_username && (
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className="text-gray-300 uppercase font-bold">GitHub</span>
                                <a href={`https://github.com/${candidate.github_username}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold tracking-tight">@{candidate.github_username}</a>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-gray-300 uppercase font-bold">Joined</span>
                              <span className="text-white font-semibold">{new Date(candidate.created_at).toLocaleDateString('en-GB')}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-gray-300 uppercase font-bold">Role</span>
                              <span className="uppercase font-bold tracking-tighter text-white">{candidate.role || 'Candidate'}</span>
                            </div>
                          </div>
                          <div className="pt-4 flex flex-col gap-2 mt-auto">
                            <Button
                              variant="outline"
                              onClick={() => viewAsCandidate(candidate.user_id || candidate.id)}
                              className="w-full font-mono text-[10px] h-9 uppercase tracking-widest rounded-none border-white/40 hover:bg-white/10 text-white font-semibold"
                            >
                              View as Candidate
                            </Button>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                onClick={() => openEditModal(candidate)}
                                className="w-full font-mono text-[10px] h-9 uppercase tracking-widest opacity-60 hover:opacity-100 hover:bg-primary/5 rounded-none"
                              >
                                Edit User Role
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {
        editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => setEditingUser(null)} />
            <div className="relative z-10 w-full max-w-md bg-card border border-border/80 shadow-2xl rounded-sm p-8 animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-mono font-bold uppercase tracking-tighter mb-1 select-none">Edit User Role</h3>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-8 opacity-60">Changing permissions for user #{editingUser.user_id?.split('-')[0] || editingUser.id?.split('-')[0] || 'Unknown'}</p>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/60">New Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full p-4 bg-secondary/30 border border-border/50 font-mono text-xs uppercase tracking-widest focus:border-primary outline-none transition-all rounded-none"
                  >
                    <option value="candidate">CANDIDATE</option>
                    <option value="company">COMPANY</option>
                    <option value="admin">ADMIN</option>
                    <option value="superadmin">SUPERADMIN</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 font-mono text-[10px] uppercase tracking-widest h-12 rounded-none"
                    onClick={() => setEditingUser(null)}
                    disabled={updatingRole}
                  >
                    Abort
                  </Button>
                  <Button
                    className="flex-1 font-mono text-[10px] uppercase tracking-widest h-12 rounded-none"
                    onClick={saveRoleChange}
                    disabled={updatingRole}
                  >
                    {updatingRole ? 'Updating...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* View All Candidates Modal */}
      <Dialog open={viewAllModalOpen} onOpenChange={setViewAllModalOpen}>
        <DialogContent className="max-w-2xl bg-card border-border/80 p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b border-white/10">
            <DialogTitle className="font-mono text-lg uppercase tracking-tight font-bold text-white">
              Manage Access: {selectedAssessmentForModal?.title}
            </DialogTitle>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              {selectedAssessmentForModal?.assessment_registrations?.length} Candidates Registered
            </p>
          </DialogHeader>
          <div className="p-6">
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {selectedAssessmentForModal?.assessment_registrations?.map((reg: any) => (
                <div key={reg.id} className="flex items-center justify-between p-3 bg-secondary/10 border border-white/5 rounded-sm hover:bg-secondary/20 transition-colors group">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${reg.access_granted ? 'bg-primary' : reg.repo_provisioned ? 'bg-orange-500' : 'bg-muted-foreground/30'}`} />
                      <span className="font-mono text-xs font-bold text-white">{reg.github_username || 'Unknown'}</span>
                    </div>
                    <span className="text-[9px] font-mono text-gray-300 font-semibold uppercase tracking-tight pl-3.5">
                      {(selectedAssessmentForModal.status === 'completed' || selectedAssessmentForModal.status === 'under_review')
                        ? 'Assessment Ended'
                        : reg.access_granted ? 'Access Granted' : reg.repo_provisioned ? 'Ready for Access' : 'Initializing...'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {(selectedAssessmentForModal.status === 'completed' || selectedAssessmentForModal.status === 'under_review') ? (
                      <Badge
                        variant={reg.selection_status === 'selected' ? 'default' : reg.selection_status === 'rejected' ? 'destructive' : 'outline'}
                        className={`text-[8px] font-mono uppercase tracking-widest h-5 px-2 rounded-none ${!reg.selection_status ? 'text-yellow-500 border-yellow-500/50' : ''}`}
                      >
                        {!selectedAssessmentForModal.is_paid ? `Score: ${reg.score !== null ? reg.score : '-'}/10` : reg.selection_status === 'selected' ? (selectedAssessmentForModal.identities_revealed ? 'Selected' : 'Advanced') : reg.selection_status === 'rejected' ? 'Rejected' : 'Pending'}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3 text-[9px] font-mono uppercase tracking-widest rounded-none border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => handleGrantSingleAccess(selectedAssessmentForModal.id, reg)}
                        disabled={grantingAccess === `${selectedAssessmentForModal.id}-${reg.id}` || !reg.repo_provisioned}
                      >
                        {grantingAccess === `${selectedAssessmentForModal.id}-${reg.id}` ? '...' : reg.access_granted ? 'Re-Grant' : 'Grant'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout >
  );
}

