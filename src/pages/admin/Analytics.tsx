import AdminLayout from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const Analytics = () => {
  const { data: enrollmentData, isLoading: enrollLoading } = useQuery({
    queryKey: ["admin-enrollment-analytics"],
    queryFn: async () => {
      const { data: courses } = await supabase.from("courses").select("id, title");
      const { data: enrollments } = await supabase.from("enrollments").select("course_id");
      const countMap = new Map<string, number>();
      enrollments?.forEach((e) => countMap.set(e.course_id, (countMap.get(e.course_id) || 0) + 1));
      return (courses || []).map((c) => ({ name: c.title, enrollments: countMap.get(c.id) || 0 }));
    },
  });

  const { data: quizResults, isLoading: quizLoading } = useQuery({
    queryKey: ["admin-quiz-results"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quiz_results")
        .select("id, score, total_questions, completed_at, quiz_id, user_id, quizzes(title)")
        .order("completed_at", { ascending: false })
        .limit(50);
      // get profile names
      const userIds = [...new Set(data?.map((r) => r.user_id) || [])];
      const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p.name || p.email || "Unknown"]));
      return (data || []).map((r: any) => ({
        ...r,
        quizTitle: r.quizzes?.title || "Unknown",
        studentName: profileMap.get(r.user_id) || "Unknown",
        percentage: r.total_questions > 0 ? Math.round((r.score / r.total_questions) * 100) : 0,
      }));
    },
  });

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-foreground mb-1">Analytics</h1>
      <p className="text-muted-foreground mb-8">Enrollment trends and quiz performance</p>

      {/* Enrollment chart */}
      <div className="rounded-xl border bg-card p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Enrollments by Course</h2>
        {enrollLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
              <Tooltip />
              <Bar dataKey="enrollments" fill="hsl(174, 78%, 26%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quiz results table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold text-foreground mb-4">Recent Quiz Results</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Quiz</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>%</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !quizResults?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No quiz results yet</TableCell>
              </TableRow>
            ) : (
              quizResults.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.studentName}</TableCell>
                  <TableCell>{r.quizTitle}</TableCell>
                  <TableCell>{r.score}/{r.total_questions}</TableCell>
                  <TableCell>
                    <span className={`font-semibold ${r.percentage >= 70 ? "text-primary" : r.percentage >= 50 ? "text-accent-foreground" : "text-destructive"}`}>
                      {r.percentage}%
                    </span>
                  </TableCell>
                  <TableCell>{new Date(r.completed_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
