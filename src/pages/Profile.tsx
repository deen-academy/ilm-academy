import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

const Profile = () => {
  const { user, profile } = useAuth();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile]);

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", user?.id],
    queryFn: async () => {
      const [enrollRes, progressRes] = await Promise.all([
        supabase.from("enrollments").select("id", { count: "exact" }).eq("user_id", user!.id),
        supabase.from("lesson_progress").select("id", { count: "exact" }).eq("user_id", user!.id).eq("completed", true),
      ]);
      return {
        enrolled: enrollRes.count || 0,
        completed: progressRes.count || 0,
      };
    },
    enabled: !!user,
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
    setSaving(false);
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Please log in</h1>
          <Button variant="hero" className="mt-4" asChild>
            <Link to="/login">Log In</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-2xl px-4 py-10">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Profile</h1>

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{profile?.name || "Student"}</h2>
            <p className="text-sm text-muted-foreground">{profile?.email || user.email}</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile?.email || user.email || ""} disabled />
          </div>
          <Button variant="hero" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="mt-8 rounded-xl border bg-card p-6 shadow-card">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
            <BookOpen className="h-5 w-5 text-primary" /> Learning Stats
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">{stats?.enrolled ?? 0}</div>
              <div className="text-sm text-muted-foreground">Courses Enrolled</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats?.completed ?? 0}</div>
              <div className="text-sm text-muted-foreground">Lessons Done</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
