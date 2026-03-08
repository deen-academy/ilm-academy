import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, PlayCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const LessonPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch lesson with its module and course
  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*, modules(*, courses(*))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch progress
  const { data: progress } = useQuery({
    queryKey: ["lesson-progress", id, user?.id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", user!.id)
        .eq("lesson_id", id!)
        .maybeSingle();
      return data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (progress) {
        const { error } = await supabase
          .from("lesson_progress")
          .update({ completed: !progress.completed, completed_at: !progress.completed ? new Date().toISOString() : null })
          .eq("id", progress.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lesson_progress")
          .insert({ user_id: user!.id, lesson_id: id!, completed: true, completed_at: new Date().toISOString() });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress", id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["lesson-progress"] });
      toast({ title: progress?.completed ? "Unmarked" : "Lesson completed!" });
    },
  });

  const completed = progress?.completed || false;
  const course = (lesson?.modules as any)?.courses as any;

  if (isLoading) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div></Layout>;
  }

  if (!lesson) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Lesson not found</h1>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {course && (
          <Link to={`/courses/${course.id}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to {course.title}
          </Link>
        )}

        <h1 className="mb-2 text-2xl font-bold text-foreground">{lesson.title}</h1>
        <p className="mb-8 text-sm text-muted-foreground">{lesson.duration || ""} • {lesson.type || "lesson"}</p>

        {/* Video placeholder */}
        {lesson.video_url ? (
          <div className="mb-8 aspect-video rounded-xl overflow-hidden bg-muted">
            <iframe src={lesson.video_url} className="h-full w-full" allowFullScreen />
          </div>
        ) : (
          <div className="mb-8 flex aspect-video items-center justify-center rounded-xl bg-muted">
            <div className="text-center">
              <PlayCircle className="mx-auto mb-2 h-16 w-16 text-primary/30" />
              <p className="text-sm text-muted-foreground">Lesson content will appear here</p>
            </div>
          </div>
        )}

        {/* Content with Arabic text rendering */}
        {lesson.content && (
          <div className="mb-8 space-y-6">
            {lesson.content.split('\n\n').map((block: string, i: number) => {
              // Check if block contains Arabic characters
              const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(block);
              const lines = block.split('\n');
              
              if (hasArabic && lines.length >= 2) {
                // Render as Arabic card with translation
                const arabicLine = lines.find(l => /[\u0600-\u06FF]/.test(l));
                const translationLine = lines.find(l => !/[\u0600-\u06FF]/.test(l) && l.trim());
                
                return (
                  <div key={i} className="rounded-xl border bg-card p-6 text-center shadow-card">
                    <p className="font-arabic text-2xl leading-loose text-foreground md:text-3xl" dir="rtl">
                      {arabicLine}
                    </p>
                    {translationLine && (
                      <p className="mt-3 text-sm text-muted-foreground">{translationLine}</p>
                    )}
                  </div>
                );
              }
              
              if (hasArabic) {
                // Inline Arabic with pronunciation
                return (
                  <div key={i} className="rounded-xl border bg-card p-6 text-center shadow-card">
                    <p className="font-arabic text-xl leading-loose text-foreground md:text-2xl" dir="rtl">
                      {block}
                    </p>
                  </div>
                );
              }
              
              // Regular text
              return (
                <div key={i}>
                  <p className="text-muted-foreground leading-relaxed">{block}</p>
                </div>
              );
            })}
          </div>
        )}

        {user && (
          <Button
            variant={completed ? "outline" : "hero"}
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            {completed ? (
              <><CheckCircle2 className="mr-2 h-5 w-5" /> Completed</>
            ) : (
              "Mark as Complete"
            )}
          </Button>
        )}
      </div>
    </Layout>
  );
};

export default LessonPage;
