import AdminLayout from "@/components/AdminLayout";
import { Link } from "react-router-dom";
import { Users, BookOpen, GraduationCap, FileText, Video, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [courses, students, teachers, lessons, resources, liveClasses] = await Promise.all([
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("lessons").select("id", { count: "exact", head: true }),
        supabase.from("study_resources").select("id", { count: "exact", head: true }),
        supabase.from("live_classes").select("id", { count: "exact", head: true }),
      ]);
      return {
        courses: courses.count ?? 0,
        students: students.count ?? 0,
        teachers: teachers.count ?? 0,
        lessons: lessons.count ?? 0,
        resources: resources.count ?? 0,
        liveClasses: liveClasses.count ?? 0,
      };
    },
  });

  const cards = [
    { icon: BookOpen, label: "Courses", value: stats?.courses, to: "/admin/courses", color: "bg-primary/10 text-primary" },
    { icon: Users, label: "Students", value: stats?.students, to: "/admin/students", color: "bg-accent/15 text-accent-foreground" },
    { icon: GraduationCap, label: "Teachers", value: stats?.teachers, to: "/admin/teachers", color: "bg-primary/10 text-primary" },
    { icon: FileText, label: "Resources", value: stats?.resources, to: "/admin/resources", color: "bg-accent/15 text-accent-foreground" },
    { icon: Video, label: "Live Classes", value: stats?.liveClasses, to: "/admin/live-classes", color: "bg-primary/10 text-primary" },
    { icon: BarChart3, label: "Total Lessons", value: stats?.lessons, to: "/admin/analytics", color: "bg-accent/15 text-accent-foreground" },
  ];

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-foreground mb-1">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Platform overview and quick stats</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </AdminLayout>
  );
};

export default AdminDashboard;
