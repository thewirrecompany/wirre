import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageLoader } from "@/components/layout/PageLoader";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const SetPassword = lazy(() => import("./pages/SetPassword"));
const TnC = lazy(() => import("./pages/TnC"));
const CompanyDashboard = lazy(() => import("./pages/company/Dashboard"));
const CompanyProfile = lazy(() => import("./pages/company/Profile"));
const AssessmentBuilder = lazy(() => import("./pages/company/AssessmentBuilder"));
const AssessmentDetail = lazy(() => import("./pages/company/AssessmentDetail"));
const AssessmentTypeSelection = lazy(() => import("./pages/company/AssessmentTypeSelection"));
const SubmissionsList = lazy(() => import("./pages/company/SubmissionsList"));
const SubmissionDetail = lazy(() => import("./pages/company/SubmissionDetail"));
const SelectionReview = lazy(() => import("./pages/company/SelectionReview"));
const CandidateRounds = lazy(() => import("./pages/candidate/Rounds"));
const CandidateOpportunities = lazy(() => import("./pages/candidate/Opportunities"));
const CandidateProfile = lazy(() => import("./pages/candidate/Profile"));
const Assessment = lazy(() => import("./pages/candidate/Assessment"));
const AssessmentStatus = lazy(() => import("./pages/candidate/AssessmentStatus"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const SuperadminDashboard = lazy(() => import("./pages/superadmin/Dashboard"));
const AdminProfile = lazy(() => import("./pages/admin/Profile"));
const ViewAsCompany = lazy(() => import("./pages/admin/ViewAsCompany"));
const ViewAsCandidate = lazy(() => import("./pages/admin/ViewAsCandidate"));
const AssessmentSetup = lazy(() => import("./pages/admin/AssessmentSetup"));
const AdminAssessmentDetail = lazy(() => import("./pages/admin/AssessmentDetail"));
const IdeTest = lazy(() => import("./pages/admin/IdeTest"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Feedback = lazy(() => import("./pages/Feedback"));
const AboutUs = lazy(() => import("./pages/AboutUs"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Analytics />
      <SpeedInsights />
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Waitlist />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/tnc" element={<TnC />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/rateus" element={<Feedback />} />
              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />
              <Route path="/leaderboard/assessment/:id" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />
              <Route
                path="/company/dashboard"
                element={
                  <ProtectedRoute requiredRole="company">
                    <CompanyDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/company/assessments/choose"
                element={
                  <ProtectedRoute requiredRole="company">
                    <AssessmentTypeSelection />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/assessments/new"
                element={
                  <ProtectedRoute requiredRole="company">
                    <AssessmentBuilder />
                  </ProtectedRoute>
                }
              />
              <Route path="/company/assessments/:id">
                <Route
                  index
                  element={
                    <ProtectedRoute requiredRole="company">
                      <AssessmentDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="edit"
                  element={
                    <ProtectedRoute requiredRole="company">
                      <AssessmentBuilder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="submissions"
                  element={
                    <ProtectedRoute requiredRole="company">
                      <SubmissionsList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="submissions/:anonymousId"
                  element={
                    <ProtectedRoute requiredRole="company">
                      <SubmissionDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="selection-review"
                  element={
                    <ProtectedRoute requiredRole="company">
                      <SelectionReview />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route
                path="/company/profile"
                element={
                  <ProtectedRoute requiredRole="company">
                    <CompanyProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/rounds"
                element={
                  <ProtectedRoute requiredRole="candidate">
                    <CandidateRounds />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/opportunities"
                element={
                  <ProtectedRoute requiredRole="candidate">
                    <CandidateOpportunities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/profile"
                element={
                  <ProtectedRoute requiredRole="candidate">
                    <CandidateProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/assessment/:id"
                element={
                  <ProtectedRoute requiredRole="candidate">
                    <Assessment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/assessment/:id/status"
                element={
                  <ProtectedRoute requiredRole="candidate">
                    <AssessmentStatus />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/profile"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/superadmin/dashboard"
                element={
                  <ProtectedRoute requiredRole="superadmin">
                    <SuperadminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/view-as/company/:userId"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ViewAsCompany />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/view-as/candidate/:userId"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ViewAsCandidate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/assessment/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminAssessmentDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/assessment/:id/setup"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AssessmentSetup />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ide-test"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <IdeTest />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
