import { Link } from "react-router-dom";
import { BookOpen, Clock, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  modules: number;
  students?: number;
  progress?: number;
  category?: string;
}

const CourseCard = ({ id, title, description, modules, students = 0, progress, category }: CourseCardProps) => (
  <Link
    to={`/courses/${id}`}
    className="group block rounded-xl border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
  >
    <div className="mb-3 flex items-center justify-between">
      <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        {category || "Islamic Studies"}
      </span>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15">
        <BookOpen className="h-5 w-5 text-accent" />
      </div>
    </div>
    <h3 className="mb-2 text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
      {title}
    </h3>
    <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{description}</p>
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" /> {modules} modules
      </span>
      {students > 0 && (
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {students} students
        </span>
      )}
    </div>
    {progress !== undefined && (
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium text-primary">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    )}
  </Link>
);

export default CourseCard;
