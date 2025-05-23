
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const OverviewSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target === textRef.current) {
            textRef.current.querySelectorAll('.animate-on-scroll').forEach((el, index) => {
              setTimeout(() => {
                el.classList.add('appear');
              }, index * 150);
            });
          }
          if (entry.target === videoRef.current) {
            videoRef.current.classList.add('appear');
          }
        }
      });
    }, { threshold: 0.2 });

    if (textRef.current) observer.observe(textRef.current);
    if (videoRef.current) observer.observe(videoRef.current);

    return () => {
      if (textRef.current) observer.unobserve(textRef.current);
      if (videoRef.current) observer.unobserve(videoRef.current);
    };
  }, []);

  return (
    <section id="overview" ref={sectionRef} className="section-container">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div ref={textRef} className="space-y-6">
          <div className="chip bg-secondary text-primary inline-block animate-on-scroll fade-in-up">
            Project Overview
          </div>
          <h2 className="heading-lg animate-on-scroll fade-in-up">Intelligent Traffic Management System</h2>
          <p className="text-muted-foreground leading-relaxed animate-on-scroll fade-in-up">
            FlowTraffic is a revolutionary 3D traffic intersection simulation that leverages AI algorithms to optimize
            traffic flow in real-time. By dynamically adjusting traffic light timing based on current conditions, 
            we're creating smarter infrastructure that reduces congestion, lowers emissions, and improves economic productivity.
          </p>
          <ul className="space-y-3 pt-2">
            {[
              'Real-time 3D simulation with accurate physics',
              'AI-powered traffic light optimization algorithms',
              'Adaptive response to changing traffic patterns',
              'Data-driven insights for urban planning',
            ].map((item, index) => (
              <li key={index} className="flex items-start gap-3 animate-on-scroll fade-in-up">
                <div className="rounded-full p-1 bg-accent/10 text-accent mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Button className="rounded-full mt-4 bg-primary hover:bg-primary/90 animate-on-scroll fade-in-up">
            Watch the Simulation
          </Button>
        </div>
        
        <div ref={videoRef} className="relative fade-in-left">
          <div className="aspect-video rounded-2xl overflow-hidden bg-black/5 glass-card p-1">
            <div className="w-full h-full rounded-xl overflow-hidden relative">
              <video 
                className="w-full h-full object-cover"
                poster="https://images.unsplash.com/photo-1530850083578-b423109a5713?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80"
                controls
              >
                <source src="about:blank" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">Watch Demo</p>
                    <p className="text-white/70 text-sm">3:24</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-2xl bg-accent/20 backdrop-blur-md -z-10"></div>
          <div className="absolute -top-6 -left-6 w-32 h-32 rounded-full bg-primary/10 backdrop-blur-md -z-10"></div>
        </div>
      </div>
    </section>
  );
};

export default OverviewSection;
