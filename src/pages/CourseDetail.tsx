import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Clock, ChevronRight, PlayCircle, FileText, Headphones, HelpCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const iconForType = (type: string) => {
  if (type === "video") return PlayCircle;
  if (type === "audio") return Headphones;
  return FileText;
};

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*, modules(*, lessons(*), quizzes(id, title) )")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      // Sort modules and lessons by order_number
      if (data?.modules) {
        data.modules.sort((a: any, b: any) => a.order_number - b.order_number);
        data.modules.forEach((m: any) => m.lessons?.sort((a: any, b: any) => a.order_number - b.order_number));
      }
      return data;
    },
    enabled: !!id,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const allLessonIds = course?.modules?.flatMap((m: any) => m.lessons?.map((l: any) => l.id) || []) || [];

  const { data: lessonProgress = [] } = useQuery({
    queryKey: ["course-progress", id, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed")
        .eq("user_id", user!.id)
        .in("lesson_id", allLessonIds)
        .eq("completed", true);
      return data || [];
    },
    enabled: !!user && !!enrollment && allLessonIds.length > 0,
  });

  const completedLessonIds = new Set(lessonProgress.map((p: any) => p.lesson_id));

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("enrollments")
        .insert({ course_id: id!, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
      toast.success("Enrolled successfully!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Course not found</h1>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const totalLessons = course.modules?.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0) || 0;

  return (
    <Layout>
      {/* Header */}
      <section className="gradient-primary">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6">
              <Breadcrumb>
                <BreadcrumbList className="text-primary-foreground/70">
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link to="/courses" className="text-primary-foreground/70 hover:text-primary-foreground">Courses</Link></BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-primary-foreground/50" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-primary-foreground">{course.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <span className="mb-3 inline-block rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-medium text-primary-foreground">
              {course.category}
            </span>
            <h1 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">{course.title}</h1>
            <p className="mb-6 text-primary-foreground/80">{course.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {course.modules?.length || 0} modules</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {totalLessons} lessons</span>
            </div>
            {user && enrollment && totalLessons > 0 && (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm text-primary-foreground/80">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {lessonProgress.length} of {totalLessons} lessons completed
                  </span>
                  <span className="font-semibold text-primary-foreground">{Math.round((lessonProgress.length / totalLessons) * 100)}%</span>
                </div>
                <Progress value={(lessonProgress.length / totalLessons) * 100} className="h-2.5 bg-primary-foreground/20 [&>div]:bg-primary-foreground" />
              </div>
            )}
            {user ? (
              enrollment ? (
                <Button variant="accent" size="lg" className="mt-6" disabled>
                  ✓ Enrolled
                </Button>
              ) : (
                <Button
                  variant="accent"
                  size="lg"
                  className="mt-6"
                  onClick={() => enrollMutation.mutate()}
                  disabled={enrollMutation.isPending}
                >
                  {enrollMutation.isPending ? "Enrolling..." : "Enroll Now — Free"}
                </Button>
              )
            ) : (
              <Button variant="accent" size="lg" className="mt-6" asChild>
                <Link to="/login">Log in to Enroll</Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Course Content</h2>
          <div className="space-y-4">
            {course.modules?.map((mod: any, mi: number) => (
              <div key={mod.id} className="rounded-xl border bg-card shadow-card overflow-hidden">
                <div className="flex items-center justify-between bg-secondary/50 px-5 py-4">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Module {mi + 1}</span>
                    <h3 className="text-base font-semibold text-foreground">{mod.title}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{mod.lessons?.length || 0} lessons</span>
                </div>
                <ul className="divide-y">
                  {mod.lessons?.map((lesson: any) => {
                    const Icon = iconForType(lesson.type || "text");
                    const isCompleted = completedLessonIds.has(lesson.id);
                    return (
                      <li key={lesson.id}>
                        <Link
                          to={`/lesson/${lesson.id}`}
                          className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/50"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Icon className="h-4 w-4 text-primary" />
                          )}
                          <span className={`flex-1 ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}>{lesson.title}</span>
                          {lesson.duration && <span className="text-xs text-muted-foreground">{lesson.duration}</span>}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </li>
                    );
                  })}
                  {mod.quizzes?.map((quiz: any) => (
                    <li key={quiz.id}>
                      <Link
                        to={`/quiz/${quiz.id}`}
                        className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/50 bg-accent/30"
                      >
                        <HelpCircle className="h-4 w-4 text-accent-foreground" />
                        <span className="flex-1 font-medium text-foreground">{quiz.title}</span>
                        <span className="text-xs font-medium text-primary">Take Quiz</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default CourseDetail;
