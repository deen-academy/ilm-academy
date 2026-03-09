import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LessonPage from "./pages/LessonPage";
import QuizPage from "./pages/QuizPage";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import CreateCourse from "./pages/CreateCourse";
import UploadLesson from "./pages/UploadLesson";
import AdminStudents from "./pages/admin/Students";
import AdminTeachers from "./pages/admin/Teachers";
import AdminCourses from "./pages/admin/Courses";
import AdminResources from "./pages/admin/Resources";
import AdminLiveClasses from "./pages/admin/LiveClasses";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminRoute from "@/components/AdminRoute";
import TeacherRoute from "@/components/TeacherRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import TeacherResources from "./pages/teacher/TeacherResources";
import TeacherLiveClasses from "./pages/teacher/TeacherLiveClasses";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/lesson/:id" element={<ProtectedRoute><LessonPage /></ProtectedRoute>} />
            <Route path="/quiz/:id" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/students" element={<AdminRoute><AdminStudents /></AdminRoute>} />
            <Route path="/admin/teachers" element={<AdminRoute><AdminTeachers /></AdminRoute>} />
            <Route path="/admin/courses" element={<AdminRoute><AdminCourses /></AdminRoute>} />
            <Route path="/admin/resources" element={<AdminRoute><AdminResources /></AdminRoute>} />
            <Route path="/admin/live-classes" element={<AdminRoute><AdminLiveClasses /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            <Route path="/admin/create-course" element={<AdminRoute><CreateCourse /></AdminRoute>} />
            <Route path="/admin/upload-lesson" element={<AdminRoute><UploadLesson /></AdminRoute>} />
            <Route path="/teacher" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
            <Route path="/teacher/courses" element={<TeacherRoute><TeacherCourses /></TeacherRoute>} />
            <Route path="/teacher/resources" element={<TeacherRoute><TeacherResources /></TeacherRoute>} />
            <Route path="/teacher/live-classes" element={<TeacherRoute><TeacherLiveClasses /></TeacherRoute>} />
            <Route path="/teacher/upload-lesson" element={<TeacherRoute><UploadLesson /></TeacherRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
