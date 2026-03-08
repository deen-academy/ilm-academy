import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const QuizPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const { data: quiz } = useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*, quiz_questions(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const questions = ((quiz?.quiz_questions as any[]) || []).sort((a: any, b: any) => a.order_number - b.order_number);

  const score = questions.reduce(
    (acc, q) => acc + (answers[q.id] === q.correct_answer ? 1 : 0),
    0
  );

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("quiz_results").upsert({
        user_id: user.id,
        quiz_id: id!,
        score,
        total_questions: questions.length,
      }, { onConflict: "user_id,quiz_id" });
      if (error) throw error;
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (user) {
      submitMutation.mutate();
    } else {
      setSubmitted(true);
    }
  };

  if (!quiz) {
    return <Layout><div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading quiz...</div></Layout>;
  }

  const optionKeys = ["a", "b", "c", "d"] as const;

  return (
    <Layout showFooter={false}>
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-foreground">{quiz.title}</h1>
        <p className="mb-8 text-sm text-muted-foreground">Test your knowledge</p>

        <div className="space-y-6">
          {questions.map((q: any, qi: number) => (
            <div key={q.id} className="rounded-xl border bg-card p-5 shadow-card">
              <p className="mb-3 font-medium text-foreground">{qi + 1}. {q.question}</p>
              <div className="space-y-2">
                {optionKeys.map((key) => {
                  const optText = q[`option_${key}`];
                  const selected = answers[q.id] === key;
                  const isCorrect = submitted && key === q.correct_answer;
                  const isWrong = submitted && selected && key !== q.correct_answer;
                  return (
                    <button
                      key={key}
                      disabled={submitted}
                      onClick={() => setAnswers({ ...answers, [q.id]: key })}
                      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors text-left ${
                        selected && !submitted ? "border-primary bg-primary/5" : ""
                      } ${isCorrect ? "border-green-500 bg-green-50" : ""} ${
                        isWrong ? "border-destructive bg-destructive/5" : ""
                      } ${!selected && !isCorrect ? "hover:bg-muted/50" : ""}`}
                    >
                      <span className="flex-1">{optText}</span>
                      {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {isWrong && <XCircle className="h-4 w-4 text-destructive" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {!submitted ? (
          <Button
            variant="hero"
            size="lg"
            className="mt-8 w-full"
            disabled={Object.keys(answers).length < questions.length || submitMutation.isPending}
            onClick={handleSubmit}
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Answers"}
          </Button>
        ) : (
          <div className="mt-8 rounded-xl gradient-primary p-6 text-center">
            <p className="text-2xl font-bold text-primary-foreground">{score} / {questions.length}</p>
            <p className="mt-1 text-primary-foreground/80">
              {score === questions.length ? "MashaAllah! Perfect score!" : "Keep practising, you'll get there!"}
            </p>
            <Button variant="accent" className="mt-4" asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default QuizPage;
