import Layout from "@/components/Layout";
import CourseCard from "@/components/CourseCard";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Courses = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data: coursesData, error } = await supabase
        .from("courses")
        .select("*, modules(id, title, order_number, lessons(id))");
      if (error) throw error;
      return coursesData || [];
    },
  });

  const categories = ["All", ...new Set(courses.map((c) => c.category).filter(Boolean))];

  const filtered = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || c.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Courses</h1>
          <p className="text-muted-foreground">Explore our Islamic learning courses</p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-muted-foreground">Loading courses...</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description || ""}
                modules={(course.modules as any[])?.length || 0}
                category={course.category || undefined}
              />
            ))}
          </div>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">No courses found.</p>
        )}
      </div>
    </Layout>
  );
};

export default Courses;
