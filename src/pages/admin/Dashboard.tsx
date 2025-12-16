import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, type Company, type Candidate } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/Layout';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<(Company & { email: string })[]>([]);
  const [candidates, setCandidates] = useState<(Candidate & { email: string })[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          profiles!candidates_user_id_fkey (email)
        `)
        .order('created_at', { ascending: false });

      if (candidatesError) throw candidatesError;

      // Format data
      const formattedCompanies = companiesData?.map((c: any) => ({
        ...c,
        email: c.profiles?.email || 'N/A',
      })) || [];

      const formattedCandidates = candidatesData?.map((c: any) => ({
        ...c,
        email: c.profiles?.email || 'N/A',
      })) || [];

      setCompanies(formattedCompanies);
      setCandidates(formattedCandidates);
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
            {assessments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">No assessments yet</p>
                </CardContent>
              </Card>
            ) : (
              assessments.map((a) => (
                <Card key={a.id}>
                  <CardHeader>
                    <CardTitle>{a.title || 'Untitled'}</CardTitle>
                    <CardDescription>{a.status}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground"><span className="font-medium">Repo:</span> {a.github_repo || '—'}</p>
                    <p className="text-sm text-muted-foreground"><span className="font-medium">Created:</span> {new Date(a.created_at).toLocaleString()}</p>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={() => navigate(`/admin/assessment/${a.id}`)}>Setup Classroom</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="candidates" className="space-y-4">
            {candidates.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground text-center">
                    No candidates registered yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              candidates.map((candidate) => (
                <Card key={candidate.id}>
                  <CardHeader>
                    <CardTitle>{candidate.full_name}</CardTitle>
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
