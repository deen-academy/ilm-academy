import Layout from "@/components/Layout";
import { Link } from "react-router-dom";
import { Users, BookOpen, GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => (
  <Layout>
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage courses, lessons, and students</p>
        </div>
        <Button variant="hero" asChild>
          <Link to="/admin/create-course"><Plus className="mr-2 h-4 w-4" /> New Course</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        {[
          { icon: BookOpen, label: "Total Courses", value: "3" },
          { icon: Users, label: "Total Students", value: "733" },
          { icon: GraduationCap, label: "Total Lessons", value: "24" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-card">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15">
              <stat.icon className="h-6 w-6 text-accent" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild><Link to="/admin/create-course">Create Course</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/upload-lesson">Upload Lesson</Link></Button>
          <Button variant="outline" asChild><Link to="/courses">View Courses</Link></Button>
        </div>
      </div>
    </div>
  </Layout>
);

export default AdminDashboard;
