import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type Company, type Candidate } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<(Company & { email: string })[]>([]);
  const [candidates, setCandidates] = useState<(Candidate & { email: string })[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'awaiting_classroom_setup'>('all');
  const [loading, setLoading] = useState(true);
  const [candidateFilter, setCandidateFilter] = useState<'all' | 'admins' | 'non-admins'>('all');
  const [adminProfiles, setAdminProfiles] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadAssessments();
  }, []);

  async function loadAssessments() {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select(`id,title,status,github_repo,company_user_id,created_at`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (err) {
      console.error('Error loading assessments:', err);
    }
  }

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

  function viewAsCompany(userId: string) {
    navigate(`/admin/view-as/company/${userId}`);
  }

  function viewAsCandidate(userId: string) {
    navigate(`/admin/view-as/candidate/${userId}`);
  }

  const filteredAssessments = assessments.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  // Prepare candidates/admins list depending on the selected filter.
  // For 'all' we show the union of admin profiles and candidates (deduped by user_id).
  const allCandidates = candidates.slice();
  let filteredCandidates: any[] = [];
  if (candidateFilter === 'admins') {
    filteredCandidates = adminProfiles.slice();
  } else if (candidateFilter === 'non-admins') {
    filteredCandidates = allCandidates.filter((c: any) => (c.role || '').toLowerCase() !== 'admin');
  } else {
    // all: merge admins and candidates, dedupe by user_id
    const map = new Map<string, any>();
    // add admins first
    for (const a of adminProfiles) {
      map.set(String(a.user_id || a.id), a);
    }
    // add candidates if not already present
    for (const c of allCandidates) {
      const key = String(c.user_id || c.id);
      if (!map.has(key)) map.set(key, c);
    }
    filteredCandidates = Array.from(map.values());
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all companies and candidates
            </p>
          </div>

        <Tabs defaultValue="companies" className="space-y-6">
          <TabsList>
            <TabsTrigger value="companies">
              Companies ({companies.length})
            </TabsTrigger>
            <TabsTrigger value="assessments">
              Assessments ({assessments.length})
            </TabsTrigger>
            <TabsTrigger value="candidates">
              Candidates ({candidates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="space-y-4">
            {companies.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    No companies registered yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              companies.map((company) => (
                <Card key={company.id}>
                  <CardHeader>
                    <CardTitle>{company.name}</CardTitle>
                    <CardDescription>{company.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {company.domain && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Domain:</span> {company.domain}
                      </p>
                    )}
                    {company.linkedin_url && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">LinkedIn:</span>{' '}
                        <a
                          href={company.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {company.linkedin_url}
                        </a>
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Joined:</span>{' '}
                      {new Date(company.created_at).toLocaleDateString()}
                    </p>
                    <Button
                      onClick={() => viewAsCompany(company.user_id)}
                      className="mt-4"
                    >
                      View as Company
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="font-mono text-sm text-muted-foreground">Filter:</label>
                <select className="font-mono p-1 border border-border rounded bg-secondary/50 text-muted-foreground" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="ready">Ready</option>
                  <option value="awaiting_classroom_setup">Awaiting Classroom Setup</option>
                </select>
                <span className="text-sm text-muted-foreground ml-2">Showing {filteredAssessments.length} of {assessments.length}</span>
              </div>
            </div>

            {filteredAssessments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">No assessments</p>
                </CardContent>
              </Card>
            ) : (
              filteredAssessments.map((a) => (
                <Card key={a.id}>
                  <CardHeader>
                    <CardTitle>{a.title || 'Untitled'}</CardTitle>
                    <CardDescription>{a.status}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground"><span className="font-medium">Repo:</span> {a.github_repo || '—'}</p>
                    <p className="text-sm text-muted-foreground"><span className="font-medium">Created:</span> {new Date(a.created_at).toLocaleString()}</p>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => navigate(`/admin/assessment/${a.id}`)}>{a.status === 'ready' ? 'Edit Classroom' : 'Setup Classroom'}</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="candidates" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="font-mono text-sm text-muted-foreground">Filter:</label>
                <select className="font-mono p-1 border border-border rounded bg-secondary/50 text-muted-foreground" value={candidateFilter} onChange={(e) => setCandidateFilter(e.target.value as any)}>
                  <option value="all">All</option>
                  <option value="admins">Admins</option>
                  <option value="non-admins">Non-admins</option>
                </select>
                <span className="text-sm text-muted-foreground ml-2">Showing {filteredCandidates.length} of {candidateFilter === 'all' ? (new Set([...adminProfiles.map(a=>a.user_id||a.id), ...candidates.map(c=>c.user_id||c.id)]).size) : (candidateFilter === 'admins' ? adminProfiles.length : candidates.length)}</span>
              </div>
            </div>

            {filteredCandidates.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    No candidates registered yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredCandidates.map((candidate) => (
                <Card key={candidate.id}>
                  <CardHeader>
                      <CardTitle>{candidate.full_name && candidate.full_name !== candidate.email ? candidate.full_name : (candidate.email || '').split('@')[0]}</CardTitle>
                      <CardDescription>{candidate.email}</CardDescription>
                    </CardHeader>
                  <CardContent className="space-y-2">
                    {candidate.github_username && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">GitHub:</span>{' '}
                        <a
                          href={`https://github.com/${candidate.github_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          @{candidate.github_username}
                        </a>
                      </p>
                    )}
                    {candidate.linkedin_url && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">LinkedIn:</span>{' '}
                        <a
                          href={candidate.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {candidate.linkedin_url}
                        </a>
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Joined:</span>{' '}
                      {new Date(candidate.created_at).toLocaleDateString()}
                    </p>
                    <Button
                      onClick={() => viewAsCandidate(candidate.user_id)}
                      className="mt-4"
                    >
                      View as Candidate
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </Layout>
  );
}
