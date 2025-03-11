
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
      scrolled ? "glass-nav py-4" : "bg-transparent py-6"
    )}>
      <div className="container max-w-6xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
              <circle cx="7" cy="17" r="2"></circle>
              <path d="M9 17h6"></path>
              <circle cx="17" cy="17" r="2"></circle>
            </svg>
          </div>
          <span className="text-xl font-semibold">FlowTraffic</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#overview" className="text-sm font-medium hover:text-accent transition-colors">Overview</a>
          <a href="#benefits" className="text-sm font-medium hover:text-accent transition-colors">Benefits</a>
          <a href="#technology" className="text-sm font-medium hover:text-accent transition-colors">Technology</a>
          <a href="#impact" className="text-sm font-medium hover:text-accent transition-colors">Impact</a>
        </nav>
        
        <Button className="bg-accent hover:bg-accent/90 text-white rounded-full">
          Demo
        </Button>
      </div>
    </header>
  );
};

export default NavBar;
