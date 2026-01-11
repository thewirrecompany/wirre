import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Waitlist from "./pages/Waitlist";
// Login and Signup pages are kept in the repo but not exposed via routes.
import About from "./pages/About";
import GetInvolved from "./pages/GetInvolved";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TnC from "./pages/TnC";
import CompanyDashboard from "./pages/company/Dashboard";
import RoleDetails from "./pages/company/RoleDetails";
import AssessmentBuilder from "./pages/company/AssessmentBuilder";
import AssessmentDetail from "./pages/company/AssessmentDetail";
import CandidateDashboard from "./pages/candidate/Dashboard";
import CandidateRounds from "./pages/candidate/Rounds";
import CandidateOpportunities from "./pages/candidate/Opportunities";
import CandidateProfile from "./pages/candidate/Profile";
import Assessment from "./pages/candidate/Assessment";
import AdminDashboard from "./pages/admin/Dashboard";
import SuperadminDashboard from "./pages/superadmin/Dashboard";
import AdminProfile from "./pages/admin/Profile";
import ViewAsCompany from "./pages/admin/ViewAsCompany";
import ViewAsCandidate from "./pages/admin/ViewAsCandidate";
import AssessmentSetup from "./pages/admin/AssessmentSetup";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        basename={import.meta.env.BASE_URL}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/waitlist" element={<Waitlist />} />
            <Route path="/about" element={<About />} />
            <Route path="/get-involved" element={<GetInvolved />} />
            <Route path="/tnc" element={<TnC />} />
            <Route 
              path="/company/dashboard" 
              element={
                <ProtectedRoute requiredRole="company">
                  <CompanyDashboard />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/company/role/:roleId" 
              element={
                <ProtectedRoute requiredRole="company">
                  <RoleDetails />
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
            <Route 
              path="/company/assessments/:id/edit" 
              element={
                <ProtectedRoute requiredRole="company">
                  <AssessmentBuilder />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/company/assessments/:id" 
              element={
                <ProtectedRoute requiredRole="company">
                  <AssessmentDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/candidate/dashboard" 
              element={
                <ProtectedRoute requiredRole="candidate">
                  <CandidateDashboard />
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
                  <AssessmentSetup />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
