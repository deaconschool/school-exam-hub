import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Student from "./pages/Student";
import StudentStages from "./pages/StudentStages";
import StudentClasses from "./pages/StudentClasses";
import StudentSubjects from "./pages/StudentSubjects";
import TeacherLogin from "./pages/TeacherLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudentManagement from "./pages/AdminStudentManagement";
import AdminStudentManagementWithList from "./pages/AdminStudentManagementWithList";
import AdminStudentForm from "./components/AdminStudentForm";
import NotFound from "./pages/NotFound";
import DatabaseTest from "./components/DatabaseTest";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/student" element={<Student />} />
              <Route path="/student/stages" element={<StudentStages />} />
              <Route path="/student/classes" element={<StudentClasses />} />
              <Route path="/student/subjects" element={<StudentSubjects />} />
              <Route path="/teacher/login" element={<TeacherLogin />} />
              <Route path="/teacher/dashboard" element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/students" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminStudentManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/students/list" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminStudentManagementWithList />
                </ProtectedRoute>
              } />
              <Route path="/admin/students/:action" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminStudentManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/students/:action/:studentId" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminStudentForm />
                </ProtectedRoute>
              } />
              <Route path="/test/database" element={<DatabaseTest />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
