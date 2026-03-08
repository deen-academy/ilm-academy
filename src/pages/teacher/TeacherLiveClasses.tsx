import TeacherLayout from "@/components/TeacherLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Radio } from "lucide-react";
import { useState } from "react";

const TeacherLiveClasses = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", courseId: "", scheduledAt: "", duration: "60", meetingUrl: "" });

  const { data: courses } = useQuery({
    queryKey: ["teacher-assigned-courses", user?.id],
    queryFn: async () => {
      const { data: tc } = await supabase.from("teacher_courses").select("course_id").eq("teacher_id", user!.id);
      if (!tc?.length) return [];
      const { data } = await supabase.from("courses").select("id, title").in("id", tc.map((t) => t.course_id));
      return data || [];
    },
    enabled: !!user,
  });

  const { data: classes, isLoading } = useQuery({
    queryKey: ["teacher-live-classes", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("live_classes")
        .select("*, courses(title)")
        .eq("created_by", user!.id)
        .order("scheduled_at", { ascending: true });
      return data || [];
    },
    enabled: !!user,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("live_classes").insert({
        title: form.title,
        description: form.description || null,
        course_id: form.courseId || null,
        scheduled_at: new Date(form.scheduledAt).toISOString(),
        duration_minutes: parseInt(form.duration) || 60,
        meeting_url: form.meetingUrl || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-live-classes"] });
      toast.success("Live class scheduled");
      setOpen(false);
      setForm({ title: "", description: "", courseId: "", scheduledAt: "", duration: "60", meetingUrl: "" });
    },
    onError: () => toast.error("Failed to schedule class"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("live_classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-live-classes"] });
      toast.success("Class deleted");
    },
  });

  const isPast = (date: string) => new Date(date) < new Date();
  const isLive = (date: string, durationMin: number) => {
    const start = new Date(date);
    const end = new Date(start.getTime() + durationMin * 60000);
    const now = new Date();
    return now >= start && now <= end;
  };

  return (
    <TeacherLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Live Classes</h1>
          <p className="text-muted-foreground">Schedule and start live sessions for your courses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Schedule Class</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Schedule Live Class</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
              <Input placeholder="Class title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <Select value={form.courseId} onValueChange={(v) => setForm((f) => ({ ...f, courseId: v }))}>
                <SelectTrigger><SelectValue placeholder="Link to course" /></SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>))}
                </SelectContent>
              </Select>
              <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))} required />
              <Input type="number" placeholder="Duration (minutes)" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
              <Input placeholder="Meeting URL (Zoom, Meet, etc.)" value={form.meetingUrl} onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))} />
              <Button type="submit" disabled={create.isPending} className="w-full">
                {create.isPending ? "Scheduling..." : "Schedule Class"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !classes?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No live classes scheduled</TableCell>
              </TableRow>
            ) : (
              classes.map((c: any) => {
                const live = isLive(c.scheduled_at, c.duration_minutes);
                const past = isPast(c.scheduled_at) && !live;
                return (
                  <TableRow key={c.id} className={past ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{c.courses?.title || "—"}</TableCell>
                    <TableCell>{new Date(c.scheduled_at).toLocaleString()}</TableCell>
                    <TableCell>{c.duration_minutes} min</TableCell>
                    <TableCell>
                      {live ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                          <Radio className="h-3 w-3 animate-pulse" /> Live Now
                        </span>
                      ) : past ? (
                        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Past</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Upcoming</span>
                      )}
                    </TableCell>
                    <TableCell className="flex gap-1">
                      {c.meeting_url && (live || !past) && (
                        <Button variant={live ? "default" : "ghost"} size={live ? "sm" : "icon"} asChild>
                          <a href={c.meeting_url} target="_blank" rel="noopener noreferrer">
                            {live ? (
                              <>
                                <Radio className="mr-1 h-3 w-3" /> Start
                              </>
                            ) : (
                              <ExternalLink className="h-4 w-4" />
                            )}
                          </a>
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </TeacherLayout>
  );
};

export default TeacherLiveClasses;
