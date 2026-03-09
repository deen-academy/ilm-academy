import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Video, Music, FileText, Loader2, Trash2 } from "lucide-react";

const UploadLesson = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get("edit");
  const preselectedModuleId = searchParams.get("module");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"video" | "audio" | "text">("video");
  const [duration, setDuration] = useState("");
  const [content, setContent] = useState("");
  const [moduleId, setModuleId] = useState(preselectedModuleId || "");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [existingVideoUrl, setExistingVideoUrl] = useState<string | null>(null);
  const [existingAudioUrl, setExistingAudioUrl] = useState<string | null>(null);

  // Fetch courses and modules for selection
  const { data: courses } = useQuery({
    queryKey: ["all-courses-with-modules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, modules(id, title, order_number)")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing lesson if editing
  const { isLoading: loadingLesson } = useQuery({
    queryKey: ["edit-lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId!)
        .single();
      if (error) throw error;
      setTitle(data.title);
      setType((data.type as "video" | "audio" | "text") || "video");
      setDuration(data.duration || "");
      setContent(data.content || "");
      setModuleId(data.module_id);
      setExistingVideoUrl(data.video_url);
      setExistingAudioUrl(data.audio_url);
      return data;
    },
    enabled: !!lessonId,
  });

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("lesson-media").upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("lesson-media").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!moduleId) throw new Error("Please select a module");
      if (!title.trim()) throw new Error("Please enter a title");

      setUploading(true);

      let video_url = existingVideoUrl;
      let audio_url = existingAudioUrl;

      // Upload video if provided
      if (videoFile) {
        video_url = await uploadFile(videoFile, "videos");
      }

      // Upload audio if provided
      if (audioFile) {
        audio_url = await uploadFile(audioFile, "audio");
      }

      const lessonData = {
        title: title.trim(),
        type,
        duration: duration.trim() || null,
        content: content.trim() || null,
        module_id: moduleId,
        video_url,
        audio_url,
      };

      if (lessonId) {
        const { error } = await supabase
          .from("lessons")
          .update(lessonData)
          .eq("id", lessonId);
        if (error) throw error;
      } else {
        // Get max order_number for this module
        const { data: existing } = await supabase
          .from("lessons")
          .select("order_number")
          .eq("module_id", moduleId)
          .order("order_number", { ascending: false })
          .limit(1);
        
        const nextOrder = existing?.length ? (existing[0].order_number || 0) + 1 : 1;

        const { error } = await supabase
          .from("lessons")
          .insert({ ...lessonData, order_number: nextOrder });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["course"] });
      toast.success(lessonId ? "Lesson updated!" : "Lesson created!");
      navigate(-1);
    },
    onError: (err: any) => {
      toast.error(err.message);
      setUploading(false);
    },
  });

  const allModules = courses?.flatMap((c) =>
    (c.modules || [])
      .sort((a: any, b: any) => a.order_number - b.order_number)
      .map((m: any) => ({
        id: m.id,
        title: m.title,
        courseTitle: c.title,
      }))
  ) || [];

  if (lessonId && loadingLesson) {
    return (
      <Layout>
        <div className="container mx-auto max-w-2xl px-4 py-10 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading lesson...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-8 text-3xl font-bold text-foreground">
          {lessonId ? "Edit Lesson" : "Create Lesson"}
        </h1>

        <form
          className="space-y-6 rounded-xl border bg-card p-6 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          {/* Module Selection */}
          <div>
            <Label htmlFor="module">Module *</Label>
            <Select value={moduleId} onValueChange={setModuleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a module" />
              </SelectTrigger>
              <SelectContent>
                {allModules.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.courseTitle} → {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Lesson Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Alif to Thaa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Type */}
          <div>
            <Label>Lesson Type</Label>
            <div className="mt-2 flex gap-2">
              {[
                { value: "video", icon: Video, label: "Video" },
                { value: "audio", icon: Music, label: "Audio" },
                { value: "text", icon: FileText, label: "Text" },
              ].map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  type="button"
                  variant={type === value ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setType(value as typeof type)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              placeholder="e.g. 12 min"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {/* Video Upload */}
          {(type === "video" || existingVideoUrl) && (
            <div>
              <Label>Video File</Label>
              {existingVideoUrl && !videoFile && (
                <div className="mt-2 mb-2 flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                  <Video className="h-5 w-5 text-primary" />
                  <span className="flex-1 truncate text-sm">Existing video uploaded</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setExistingVideoUrl(null)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="mt-2">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-primary/50">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {videoFile ? videoFile.name : "Click to upload video (MP4, WebM)"}
                  </span>
                  <Input
                    type="file"
                    accept="video/mp4,video/webm,video/*"
                    className="hidden"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Audio Upload */}
          {(type === "audio" || existingAudioUrl) && (
            <div>
              <Label>Audio File</Label>
              {existingAudioUrl && !audioFile && (
                <div className="mt-2 mb-2 flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
                  <Music className="h-5 w-5 text-primary" />
                  <span className="flex-1 truncate text-sm">Existing audio uploaded</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setExistingAudioUrl(null)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="mt-2">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-primary/50">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {audioFile ? audioFile.name : "Click to upload audio (MP3, WAV)"}
                  </span>
                  <Input
                    type="file"
                    accept="audio/mp3,audio/wav,audio/*"
                    className="hidden"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* Content / Notes */}
          <div>
            <Label htmlFor="content">Lesson Notes / Content</Label>
            <Textarea
              id="content"
              placeholder="Write lesson explanation, transcript, or notes..."
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="hero"
              className="flex-1"
              disabled={saveMutation.isPending || uploading}
            >
              {saveMutation.isPending || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? "Uploading..." : "Saving..."}
                </>
              ) : lessonId ? (
                "Update Lesson"
              ) : (
                "Create Lesson"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default UploadLesson;
