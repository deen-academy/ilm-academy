import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, PlayCircle } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const LessonPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch lesson with its module and course info
  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*, modules(id, title, course_id, courses(id, title))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch lesson progress
  const { data: progress } = useQuery({
    queryKey: ["lesson-progress", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("lesson_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const completed = progress?.completed ?? false;

  const toggleCompleteMutation = useMutation({
    mutationFn: async () => {
      if (progress) {
        const { error } = await supabase
          .from("lesson_progress")
          .update({ completed: !completed, completed_at: !completed ? new Date().toISOString() : null })
          .eq("id", progress.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lesson_progress")
          .insert({ lesson_id: id!, user_id: user!.id, completed: true, completed_at: new Date().toISOString() });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress", id] });
      queryClient.invalidateQueries({ queryKey: ["course-progress"] });
      toast.success(completed ? "Marked as incomplete" : "Lesson completed! 🎉");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <Layout showFooter={false}>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </Layout>
    );
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

  const course = (lesson as any).modules?.courses;
  const courseId = (lesson as any).modules?.course_id;

  return (
    <Layout showFooter={false}>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/courses">Courses</Link></BreadcrumbLink>
              </BreadcrumbItem>
              {courseId && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link to={`/courses/${courseId}`}>{course?.title || "Course"}</Link></BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              {(lesson as any).modules?.title && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-muted-foreground text-sm">{(lesson as any).modules.title}</span>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{lesson.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">{lesson.title}</h1>
        <p className="mb-8 text-sm text-muted-foreground">{lesson.duration} • {lesson.type}</p>

        {/* Video / Content placeholder */}
        <div className="mb-8 flex aspect-video items-center justify-center rounded-xl bg-muted">
          <div className="text-center">
            <PlayCircle className="mx-auto mb-2 h-16 w-16 text-primary/30" />
            <p className="text-sm text-muted-foreground">Lesson content will appear here</p>
          </div>
        </div>

        {/* Arabic text example */}
        <div className="mb-8 rounded-xl border bg-card p-6 text-center">
          <p className="font-arabic text-3xl leading-loose text-foreground" dir="rtl">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </p>
          <p className="mt-3 text-sm text-muted-foreground">In the name of Allah, the Most Gracious, the Most Merciful</p>
        </div>

        {/* Lesson content */}
        {lesson.content && (
          <div className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Lesson Notes</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{lesson.content}</p>
          </div>
        )}

        {user && (
          <Button
            variant={completed ? "outline" : "hero"}
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => toggleCompleteMutation.mutate()}
            disabled={toggleCompleteMutation.isPending}
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
