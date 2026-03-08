import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CreateCourse = () => (
  <Layout>
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Create New Course</h1>
      <form className="space-y-5 rounded-xl border bg-card p-6 shadow-card" onSubmit={(e) => e.preventDefault()}>
        <div>
          <Label htmlFor="title">Course Title</Label>
          <Input id="title" placeholder="e.g. Tajweed Basics" />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" placeholder="e.g. Quran Reading" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="Describe the course..." rows={4} />
        </div>
        <Button variant="hero" type="submit">Create Course</Button>
      </form>
    </div>
  </Layout>
);

export default CreateCourse;
