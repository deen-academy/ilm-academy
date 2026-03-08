import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { seedCourses } from "@/data/courses";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, PlayCircle } from "lucide-react";
import { useState } from "react";

const LessonPage = () => {
  const { id } = useParams();
  const [completed, setCompleted] = useState(false);

  // Find lesson across all courses
  let foundLesson = null as any;
  let foundCourse = null as any;
  for (const course of seedCourses) {
    for (const mod of course.modules) {
      const lesson = mod.lessons.find((l) => l.id === id);
      if (lesson) {
        foundLesson = lesson;
        foundCourse = course;
        break;
      }
    }
    if (foundLesson) break;
  }

  if (!foundLesson) {
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
        <Link to={`/courses/${foundCourse.id}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to {foundCourse.title}
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-foreground">{foundLesson.title}</h1>
        <p className="mb-8 text-sm text-muted-foreground">{foundLesson.duration} • {foundLesson.type}</p>

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

        {/* Lesson explanation */}
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">Lesson Notes</h2>
          <p className="text-muted-foreground leading-relaxed">
            This lesson covers the fundamentals. Watch the video above, listen to the recitation, and practise repeating. Once you feel confident, mark the lesson as complete and move to the next one.
          </p>
        </div>

        <Button
          variant={completed ? "outline" : "hero"}
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => setCompleted(!completed)}
        >
          {completed ? (
            <><CheckCircle2 className="mr-2 h-5 w-5" /> Completed</>
          ) : (
            "Mark as Complete"
          )}
        </Button>
      </div>
    </Layout>
  );
};

export default LessonPage;
