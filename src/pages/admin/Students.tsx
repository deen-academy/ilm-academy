import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const Students = () => {
  const qc = useQueryClient();

  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "student");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email, created_at")
        .in("id", ids);
      // get enrollment counts
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("user_id, id")
        .in("user_id", ids);
      const enrollMap = new Map<string, number>();
      enrollments?.forEach((e) => enrollMap.set(e.user_id, (enrollMap.get(e.user_id) || 0) + 1));
      return (profiles || []).map((p) => ({ ...p, enrollments: enrollMap.get(p.id) || 0 }));
    },
  });

  const removeStudent = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "student");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-students"] });
      toast.success("Student role removed");
    },
    onError: () => toast.error("Failed to remove student"),
  });

  return (
    <AdminLayout>
      <h1 className="text-3xl font-bold text-foreground mb-1">Students</h1>
      <p className="text-muted-foreground mb-6">Manage student accounts</p>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !students?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No students found</TableCell>
              </TableRow>
            ) : (
              students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name || "—"}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.enrollments}</TableCell>
                  <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeStudent.mutate(s.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
};

export default Students;
