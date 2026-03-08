import Layout from "@/components/Layout";
import CourseCard from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, Star, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Landing = () => {
  const { user } = useAuth();
  const { data: courses = [] } = useQuery({
    queryKey: ["courses-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*, modules(id)")
        .limit(3);
      if (error) throw error;
      return data || [];
    },
  });
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden islamic-pattern">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-card">
              <Star className="h-4 w-4 text-accent" />
              Begin your journey of Islamic knowledge
            </div>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl">
              Learn Your{" "}
              <span className="text-primary">Deen</span>{" "}
              the Modern Way
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              From Maktab basics to foundational Islamic studies — structured courses
              with Quran reading, Tajweed, Duas, and more.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button variant="hero" size="lg" asChild>
                <Link to="/signup">Start Learning Free</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/courses">Browse Courses</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats */}
      <section className="border-b bg-card">
        <div className="container mx-auto grid grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
          {[
            { icon: BookOpen, label: "Courses", value: "3+" },
            { icon: Users, label: "Students", value: "700+" },
            { icon: GraduationCap, label: "Lessons", value: "24+" },
            { icon: Star, label: "Rating", value: "4.9" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="mx-auto mb-2 h-6 w-6 text-accent" />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground">Featured Courses</h2>
            <p className="text-muted-foreground">Start with our most popular courses designed for all levels</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {seedCourses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                modules={course.modules.length}
                students={course.students}
                category={course.category}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-card py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-3xl font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to begin your learning journey</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "1", title: "Sign Up", desc: "Create your free account in seconds" },
              { step: "2", title: "Choose a Course", desc: "Pick from Quran reading, Tajweed, Duas, and more" },
              { step: "3", title: "Learn & Track", desc: "Complete lessons, take quizzes, earn certificates" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl gradient-primary px-6 py-12 text-center md:px-16">
            {user ? (
              <>
                <h2 className="mb-4 text-3xl font-bold text-primary-foreground">Continue Your Journey</h2>
                <p className="mb-6 text-primary-foreground/80">
                  Head to your dashboard to pick up where you left off.
                </p>
                <Button variant="accent" size="lg" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <h2 className="mb-4 text-3xl font-bold text-primary-foreground">Ready to Begin?</h2>
                <p className="mb-6 text-primary-foreground/80">
                  Join hundreds of students on their journey to understanding Islam.
                </p>
                <Button variant="accent" size="lg" asChild>
                  <Link to="/signup">Create Free Account</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Landing;
