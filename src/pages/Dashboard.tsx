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

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*, courses(*, modules(id, lessons(id)))")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: lessonProgress = [] } = useQuery({
    queryKey: ["lesson-progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("completed", true);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: quizResults = [] } = useQuery({
    queryKey: ["quiz-results", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    },
  });

  if (!authLoading && !user) {
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

  // Calculate progress per course
  const coursesWithProgress = enrollments.map((e: any) => {
    const course = e.courses;
    const allLessonIds: string[] = [];
    (course?.modules as any[] || []).forEach((m: any) => {
      (m.lessons || []).forEach((l: any) => allLessonIds.push(l.id));
    });
    const completedCount = lessonProgress.filter((lp) => allLessonIds.includes(lp.lesson_id)).length;
    const progress = allLessonIds.length > 0 ? Math.round((completedCount / allLessonIds.length) * 100) : 0;
    return { ...course, progress, totalLessons: allLessonIds.length, completedLessons: completedCount };
  });

  const completedLessonsCount = lessonProgress.length;
  const topCourse = coursesWithProgress[0];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Assalamu Alaikum, {profile?.name || "Student"} 👋</h1>
          <p className="mt-1 text-muted-foreground">Continue your learning journey</p>
        </div>

        {/* Stats row */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: BookOpen, label: "Enrolled Courses", value: String(enrollments.length), color: "text-primary" },
            { icon: TrendingUp, label: "Lessons Completed", value: String(completedLessonsCount), color: "text-accent" },
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
        {topCourse && (
          <div className="mb-10">
            <h2 className="mb-4 text-xl font-semibold text-foreground">Continue Learning</h2>
            <Link to={`/courses/${topCourse.id}`} className="block rounded-xl border bg-card p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{topCourse.title}</h3>
                  <p className="text-sm text-muted-foreground">{topCourse.category}</p>
                </div>
                <span className="text-sm font-medium text-primary">{topCourse.progress}%</span>
              </div>
              <Progress value={topCourse.progress} className="mt-3 h-2" />
            </Link>
          </div>
        )}

        {/* Enrolled Courses */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">My Courses</h2>
          {coursesWithProgress.length === 0 ? (
            <div className="rounded-xl border bg-card p-8 text-center shadow-card">
              <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet.</p>
              <Button variant="hero" asChild><Link to="/courses">Browse Courses</Link></Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {coursesWithProgress.map((course: any) => (
                <CourseCard
                  key={course.id}
                  id={course.id}
                  title={course.title}
                  description={course.description || ""}
                  modules={(course.modules as any[])?.length || 0}
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
