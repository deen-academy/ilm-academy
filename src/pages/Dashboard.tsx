import Layout from "@/components/Layout";
import CourseCard from "@/components/CourseCard";
import { seedCourses } from "@/data/courses";
import { Award, BookOpen, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  // Mock enrolled courses with progress
  const enrolled = seedCourses.slice(0, 2).map((c, i) => ({
    ...c,
    progress: i === 0 ? 45 : 20,
  }));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Assalamu Alaikum 👋</h1>
          <p className="mt-1 text-muted-foreground">Continue your learning journey</p>
        </div>

        {/* Stats row */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: BookOpen, label: "Enrolled Courses", value: "2", color: "text-primary" },
            { icon: TrendingUp, label: "Lessons Completed", value: "5", color: "text-accent" },
            { icon: Award, label: "Certificates", value: "0", color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Learning */}
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Continue Learning</h2>
          {enrolled.length > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{enrolled[0].title}</h3>
                  <p className="text-sm text-muted-foreground">{enrolled[0].category}</p>
                </div>
                <span className="text-sm font-medium text-primary">{enrolled[0].progress}%</span>
              </div>
              <Progress value={enrolled[0].progress} className="mt-3 h-2" />
            </div>
          )}
        </div>

        {/* Enrolled Courses */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">My Courses</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrolled.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                modules={course.modules.length}
                students={course.students}
                progress={course.progress}
                category={course.category}
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
