import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const QuizPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [gradeResults, setGradeResults] = useState<Record<string, { correct: boolean }>>({});

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, quiz_questions(id, question, option_a, option_b, option_c, option_d, order_number), modules(id, title, course_id, courses(id, title))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      if (data?.quiz_questions) {
        data.quiz_questions.sort((a: any, b: any) => a.order_number - b.order_number);
      }
      return data;
    },
    enabled: !!id,
  });

  const gradeMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("grade_quiz", {
        _quiz_id: id!,
        _answers: answers,
      });
      if (error) throw error;
      return data as { score: number; total: number; results: Array<{ question_id: string; correct: boolean }> };
    },
    onSuccess: (data) => {
      setScore(data.score);
      setTotalQuestions(data.total);
      const resultsMap: Record<string, { correct: boolean }> = {};
      data.results.forEach((r) => {
        resultsMap[r.question_id] = { correct: r.correct };
      });
      setGradeResults(resultsMap);
      setSubmitted(true);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const questions = quiz?.quiz_questions || [];

  const handleSubmit = () => {
    gradeMutation.mutate();
  };

  if (isLoading) {
    return (
      <Layout showFooter={false}>
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </Layout>
    );
  }

  if (!quiz) {
    return (
      <Layout showFooter={false}>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Quiz not found</h1>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const optionKeys = ["option_a", "option_b", "option_c", "option_d"] as const;
  const optionLabels = ["a", "b", "c", "d"];
  const displayLabels = ["A", "B", "C", "D"];

  return (
    <Layout showFooter={false}>
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link to="/courses">Courses</Link></BreadcrumbLink>
              </BreadcrumbItem>
              {(quiz as any).modules?.courses && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link to={`/courses/${(quiz as any).modules.course_id}`}>{(quiz as any).modules.courses.title}</Link></BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              {(quiz as any).modules?.title && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <span className="text-muted-foreground text-sm">{(quiz as any).modules.title}</span>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{quiz.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">{quiz.title}</h1>
        <p className="mb-8 text-sm text-muted-foreground">Test your knowledge from this module</p>

        <div className="space-y-6">
          {questions.map((q: any, qi: number) => {
            const result = gradeResults[q.id];
            return (
              <div key={q.id} className="rounded-xl border bg-card p-5 shadow-card">
                <p className="mb-3 font-medium text-foreground">
                  {qi + 1}. {q.question}
                </p>
                <div className="space-y-2">
                  {optionKeys.map((key, oi) => {
                    const label = optionLabels[oi];
                    const displayLabel = displayLabels[oi];
                    const selected = answers[q.id] === label;
                    const isCorrect = submitted && selected && result?.correct;
                    const isWrong = submitted && selected && !result?.correct;
                    return (
                      <button
                        key={key}
                        disabled={submitted}
                        onClick={() => setAnswers({ ...answers, [q.id]: label })}
                        className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors text-left ${
                          selected && !submitted ? "border-primary bg-primary/5" : ""
                        } ${isCorrect ? "border-green-500 bg-green-50" : ""} ${
                          isWrong ? "border-destructive bg-destructive/5" : ""
                        } ${!selected && !isCorrect ? "hover:bg-muted/50" : ""}`}
                      >
                        <span className="font-medium text-muted-foreground">{displayLabel}.</span>
                        <span className="flex-1">{q[key]}</span>
                        {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {isWrong && <XCircle className="h-4 w-4 text-destructive" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {questions.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No questions available for this quiz yet.</p>
        )}

        {questions.length > 0 && !submitted ? (
          <Button
            variant="hero"
            size="lg"
            className="mt-8 w-full"
            disabled={Object.keys(answers).length < questions.length || gradeMutation.isPending}
            onClick={handleSubmit}
          >
            {gradeMutation.isPending ? "Grading..." : "Submit Answers"}
          </Button>
        ) : submitted ? (
          <div className="mt-8 rounded-xl gradient-primary p-6 text-center">
            <p className="text-2xl font-bold text-primary-foreground">
              {score} / {totalQuestions}
            </p>
            <p className="mt-1 text-primary-foreground/80">
              {score === totalQuestions ? "MashaAllah! Perfect score!" : "Keep practising, you'll get there!"}
            </p>
            <Button variant="accent" className="mt-4" asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </Layout>
  );
};

export default QuizPage;
