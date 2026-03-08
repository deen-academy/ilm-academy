import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, LayoutDashboard, User, GraduationCap, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const location = useLocation();
  const { user, roles } = useAuth();

  const isAdmin = roles.includes("admin");
  const isTeacher = roles.includes("teacher");

  // Build nav items based on auth state and role
  const navItems = user
    ? [
        { icon: Home, label: "Home", to: "/" },
        { icon: BookOpen, label: "Courses", to: "/courses" },
        { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
        ...(isTeacher ? [{ icon: GraduationCap, label: "Teach", to: "/teacher" }] : []),
        ...(isAdmin ? [{ icon: Settings, label: "Admin", to: "/admin" }] : []),
        { icon: User, label: "Profile", to: "/profile" },
      ]
    : [
        { icon: Home, label: "Home", to: "/" },
        { icon: BookOpen, label: "Courses", to: "/courses" },
        { icon: User, label: "Log In", to: "/login" },
      ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-lg md:hidden safe-area-bottom">
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 pt-2.5 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-primary")} />
              <span>{item.label}</span>
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
