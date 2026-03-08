import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  FileText, Video, BarChart3, ChevronLeft, Menu,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import PageTransition from "./PageTransition";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/admin" },
  { label: "Students", icon: Users, to: "/admin/students" },
  { label: "Teachers", icon: GraduationCap, to: "/admin/teachers" },
  { label: "Courses", icon: BookOpen, to: "/admin/courses" },
  { label: "Resources", icon: FileText, to: "/admin/resources" },
  { label: "Live Classes", icon: Video, to: "/admin/live-classes" },
  { label: "Analytics", icon: BarChart3, to: "/admin/analytics" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 h-screen flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 z-50",
          collapsed ? "md:w-16" : "md:w-64",
          mobileOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight">Admin</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 md:py-2.5 text-sm font-medium transition-colors touch-target",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 md:py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            {!collapsed && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-foreground">Admin</span>
        </div>
        <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
