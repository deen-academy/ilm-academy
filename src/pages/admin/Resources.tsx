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
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

const Resources = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: resources, isLoading } = useQuery({
    queryKey: ["admin-resources"],
    queryFn: async () => {
      const { data } = await supabase.from("study_resources").select("*, courses(title)").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: courses } = useQuery({
    queryKey: ["admin-courses-list"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("id, title");
      return data || [];
    },
  });

  const upload = useMutation({
    mutationFn: async () => {
      let file_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("resources").upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("resources").getPublicUrl(path);
        file_url = urlData.publicUrl;
      }
      const { error } = await supabase.from("study_resources").insert({
        title,
        description: description || null,
        course_id: courseId || null,
        file_url,
        uploaded_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-resources"] });
      toast.success("Resource uploaded");
      setOpen(false);
      setTitle("");
      setDescription("");
      setCourseId("");
      setFile(null);
    },
    onError: () => toast.error("Upload failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_resources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-resources"] });
      toast.success("Resource deleted");
    },
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Study Resources</h1>
          <p className="text-muted-foreground">Upload and manage study materials</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Upload Resource</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Resource</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); upload.mutate(); }} className="space-y-4">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger><SelectValue placeholder="Link to course (optional)" /></SelectTrigger>
                <SelectContent>
                  {courses?.map((c) => (<SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>))}
                </SelectContent>
              </Select>
              <Input type="file" ref={fileRef} onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <Button type="submit" disabled={upload.isPending} className="w-full">
                {upload.isPending ? "Uploading..." : "Upload"}
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
              <TableHead>Date</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-24" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !resources?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No resources yet</TableCell>
              </TableRow>
            ) : (
              resources.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.title}</TableCell>
                  <TableCell>{r.courses?.title || "—"}</TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="flex gap-1">
                    {r.file_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove.mutate(r.id)}>
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

export default Resources;
