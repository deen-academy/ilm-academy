import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const UploadLesson = () => (
  <Layout>
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold text-foreground">Upload Lesson</h1>
      <form className="space-y-5 rounded-xl border bg-card p-6 shadow-card" onSubmit={(e) => e.preventDefault()}>
        <div>
          <Label htmlFor="title">Lesson Title</Label>
          <Input id="title" placeholder="e.g. Alif to Thaa" />
        </div>
        <div>
          <Label htmlFor="type">Lesson Type</Label>
          <Input id="type" placeholder="video, audio, or text" />
        </div>
        <div>
          <Label htmlFor="duration">Duration</Label>
          <Input id="duration" placeholder="e.g. 12 min" />
        </div>
        <div>
          <Label htmlFor="content">Lesson Content / Notes</Label>
          <Textarea id="content" placeholder="Write lesson explanation..." rows={4} />
        </div>
        <Button variant="hero" type="submit">Upload Lesson</Button>
      </form>
    </div>
  </Layout>
);

export default UploadLesson;
