import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const Teachers = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  const { data: teachers, isLoading } = useQuery({
    queryKey: ["admin-teachers"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
      if (!roles?.length) return [];
      const ids = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, name, email, created_at").in("id", ids);
      // courses assigned
      const { data: tc } = await supabase.from("teacher_courses").select("teacher_id, course_id").in("teacher_id", ids);
      const courseMap = new Map<string, number>();
      tc?.forEach((t) => courseMap.set(t.teacher_id, (courseMap.get(t.teacher_id) || 0) + 1));
      return (profiles || []).map((p) => ({ ...p, courses: courseMap.get(p.id) || 0 }));
    },
  });

  const promote = useMutation({
    mutationFn: async (email: string) => {
      const { data: profile } = await supabase.from("profiles").select("id").eq("email", email).single();
      if (!profile) throw new Error("User not found");
      const { error } = await supabase.from("user_roles").insert({ user_id: profile.id, role: "teacher" as const });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-teachers"] });
      toast.success("Teacher role granted");
      setOpen(false);
      setEmail("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeTeacher = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "teacher");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-teachers"] });
      toast.success("Teacher role removed");
    },
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Teachers</h1>
          <p className="text-muted-foreground">Manage teacher accounts and assignments</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Teacher</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Promote user to Teacher</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => { e.preventDefault(); promote.mutate(email); }}
              className="space-y-4"
            >
              <Input placeholder="User email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button type="submit" disabled={promote.isPending} className="w-full">
                {promote.isPending ? "Adding..." : "Grant Teacher Role"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Courses Assigned</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !teachers?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No teachers found</TableCell>
              </TableRow>
            ) : (
              teachers.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name || "—"}</TableCell>
                  <TableCell>{t.email}</TableCell>
                  <TableCell>{t.courses}</TableCell>
                  <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeTeacher.mutate(t.id)}>
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

export default Teachers;
