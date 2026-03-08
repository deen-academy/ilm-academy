import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, BookOpen } from "lucide-react";

const Profile = () => (
  <Layout>
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Profile</h1>

      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
          <User className="h-8 w-8 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Student</h2>
          <p className="text-sm text-muted-foreground">student@deenacademy.com</p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-card space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" defaultValue="Student" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue="student@deenacademy.com" disabled />
        </div>
        <Button variant="hero">Save Changes</Button>
      </div>

      <div className="mt-8 rounded-xl border bg-card p-6 shadow-card">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-foreground">
          <BookOpen className="h-5 w-5 text-primary" /> Learning Stats
        </h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-foreground">2</div>
            <div className="text-sm text-muted-foreground">Courses Enrolled</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">5</div>
            <div className="text-sm text-muted-foreground">Lessons Done</div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
);

export default Profile;
