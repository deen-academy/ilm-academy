import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import PageTransition from "./PageTransition";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  hideBottomNav?: boolean;
}

const Layout = ({ children, showFooter = true, hideBottomNav = false }: LayoutProps) => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1 pb-16 md:pb-0">
      <PageTransition>{children}</PageTransition>
    </main>
    {showFooter && <Footer />}
    {!hideBottomNav && <BottomNav />}
  </div>
);

export default Layout;
