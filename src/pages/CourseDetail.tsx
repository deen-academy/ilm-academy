import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { seedCourses } from "@/data/courses";
import { useParams, Link } from "react-router-dom";
import { BookOpen, Clock, ChevronRight, Users, PlayCircle, FileText, Headphones } from "lucide-react";

const iconForType = (type: string) => {
  if (type === "video") return PlayCircle;
  if (type === "audio") return Headphones;
  return FileText;
};

const CourseDetail = () => {
  const { id } = useParams();
  const course = seedCourses.find((c) => c.id === id);

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

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <Layout>
      {/* Header */}
      <section className="gradient-primary">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <span className="mb-3 inline-block rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-medium text-primary-foreground">
              {course.category}
            </span>
            <h1 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">{course.title}</h1>
            <p className="mb-6 text-primary-foreground/80">{course.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-primary-foreground/70">
              <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {course.modules.length} modules</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {totalLessons} lessons</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {course.students} students</span>
            </div>
            <Button variant="accent" size="lg" className="mt-6">Enroll Now — Free</Button>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-12">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Course Content</h2>
          <div className="space-y-4">
            {course.modules.map((mod, mi) => (
              <div key={mod.id} className="rounded-xl border bg-card shadow-card overflow-hidden">
                <div className="flex items-center justify-between bg-secondary/50 px-5 py-4">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Module {mi + 1}</span>
                    <h3 className="text-base font-semibold text-foreground">{mod.title}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">{mod.lessons.length} lessons</span>
                </div>
                <ul className="divide-y">
                  {mod.lessons.map((lesson) => {
                    const Icon = iconForType(lesson.type);
                    return (
                      <li key={lesson.id}>
                        <Link
                          to={`/lesson/${lesson.id}`}
                          className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-muted/50"
                        >
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="flex-1 text-foreground">{lesson.title}</span>
                          {lesson.duration && <span className="text-xs text-muted-foreground">{lesson.duration}</span>}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </li>
                    );
                  })}
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
