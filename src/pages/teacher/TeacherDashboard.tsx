import TeacherLayout from "@/components/TeacherLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, FileText, Video, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

const TeacherDashboard = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["teacher-stats", user?.id],
    queryFn: async () => {
      // Get assigned courses
      const { data: tc } = await supabase
        .from("teacher_courses")
        .select("course_id")
        .eq("teacher_id", user!.id);
      const courseIds = tc?.map((t) => t.course_id) || [];

      let enrollments = 0;
      let resources = 0;
      let liveClasses = 0;

      if (courseIds.length > 0) {
        const { count: enrollCount } = await supabase
          .from("enrollments")
          .select("id", { count: "exact", head: true })
          .in("course_id", courseIds);
        enrollments = enrollCount ?? 0;

        const { count: resCount } = await supabase
          .from("study_resources")
          .select("id", { count: "exact", head: true })
          .eq("uploaded_by", user!.id);
        resources = resCount ?? 0;

        const { count: lcCount } = await supabase
          .from("live_classes")
          .select("id", { count: "exact", head: true })
          .eq("created_by", user!.id);
        liveClasses = lcCount ?? 0;
      }

      return { courses: courseIds.length, enrollments, resources, liveClasses };
    },
    enabled: !!user,
  });

  const cards = [
    { icon: BookOpen, label: "Assigned Courses", value: stats?.courses, to: "/teacher/courses", color: "bg-primary/10 text-primary" },
    { icon: Users, label: "Enrolled Students", value: stats?.enrollments, to: "/teacher/courses", color: "bg-accent/15 text-accent-foreground" },
    { icon: FileText, label: "Resources", value: stats?.resources, to: "/teacher/resources", color: "bg-primary/10 text-primary" },
    { icon: Video, label: "Live Classes", value: stats?.liveClasses, to: "/teacher/live-classes", color: "bg-accent/15 text-accent-foreground" },
  ];

  return (
    <TeacherLayout>
      <h1 className="text-3xl font-bold text-foreground mb-1">Teacher Dashboard</h1>
      <p className="text-muted-foreground mb-8">Overview of your courses and activity</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.color}`}>
              <c.icon className="h-6 w-6" />
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-7 w-12 mb-1" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{c.value}</div>
              )}
              <div className="text-sm text-muted-foreground">{c.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </TeacherLayout>
  );
};

export default TeacherDashboard;
