import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

const Footer = () => (
  <footer className="border-t bg-card">
    <div className="container mx-auto px-4 py-12">
      <div className="grid gap-8 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Deen Academy</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Learn your Deen from Maktab to advanced Islamic studies in a modern, structured way.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Learn</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/courses" className="hover:text-primary transition-colors">All Courses</Link></li>
            <li><Link to="/courses" className="hover:text-primary transition-colors">Quran Reading</Link></li>
            <li><Link to="/courses" className="hover:text-primary transition-colors">Tajweed</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Platform</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
            <li><Link to="/profile" className="hover:text-primary transition-colors">Profile</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">About</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><span className="cursor-default">Contact Us</span></li>
            <li><span className="cursor-default">Privacy Policy</span></li>
          </ul>
        </div>
      </div>
      <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
        © 2026 Deen Academy. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
