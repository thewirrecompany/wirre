import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from "react-router-dom";
import { Building, Save, Shield, Users } from "lucide-react";

export default function CompanyProfile() {
    const { profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [companyData, setCompanyData] = useState({
        name: "",
        email: "",
        domain: "",
        linkedin_url: "",
    });

    const ownerId = profile?.id;

    useEffect(() => {
        const loadCompanyProfile = async () => {
            if (!ownerId) return;
            try {
                // Fetch profile row
                const { data: profileRow } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('id', ownerId)
                    .single();

                // Fetch company details
                const { data: companyRow } = await supabase
                    .from('companies')
                    .select('name, domain, linkedin_url')
                    .eq('user_id', ownerId)
                    .single();

                if (companyRow || profileRow) {
                    setCompanyData({
                        name: companyRow?.name || "",
                        email: profileRow?.email || "",
                        domain: companyRow?.domain || "",
                        linkedin_url: companyRow?.linkedin_url || "",
                    });
                }
            } catch (err) {
                console.error('Error loading company profile:', err);
            } finally {
                setLoading(false);
            }
        };
        loadCompanyProfile();
    }, [ownerId]);

    const handleSaveProfile = async () => {
        if (!ownerId) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('companies')
                .update({
                    name: companyData.name,
                    domain: companyData.domain,
                    linkedin_url: companyData.linkedin_url,
                })
                .eq('user_id', ownerId);

            if (error) throw error;
            toast({ title: 'Profile updated', description: 'Organisation details saved successfully.' });
        } catch (err: any) {
            toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <Layout>
            <div className="py-12">
                <div className="container max-w-4xl">
                    <div className="mb-12">
                        <h1 className="text-3xl font-bold font-mono tracking-tight uppercase">
                            Organisation Profile
                        </h1>
                        <p className="text-muted-foreground font-mono text-sm mt-1">
                            Manage your company identity and account security
                        </p>
                    </div>

                    <div className="space-y-12">
                        {/* Identity section */}
                        <section>
                            <h2 className="text-xl font-bold font-mono mb-6 flex items-center gap-2 uppercase tracking-tight">
                                <Building className="h-5 w-5" />
                                Identity
                            </h2>
                            <div className="border border-border p-8">
                                <div className="space-y-6 max-w-2xl">
                                    <div className="grid gap-2">
                                        <Label htmlFor="org_name" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Organisation Name</Label>
                                        <Input
                                            id="org_name"
                                            value={companyData.name}
                                            onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                                            className="font-mono"
                                            placeholder="WIRRE Co."
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Contact Email</Label>
                                        <Input
                                            id="email"
                                            value={companyData.email}
                                            disabled
                                            className="font-mono bg-muted"
                                        />
                                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Login email cannot be changed</p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="domain" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Website Domain</Label>
                                        <Input
                                            id="domain"
                                            value={companyData.domain}
                                            onChange={(e) => setCompanyData({ ...companyData, domain: e.target.value })}
                                            placeholder="wirre.com"
                                            className="font-mono"
                                            disabled={loading}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="linkedin_url" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">LinkedIn URL</Label>
                                        <Input
                                            id="linkedin_url"
                                            value={companyData.linkedin_url}
                                            onChange={(e) => setCompanyData({ ...companyData, linkedin_url: e.target.value })}
                                            placeholder="https://linkedin.com/company/wirre"
                                            className="font-mono"
                                            disabled={loading}
                                        />
                                    </div>

                                    <Button
                                        onClick={handleSaveProfile}
                                        disabled={loading || saving}
                                        className="font-mono uppercase text-xs tracking-widest px-8"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {saving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </div>
                        </section>

                        {/* Account Management section */}
                        <section>
                            <h2 className="text-xl font-bold font-mono mb-6 flex items-center gap-2 uppercase tracking-tight">
                                <Shield className="h-5 w-5" />
                                Account & Security
                            </h2>
                            <div className="border border-border p-8">
                                <div className="space-y-8">
                                    <div className="pb-8 border-b border-border">
                                        <h3 className="font-mono font-bold mb-2 uppercase text-sm">Security</h3>
                                        <p className="text-sm text-muted-foreground mb-4 font-mono">Reset your password via email verification logic.</p>
                                        <Button
                                            variant="outline"
                                            onClick={async () => {
                                                if (!profile?.email) return;
                                                try {
                                                    const { error } = await supabase.auth.signInWithOtp({
                                                        email: profile.email,
                                                        options: {
                                                            shouldCreateUser: false,
                                                        }
                                                    });
                                                    if (error) throw error;

                                                    toast({
                                                        title: 'Verification Code Sent',
                                                        description: `A code has been sent to ${profile.email}`
                                                    });
                                                    navigate(`/set-password?email=${encodeURIComponent(profile.email)}`);
                                                } catch (error: any) {
                                                    toast({
                                                        title: 'Error',
                                                        description: error.message,
                                                        variant: 'destructive'
                                                    });
                                                }
                                            }}
                                            className="font-mono uppercase text-xs tracking-widest"
                                        >
                                            Reset Password
                                        </Button>
                                    </div>

                                    <div>
                                        <h3 className="font-mono font-bold mb-2 uppercase text-sm text-destructive">Danger Zone</h3>
                                        <p className="text-sm text-muted-foreground mb-4 font-mono leading-relaxed max-w-2xl">
                                            Deleting your organisation will remove upcoming rounds and related registrations.
                                            Ongoing and completed rounds are preserved. This action cannot be undone.
                                        </p>
                                        <Button
                                            variant="destructive"
                                            onClick={() => {
                                                // This logic is complex and handles payments in Dashboard.
                                                // For now, redirect to Dashboard for deletion or we can move the logic here later.
                                                toast({
                                                    title: 'Action Required',
                                                    description: 'Account deletion is currently handled from the main dashboard due to payment verification requirements.'
                                                });
                                                navigate('/company/dashboard');
                                            }}
                                            className="font-mono uppercase text-xs tracking-widest"
                                        >
                                            Delete Organisation
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
