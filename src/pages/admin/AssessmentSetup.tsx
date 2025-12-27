import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AssessmentSetup() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [assessment, setAssessment] = useState<any | null>(null);
  const [classroomUrl, setClassroomUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessment();
  }, [id]);

  async function loadAssessment() {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from('assessments').select('*').eq('id', id).single();
    if (error) {
      console.error('Error loading assessment:', error);
      setLoading(false);
      return;
    }
    setAssessment(data);
      setClassroomUrl(data.github_classroom_url || '');
    setLoading(false);
  }

  async function handleSave() {
    if (!id) return;
    setLoading(true);
    const { error } = await supabase
      .from('assessments')
      .update({ github_classroom_url: classroomUrl, status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      console.error('Error saving classroom URL:', error);
      setLoading(false);
      return;
    }

    // record audit for admin save action
    try {
      await supabase.from('assessment_audits').insert([{
        assessment_id: id,
        actor_id: profile?.id,
        actor_role: profile?.role || 'admin',
        action: 'assignment_url_saved'
      }]);
    } catch (err) {
      console.error('Failed to write audit record:', err);
    }

    // create a notification entry indicating the assessment is ready
    try {
      await supabase.from('assessment_notifications').insert([{
        assessment_id: id,
        recipient_role: 'admin',
        message: `Assessment ${assessment?.title || id} marked ready by ${profile?.id || 'admin'}`,
        payload: { assessment_id: id, github_classroom_url: classroomUrl }
      }]);
    } catch (err) {
      console.error('Failed to create ready notification:', err);
    }

    toast({ title: 'Saved', description: 'Classroom URL saved. Assessment is ready.' });
    setLoading(false);
    navigate('/admin/dashboard');
  }

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
            <Button onClick={() => navigate('/admin/dashboard')} className="mt-4">Back</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-12">
        <div className="container max-w-3xl">
          <h1 className="text-2xl font-bold mb-4">Assessment Setup</h1>
          <p className="text-sm text-muted-foreground mb-6">Paste the assignment invitation URL here so candidates can join the assignment.</p>

          <div className="mb-4">
            <Label className="font-mono text-xs mb-2 block">Template Repository</Label>
            <div className="p-3 border border-border font-mono">{assessment.github_repo || '—'}</div>
          </div>

          <div className="mb-6">
            <Label className="font-mono text-xs mb-2 block">Assignment Invitation URL</Label>
            <Input value={classroomUrl} onChange={(e) => setClassroomUrl(e.target.value)} className="font-mono" />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading || !classroomUrl}>Save & Publish</Button>
            <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>Cancel</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
