
import NavBar from "@/components/NavBar";
import HeroSection from "@/components/HeroSection";
import OverviewSection from "@/components/OverviewSection";
import BenefitsSection from "@/components/BenefitsSection";
import TechnologySection from "@/components/TechnologySection";
import ImpactSection from "@/components/ImpactSection";
import CallToActionSection from "@/components/CallToActionSection";
import Footer from "@/components/Footer";
import SimulationSection from "@/components/SimulationSection";
import { useEffect } from "react";

const Index = () => {
  // Add smooth scrolling for hash links
  useEffect(() => {
    const handleHashLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === 'A' && target.hash && target.hash.startsWith('#')) {
        e.preventDefault();
        const element = document.querySelector(target.hash);
        if (element) {
          window.scrollTo({
            top: element.getBoundingClientRect().top + window.scrollY - 80,
            behavior: 'smooth'
          });
          // Update URL without reload
          history.pushState(null, '', target.hash);
        }
      }
    };

    document.addEventListener('click', handleHashLinkClick);
    return () => document.removeEventListener('click', handleHashLinkClick);
  }, []);

  // Add scroll animations using Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('appear');
        }
      });
    }, { threshold: 0.1 });

    // Observe all elements with animation classes
    const animatedElements = document.querySelectorAll(
      '.fade-in-up, .fade-in-left, .fade-in-right, .fade-in, .scale-in'
    );
    
    animatedElements.forEach(el => observer.observe(el));

    return () => {
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <NavBar />
      <main>
        <HeroSection />
        <OverviewSection />
        <SimulationSection />
        <BenefitsSection />
        <TechnologySection />
        <ImpactSection />
        <CallToActionSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
