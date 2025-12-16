import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Platform from "./pages/Platform";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import About from "./pages/About";
import CompanyDashboard from "./pages/company/Dashboard";
import AssessmentBuilder from "./pages/company/AssessmentBuilder";
import CandidateDashboard from "./pages/candidate/Dashboard";
import Assessment from "./pages/candidate/Assessment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/platform" element={<Platform />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/company/assessments/new" element={<AssessmentBuilder />} />
          <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
          <Route path="/candidate/assessment/:id" element={<Assessment />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
