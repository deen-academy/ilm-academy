import Layout from "@/components/Layout";
import CourseCard from "@/components/CourseCard";
import { Award, BookOpen, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();

  // Fetch enrolled courses with modules/lessons
  const { data: enrollments = [] } = useQuery({
    queryKey: ["my-enrollments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*, courses(*, modules(*, lessons(*)))")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch lesson progress
  const { data: lessonProgress = [] } = useQuery({
    queryKey: ["my-lesson-progress", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("completed", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch quiz results
  const { data: quizResults = [] } = useQuery({
    queryKey: ["my-quiz-results", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  if (authLoading) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></Layout>;
  }

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Please log in to view your dashboard</h1>
          <Button variant="hero" className="mt-4" asChild>
            <Link to="/login">Log In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const completedLessonIds = new Set(lessonProgress.map((lp: any) => lp.lesson_id));

  // Calculate progress per course
  const coursesWithProgress = enrollments.map((e: any) => {
    const course = e.courses;
    const allLessons = course?.modules?.flatMap((m: any) => m.lessons || []) || [];
    const totalLessons = allLessons.length;
    const completedCount = allLessons.filter((l: any) => completedLessonIds.has(l.id)).length;
    const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    return { ...course, progress, moduleCount: course?.modules?.length || 0 };
  });

  const continueItem = coursesWithProgress.find((c: any) => c.progress > 0 && c.progress < 100) || coursesWithProgress[0];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Assalamu Alaikum, {profile?.name || "Student"} 👋</h1>
          <p className="mt-1 text-muted-foreground">Continue your learning journey</p>
        </div>

        {/* Stats row */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: BookOpen, label: "Enrolled Courses", value: String(enrollments.length), color: "text-primary" },
            { icon: TrendingUp, label: "Lessons Completed", value: String(lessonProgress.length), color: "text-accent" },
            { icon: Award, label: "Quizzes Taken", value: String(quizResults.length), color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Learning */}
        {continueItem && (
          <div className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Continue Learning</h2>
            <Link to={`/courses/${continueItem.id}`} className="block rounded-xl border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{continueItem.title}</h3>
                  <p className="text-sm text-muted-foreground">{continueItem.category}</p>
                </div>
                <span className="text-sm font-medium text-primary">{continueItem.progress}%</span>
              </div>
              <Progress value={continueItem.progress} className="mt-3 h-2" />
            </Link>
          </div>
        )}

        {/* Enrolled Courses */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">My Courses</h2>
          {coursesWithProgress.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center shadow-card">
              <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
              <Button variant="hero" asChild>
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {coursesWithProgress.map((course: any) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description || ""}
                  modules={course.moduleCount}
                  progress={course.progress}
                  category={course.category}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
