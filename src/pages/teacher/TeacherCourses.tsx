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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Upload, Plus, Users, BookOpen, FileQuestion } from "lucide-react";
import { useState } from "react";

const TeacherCourses = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // States for dialogs
  const [lessonOpen, setLessonOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  // Lesson form
  const [lessonForm, setLessonForm] = useState({ title: "", type: "video", videoUrl: "", content: "", duration: "" });

  // Quiz form
  const [quizForm, setQuizForm] = useState({ title: "", moduleId: "" });
  const [questions, setQuestions] = useState([
    { question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "option_a" },
  ]);

  // Get assigned courses with modules, lessons, enrollments
  const { data: courses, isLoading } = useQuery({
    queryKey: ["teacher-courses", user?.id],
    queryFn: async () => {
      const { data: tc } = await supabase
        .from("teacher_courses")
        .select("course_id")
        .eq("teacher_id", user!.id);
      if (!tc?.length) return [];
      const courseIds = tc.map((t) => t.course_id);

      const { data: coursesData } = await supabase
        .from("courses")
        .select("*, modules(id, title, order_number, lessons(id, title, type, order_number))")
        .in("id", courseIds)
        .order("created_at", { ascending: false });

      // Get enrollment counts
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, id")
        .in("course_id", courseIds);
      const countMap = new Map<string, number>();
      enrollments?.forEach((e) => countMap.set(e.course_id, (countMap.get(e.course_id) || 0) + 1));

      return (coursesData || []).map((c: any) => ({
        ...c,
        enrollmentCount: countMap.get(c.id) || 0,
        modules: (c.modules || []).sort((a: any, b: any) => a.order_number - b.order_number).map((m: any) => ({
          ...m,
          lessons: (m.lessons || []).sort((a: any, b: any) => a.order_number - b.order_number),
        })),
      }));
    },
    enabled: !!user,
  });

  // Get all modules for selected courses (for quiz/lesson creation)
  const allModules = courses?.flatMap((c: any) => c.modules.map((m: any) => ({ ...m, courseTitle: c.title, courseId: c.id }))) || [];

  // Upload lesson
  const addLesson = useMutation({
    mutationFn: async () => {
      // Get current max order
      const { data: existing } = await supabase
        .from("lessons")
        .select("order_number")
        .eq("module_id", selectedModuleId)
        .order("order_number", { ascending: false })
        .limit(1);
      const nextOrder = (existing?.[0]?.order_number ?? 0) + 1;

      const { error } = await supabase.from("lessons").insert({
        module_id: selectedModuleId,
        title: lessonForm.title,
        type: lessonForm.type,
        video_url: lessonForm.videoUrl || null,
        content: lessonForm.content || null,
        duration: lessonForm.duration || null,
        order_number: nextOrder,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-courses"] });
      toast.success("Lesson added");
      setLessonOpen(false);
      setLessonForm({ title: "", type: "video", videoUrl: "", content: "", duration: "" });
    },
    onError: () => toast.error("Failed to add lesson"),
  });

  // Create quiz
  const addQuiz = useMutation({
    mutationFn: async () => {
      const { data: quiz, error: quizErr } = await supabase
        .from("quizzes")
        .insert({ title: quizForm.title, module_id: quizForm.moduleId })
        .select("id")
        .single();
      if (quizErr) throw quizErr;

      const questionRows = questions.map((q, i) => ({
        quiz_id: quiz.id,
        question: q.question,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer,
        order_number: i + 1,
      }));
      const { error: qErr } = await supabase.from("quiz_questions").insert(questionRows);
      if (qErr) throw qErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher-courses"] });
      toast.success("Quiz created");
      setQuizOpen(false);
      setQuizForm({ title: "", moduleId: "" });
      setQuestions([{ question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "option_a" }]);
    },
    onError: () => toast.error("Failed to create quiz"),
  });

  const addQuestion = () => {
    setQuestions([...questions, { question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "option_a" }]);
  };

  const updateQuestion = (idx: number, field: string, value: string) => {
    setQuestions(questions.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  };

  return (
    <TeacherLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">My Courses</h1>
          <p className="text-muted-foreground">View assigned courses, upload lessons, and create quizzes</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={lessonOpen} onOpenChange={setLessonOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Add Lesson</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add Lesson</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addLesson.mutate(); }} className="space-y-4">
                <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                  <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>
                    {allModules.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.courseTitle} → {m.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Lesson title" value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} required />
                <Select value={lessonForm.type} onValueChange={(v) => setLessonForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
                {(lessonForm.type === "video" || lessonForm.type === "audio") && (
                  <Input placeholder="Video/Audio URL" value={lessonForm.videoUrl} onChange={(e) => setLessonForm((f) => ({ ...f, videoUrl: e.target.value }))} />
                )}
                {lessonForm.type === "text" && (
                  <Textarea placeholder="Lesson content" value={lessonForm.content} onChange={(e) => setLessonForm((f) => ({ ...f, content: e.target.value }))} rows={5} />
                )}
                <Input placeholder="Duration (e.g. 15 min)" value={lessonForm.duration} onChange={(e) => setLessonForm((f) => ({ ...f, duration: e.target.value }))} />
                <Button type="submit" disabled={addLesson.isPending || !selectedModuleId} className="w-full">
                  {addLesson.isPending ? "Adding..." : "Add Lesson"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
            <DialogTrigger asChild>
              <Button><FileQuestion className="mr-2 h-4 w-4" />Create Quiz</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Quiz</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); addQuiz.mutate(); }} className="space-y-4">
                <Input placeholder="Quiz title" value={quizForm.title} onChange={(e) => setQuizForm((f) => ({ ...f, title: e.target.value }))} required />
                <Select value={quizForm.moduleId} onValueChange={(v) => setQuizForm((f) => ({ ...f, moduleId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                  <SelectContent>
                    {allModules.map((m: any) => (
                      <SelectItem key={m.id} value={m.id}>{m.courseTitle} → {m.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={idx} className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <p className="text-sm font-semibold text-foreground">Question {idx + 1}</p>
                      <Input placeholder="Question text" value={q.question} onChange={(e) => updateQuestion(idx, "question", e.target.value)} required />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Option A" value={q.option_a} onChange={(e) => updateQuestion(idx, "option_a", e.target.value)} required />
                        <Input placeholder="Option B" value={q.option_b} onChange={(e) => updateQuestion(idx, "option_b", e.target.value)} required />
                        <Input placeholder="Option C" value={q.option_c} onChange={(e) => updateQuestion(idx, "option_c", e.target.value)} required />
                        <Input placeholder="Option D" value={q.option_d} onChange={(e) => updateQuestion(idx, "option_d", e.target.value)} required />
                      </div>
                      <Select value={q.correct_answer} onValueChange={(v) => updateQuestion(idx, "correct_answer", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="option_a">A is correct</SelectItem>
                          <SelectItem value="option_b">B is correct</SelectItem>
                          <SelectItem value="option_c">C is correct</SelectItem>
                          <SelectItem value="option_d">D is correct</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />Add Question
                </Button>
                <Button type="submit" disabled={addQuiz.isPending || !quizForm.moduleId} className="w-full">
                  {addQuiz.isPending ? "Creating..." : "Create Quiz"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : !courses?.length ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-foreground">No courses assigned yet</p>
          <p className="text-muted-foreground">An admin will assign courses to you.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map((course: any) => (
            <div key={course.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-6 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{course.title}</h2>
                  <p className="text-sm text-muted-foreground">{course.category}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{course.enrollmentCount} students</span>
                </div>
              </div>

              <div className="px-6 pb-6">
                {course.modules.map((mod: any) => (
                  <div key={mod.id} className="mb-4 last:mb-0">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {mod.title}
                    </h3>
                    {mod.lessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground/60 italic">No lessons yet</p>
                    ) : (
                      <div className="space-y-1">
                        {mod.lessons.map((lesson: any) => (
                          <div key={lesson.id} className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 text-sm">
                            <span className="font-medium text-foreground">{lesson.title}</span>
                            <span className="text-xs text-muted-foreground capitalize">{lesson.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </TeacherLayout>
  );
};

export default TeacherCourses;
