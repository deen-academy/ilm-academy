import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Courses = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "", image_url: "" });
  const [assignTeacherId, setAssignTeacherId] = useState("");

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
      // Get enrollment counts
      const { data: enrollments } = await supabase.from("enrollments").select("course_id, id");
      const countMap = new Map<string, number>();
      enrollments?.forEach((e) => countMap.set(e.course_id, (countMap.get(e.course_id) || 0) + 1));
      // Get assigned teachers
      const { data: tc } = await supabase.from("teacher_courses").select("course_id, teacher_id");
      const teacherMap = new Map<string, string[]>();
      tc?.forEach((t) => {
        const arr = teacherMap.get(t.course_id) || [];
        arr.push(t.teacher_id);
        teacherMap.set(t.course_id, arr);
      });
      return (data || []).map((c) => ({
        ...c,
        enrollments: countMap.get(c.id) || 0,
        teacherCount: (teacherMap.get(c.id) || []).length,
      }));
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ["admin-teacher-list"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
      if (!roles?.length) return [];
      const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", roles.map((r) => r.user_id));
      return profiles || [];
    },
  });

  const createCourse = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").insert({
        title: form.title,
        description: form.description || null,
        category: form.category || null,
        image_url: form.image_url || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Course created");
      setCreateOpen(false);
      setForm({ title: "", description: "", category: "", image_url: "" });
    },
    onError: () => toast.error("Failed to create course"),
  });

  const updateCourse = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").update({
        title: form.title,
        description: form.description || null,
        category: form.category || null,
        image_url: form.image_url || null,
      }).eq("id", selectedCourse.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Course updated");
      setEditOpen(false);
    },
    onError: () => toast.error("Failed to update course"),
  });

  const assignTeacher = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("teacher_courses").insert({
        teacher_id: assignTeacherId,
        course_id: selectedCourse.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Teacher assigned");
      setAssignOpen(false);
      setAssignTeacherId("");
    },
    onError: () => toast.error("Teacher may already be assigned"),
  });

  const openEdit = (course: any) => {
    setSelectedCourse(course);
    setForm({ title: course.title, description: course.description || "", category: course.category || "", image_url: course.image_url || "" });
    setEditOpen(true);
  };

  const CourseForm = ({ onSubmit, isSubmitting, submitLabel }: { onSubmit: () => void; isSubmitting: boolean; submitLabel: string }) => (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <Input placeholder="Course title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
      <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      <Input placeholder="Category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
      <Input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} />
      <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? "Saving..." : submitLabel}</Button>
    </form>
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Courses</h1>
          <p className="text-muted-foreground">Create, edit, and assign teachers to courses</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm({ title: "", description: "", category: "", image_url: "" })}>
              <Plus className="mr-2 h-4 w-4" />New Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Course</DialogTitle></DialogHeader>
            <CourseForm onSubmit={() => createCourse.mutate()} isSubmitting={createCourse.isPending} submitLabel="Create Course" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Teachers</TableHead>
              <TableHead className="w-28" />
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
            ) : !courses?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No courses yet</TableCell>
              </TableRow>
            ) : (
              courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.title}</TableCell>
                  <TableCell>{c.category || "—"}</TableCell>
                  <TableCell>{c.enrollments}</TableCell>
                  <TableCell>{c.teacherCount}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedCourse(c); setAssignOpen(true); }}><UserPlus className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Course</DialogTitle></DialogHeader>
          <CourseForm onSubmit={() => updateCourse.mutate()} isSubmitting={updateCourse.isPending} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* Assign teacher dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Teacher to {selectedCourse?.title}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); assignTeacher.mutate(); }} className="space-y-4">
            <Select value={assignTeacherId} onValueChange={setAssignTeacherId}>
              <SelectTrigger><SelectValue placeholder="Select a teacher" /></SelectTrigger>
              <SelectContent>
                {teachers?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name || t.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={assignTeacher.isPending || !assignTeacherId} className="w-full">
              {assignTeacher.isPending ? "Assigning..." : "Assign Teacher"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Courses;
