import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

const sampleQuestions = [
  {
    id: "q1",
    question: "What is the first letter of the Arabic alphabet?",
    options: ["Baa", "Alif", "Taa", "Jeem"],
    correct: 1,
  },
  {
    id: "q2",
    question: "What does Fatha sound like?",
    options: ["'u' as in put", "'i' as in sit", "'a' as in cat", "'o' as in pot"],
    correct: 2,
  },
  {
    id: "q3",
    question: "How many letters are in the Arabic alphabet?",
    options: ["26", "28", "30", "24"],
    correct: 1,
  },
];

const QuizPage = () => {
  const { id } = useParams();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = sampleQuestions.reduce(
    (acc, q) => acc + (answers[q.id] === q.correct ? 1 : 0),
    0
  );

  return (
    <Layout showFooter={false}>
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Quiz</h1>
        <p className="mb-8 text-sm text-muted-foreground">Test your knowledge from this module</p>

        <div className="space-y-6">
          {sampleQuestions.map((q, qi) => (
            <div key={q.id} className="rounded-xl border bg-card p-5 shadow-card">
              <p className="mb-3 font-medium text-foreground">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = answers[q.id] === oi;
                  const isCorrect = submitted && oi === q.correct;
                  const isWrong = submitted && selected && oi !== q.correct;
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers({ ...answers, [q.id]: oi })}
                      className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors text-left ${
                        selected && !submitted ? "border-primary bg-primary/5" : ""
                      } ${isCorrect ? "border-green-500 bg-green-50" : ""} ${
                        isWrong ? "border-destructive bg-destructive/5" : ""
                      } ${!selected && !isCorrect ? "hover:bg-muted/50" : ""}`}
                    >
                      <span className="flex-1">{opt}</span>
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
            disabled={Object.keys(answers).length < sampleQuestions.length}
            onClick={() => setSubmitted(true)}
          >
            Submit Answers
          </Button>
        ) : (
          <div className="mt-8 rounded-xl gradient-primary p-6 text-center">
            <p className="text-2xl font-bold text-primary-foreground">
              {score} / {sampleQuestions.length}
            </p>
            <p className="mt-1 text-primary-foreground/80">
              {score === sampleQuestions.length ? "MashaAllah! Perfect score!" : "Keep practising, you'll get there!"}
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
