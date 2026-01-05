import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type Company, type Candidate } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  // Helper: is logged-in user superadmin?
  const isSuperadmin = profile?.role === 'superadmin';
  const isAdmin = profile?.role === 'admin' || isSuperadmin;
  const [companies, setCompanies] = useState<(Company & { email: string })[]>([]);
  const [candidates, setCandidates] = useState<(Candidate & { email: string })[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'awaiting_classroom_setup'>('all');
  const [loading, setLoading] = useState(true);
  
  const [adminProfiles, setAdminProfiles] = useState<any[]>([]);
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [newRole, setNewRole] = useState<'company' | 'candidate' | 'admin' | 'superadmin'>('candidate');
  const [updatingRole, setUpdatingRole] = useState(false);

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
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

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
    for (const c of allCandidates) {
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
    for (const c of allCandidates) {
      const key = String(c.user_id || c.id);
      const role = (c.role || '').toLowerCase();
      if (!map.has(key) && role !== 'superadmin') map.set(key, c);
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
            <h1 className="text-4xl font-bold flex items-center gap-4">
              Admin Dashboard
              {isSuperadmin && (
                <span className="ml-2 px-3 py-1 rounded bg-purple-700 text-xs font-bold text-white animate-pulse">SUPERADMIN</span>
              )}
            </h1>
            {isSuperadmin && (
              <p className="text-purple-400 font-mono mt-2 text-lg">Welcome, Superadmin! You have full access to all admin features and can manage other admins.</p>
            )}
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
              Candidates ({candidateTabCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies" className="space-y-4">
            {companies.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    No companies registered yet
                  </p>
      )
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

            {filteredCandidates.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    No candidates registered yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredCandidates.map((candidate) => {
                const isAdminUser = (candidate.role || '').toLowerCase().includes('admin');
                const isSuperadminUser = (candidate.role || '').toLowerCase() === 'superadmin';
                const isCurrentUser = profile && candidate.email === profile.email;
                // Superadmin can edit anyone. Admin can only edit candidates/companies (not admins/superadmins).
                const canEdit = isSuperadmin || (!isAdminUser && !isSuperadminUser);
                return (
                  <Card key={candidate.id}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CardTitle>
                          {candidate.full_name && candidate.full_name !== candidate.email ? candidate.full_name : (candidate.email || '').split('@')[0]}
                        </CardTitle>
                        {isAdminUser && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-red-700 text-xs font-bold text-white">ADMIN</span>
                        )}
                        {isSuperadminUser && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-purple-700 text-xs font-bold text-white">SUPERADMIN</span>
                        )}
                      </div>
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
                        disabled={false}
                      >
                        View as Candidate
                      </Button>
                      {canEdit ? (
                          <Button className="mt-2" onClick={() => openEditModal(candidate)}>
                            Edit / Change Role
                          </Button>
                        ) : (
                          // Only show this message to admins, not superadmins
                          (!isSuperadmin && (isAdminUser || isSuperadminUser)) ? (
                            <p className="text-xs text-red-500 mt-1 font-semibold">Admin details cannot be changed.</p>
                          ) : null
                        )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Role edit modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setEditingUser(null)} />
          <div className="relative z-10 w-full max-w-md bg-background border border-border rounded p-6">
            <h3 className="text-xl font-semibold mb-4">Edit Role for {editingUser.full_name || editingUser.email}</h3>
            <label className="block mb-2 text-sm">Select role</label>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as any)} className="w-full mb-4 p-2 bg-input border">
              <option value="candidate">candidate</option>
              <option value="company">company</option>
              <option value="admin">admin</option>
              <option value="superadmin">superadmin</option>
            </select>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 border" onClick={() => setEditingUser(null)} disabled={updatingRole}>Cancel</button>
              <button className="px-4 py-2 bg-foreground text-background" onClick={saveRoleChange} disabled={updatingRole}>{updatingRole ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
