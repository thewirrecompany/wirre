import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Users } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// state populated from DB
// assessments: array of { id, title, positions, created_at, status, start_at, registrationsCount, submissionsCount }
 

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
  const [upcomingCount, setUpcomingCount] = useState<number | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [activeRolesCount, setActiveRolesCount] = useState<number>(0);
  const [totalCandidates, setTotalCandidates] = useState<number>(0);
  const [submissionsCount, setSubmissionsCount] = useState<number>(0);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!ownerId) return;
      try {
        // fetch assessments for this company
        const { data: aData, error: aErr } = await supabase
          .from('assessments')
          .select('id,title,positions,created_at,status,start_at')
          .eq('company_user_id', ownerId)
          .order('created_at', { ascending: false });
        if (aErr) throw aErr;
        const aList = aData || [];

        const assessmentIds = aList.map((a: any) => a.id).filter(Boolean);

        // upcoming count: any assessment with a future start date (exclude completed)
        const upcoming = aList.filter((a: any) => a.start_at && new Date(a.start_at) > new Date() && a.status !== 'completed').length;
        if (mounted) setUpcomingCount(upcoming);

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
        const activeCount = enriched
          .filter((a: any) => a.status !== 'completed')
          .reduce((s: number, it: any) => s + (it.positions || 0), 0);

        const totalRegs = uniqueCandidates.size;
        const totalSubmissions = audits.length;

        if (mounted) {
          setAssessments(enriched);
          setActiveRolesCount(activeCount);
          setTotalCandidates(totalRegs);
          setSubmissionsCount(totalSubmissions);
        }
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      }
    })();
    return () => { mounted = false; };
  }, [ownerId]);

  const handleDeleteCompany = async () => {
    if (!ownerId) return;
    const hasUpcoming = (upcomingCount || 0) > 0;
    if (hasUpcoming) {
      const ok = window.confirm('Deleting your company will remove upcoming rounds and requires payment of ₹1000. Proceed to payment?');
      if (!ok) return;
      // start payment flow for deletion
      await handleMakeDeletePayment();
      return;
    }

    const ok = window.confirm('Delete your company and upcoming rounds? This cannot be undone.');
    if (!ok) return;

    try {
      setDeleting(true);
      const { data, error } = await supabase.rpc('company_delete_self', { p_user_id: ownerId });
      if (error) throw error;
      toast({ title: 'Company deleted', description: 'Company and upcoming rounds removed.' });
      // sign out and redirect home
      await supabase.auth.signOut();
      navigate('/');
    } catch (err: any) {
      console.error('Error deleting company:', err);
      toast({ title: 'Delete failed', description: err?.message || String(err), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleMakeDeletePayment = async () => {
    if (!ownerId) return;
    try {
      setPaymentProcessing(true);
      const amountRupees = 1000; // fixed deletion fee

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order-company`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ amount: amountRupees, company_id: ownerId })
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Failed to create razorpay order');

      // Load Razorpay script
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load Razorpay SDK'))
          document.head.appendChild(s)
        })
      }

      const options: any = {
        key: json.key,
        amount: Math.round(amountRupees * 100),
        currency: 'INR',
        name: 'WIRRE',
        order_id: json.order_id,
        handler: async function (resp: any) {
          toast({ title: 'Payment submitted', description: 'Payment processed — attempting deletion.' });
          // after client-side success, call delete RPC
          try {
            setDeleting(true);
            const { data, error } = await supabase.rpc('company_delete_self', { p_user_id: ownerId });
            if (error) throw error;
            toast({ title: 'Company deleted', description: 'Company and upcoming rounds removed.' });
            await supabase.auth.signOut();
            navigate('/');
          } catch (err: any) {
            console.error('Delete after payment failed', err);
            toast({ title: 'Delete failed', description: String(err), variant: 'destructive' });
          } finally {
            setDeleting(false);
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()

    } catch (err: any) {
      console.error('Delete payment error', err);
      toast({ title: 'Payment error', description: err?.message || String(err), variant: 'destructive' });
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <Layout>
      <div className="py-12">
        <div className="container">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-12">
            <div>
              <h1 className="text-3xl font-bold font-mono tracking-tight">
                Dashboard
              </h1>
              <p className="text-muted-foreground font-mono text-sm mt-1">
                Manage open roles and review candidates
              </p>
            </div>
            <Button asChild>
              <Link to="/company/assessments/new">
                <Plus className="h-4 w-4 mr-2" />
                Hire
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-12">
            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Active Roles</span>
              </div>
              <p className="text-3xl font-bold font-mono">{activeRolesCount}</p>
            </div>
            <div className="border border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-mono uppercase tracking-wider">Total Candidates</span>
              </div>
              <p className="text-3xl font-bold font-mono">{totalCandidates}</p>
            </div>
          </div>

          {/* Active Roles */}
          <section>
            <h2 className="text-xl font-bold font-mono mb-6">Active Roles</h2>
            <div className="border border-border">
                <div className="grid grid-cols-4 gap-4 p-4 border-b border-border text-sm text-muted-foreground font-mono uppercase tracking-wider">
                  <span>Role</span>
                  <span>Positions</span>
                  <span>Candidates</span>
                  <span>Created</span>
                </div>
                {assessments.map((role) => (
                  <Link 
                    key={role.id} 
                    to={`/company/assessments/${role.id}`}
                    className="grid grid-cols-4 gap-4 p-4 border-b border-border last:border-b-0 font-mono text-sm hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <span className="font-semibold">{role.title}</span>
                    <span>{role.positions}</span>
                    <span>{role.registrationsCount}</span>
                    <span className="text-muted-foreground">{new Date(role.created_at).toLocaleDateString()}</span>
                  </Link>
                ))}
            </div>
          </section>

          
          <div className="mt-8 border border-border p-6">
            <h3 className="font-mono font-bold mb-2">Company Account</h3>
            <p className="text-sm text-muted-foreground mb-4">Deleting your company will remove upcoming rounds and related registrations. Ongoing and completed rounds are preserved.</p>
            <p className="text-sm mb-4">Upcoming rounds: <strong>{upcomingCount === null ? '...' : upcomingCount}</strong></p>
            <Button variant="destructive" onClick={handleDeleteCompany}>Delete Company</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
