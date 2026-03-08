import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
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

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, quiz_questions(*)")
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

  const saveResultMutation = useMutation({
    mutationFn: async (finalScore: number) => {
      if (!user) return;
      const { error } = await supabase
        .from("quiz_results")
        .insert({
          quiz_id: id!,
          user_id: user.id,
          score: finalScore,
          total_questions: quiz?.quiz_questions?.length || 0,
        });
      if (error) throw error;
    },
    onError: (err: any) => toast.error(err.message),
  });

  const questions = quiz?.quiz_questions || [];

  const handleSubmit = () => {
    let correct = 0;
    questions.forEach((q: any) => {
      if (answers[q.id] === q.correct_answer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    saveResultMutation.mutate(correct);
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
  const optionLabels = ["A", "B", "C", "D"];

  return (
    <Layout showFooter={false}>
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <button onClick={() => window.history.back()} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="mb-2 text-2xl font-bold text-foreground">{quiz.title}</h1>
        <p className="mb-8 text-sm text-muted-foreground">Test your knowledge from this module</p>

        <div className="space-y-6">
          {questions.map((q: any, qi: number) => (
            <div key={q.id} className="rounded-xl border bg-card p-5 shadow-card">
              <p className="mb-3 font-medium text-foreground">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {optionKeys.map((key, oi) => {
                  const label = optionLabels[oi];
                  const selected = answers[q.id] === label;
                  const isCorrect = submitted && label === q.correct_answer;
                  const isWrong = submitted && selected && label !== q.correct_answer;
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
                      <span className="font-medium text-muted-foreground">{label}.</span>
                      <span className="flex-1">{q[key]}</span>
                      {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {isWrong && <XCircle className="h-4 w-4 text-destructive" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {questions.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No questions available for this quiz yet.</p>
        )}

        {questions.length > 0 && !submitted ? (
          <Button
            variant="hero"
            size="lg"
            className="mt-8 w-full"
            disabled={Object.keys(answers).length < questions.length}
            onClick={handleSubmit}
          >
            Submit Answers
          </Button>
        ) : submitted ? (
          <div className="mt-8 rounded-xl gradient-primary p-6 text-center">
            <p className="text-2xl font-bold text-primary-foreground">
              {score} / {questions.length}
            </p>
            <p className="mt-1 text-primary-foreground/80">
              {score === questions.length ? "MashaAllah! Perfect score!" : "Keep practising, you'll get there!"}
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
