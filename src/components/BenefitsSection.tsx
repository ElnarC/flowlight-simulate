
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BenefitCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  delay: number;
};

const BenefitCard = ({ title, description, icon, colorClass, delay }: BenefitCardProps) => (
  <Card className={cn(
    "glass-card transition-all duration-300 hover:shadow-lg border border-white/20 h-full",
    `animate-slide-in [animation-delay:${delay}ms]`
  )}>
    <CardContent className="p-6 flex flex-col gap-4">
      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", colorClass)}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const BenefitsSection = () => {
  const benefits = [
    {
      title: "Reduced Congestion",
      description: "Up to 30% improvement in traffic flow through intersections with AI-optimized signal timing.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M8 3H7a2 2 0 0 0-2 2v5h3V3Z"></path>
          <path d="M12 3h-1v7h3V5a2 2 0 0 0-2-2Z"></path>
          <path d="M17 3h-1v9h3V5a2 2 0 0 0-2-2Z"></path>
          <path d="M8 19h1V5H5v9a2 2 0 0 0 2 2h1Z"></path>
          <path d="M12 19h1v-5h-3v3a2 2 0 0 0 2 2Z"></path>
          <path d="M17 19h1v-7h-3v5a2 2 0 0 0 2 2Z"></path>
        </svg>
      ),
      colorClass: "bg-green-500",
      delay: 100
    },
    {
      title: "Economic Growth",
      description: "Reducing commute times adds productivity hours worth billions annually to the economy.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <line x1="12" y1="2" x2="12" y2="22"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      colorClass: "bg-blue-500",
      delay: 200
    },
    {
      title: "Emissions Reduction",
      description: "Less idling time means decreased carbon emissions, supporting sustainability goals.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M2 22 16 8"></path>
          <path d="M12.35 5.5A7 7 0 0 1 20 13.5"></path>
          <path d="M19.5 14a5 5 0 0 1-7 4.5"></path>
          <path d="M12 17a2.8 2.8 0 0 1-3.5-3"></path>
          <path d="M12 2a8.2 8.2 0 0 1 9 9"></path>
          <path d="M4.8 21A9.2 9.2 0 0 1 2 15"></path>
          <path d="M2 13a8.2 8.2 0 0 1 9-9"></path>
        </svg>
      ),
      colorClass: "bg-teal-500",
      delay: 300
    },
    {
      title: "Enhanced Safety",
      description: "Smart traffic management reduces accidents by 15-20% at high-risk intersections.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
        </svg>
      ),
      colorClass: "bg-purple-500",
      delay: 400
    },
    {
      title: "Fuel Efficiency",
      description: "Smoother traffic flow reduces fuel consumption by up to 20%, saving drivers money.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M7 19h10"></path>
          <path d="M7 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7Z"></path>
          <path d="M10 10H8a1 1 0 0 1-1-1V4"></path>
          <path d="M12 17h4a1 1 0 0 0 1-1v-5"></path>
        </svg>
      ),
      colorClass: "bg-orange-500",
      delay: 500
    },
    {
      title: "Data-Driven Planning",
      description: "Rich simulation data enables better urban infrastructure decisions and planning.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
          <path d="M3 3v18h18"></path>
          <path d="m19 9-5 5-4-4-3 3"></path>
        </svg>
      ),
      colorClass: "bg-indigo-500",
      delay: 600
    }
  ];

  return (
    <section id="benefits" className="section-container">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <div className="chip bg-secondary text-primary inline-block">
          Economic & Infrastructure Benefits
        </div>
        <h2 className="heading-lg mt-4">Transformative Impact on Cities</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Our AI-powered traffic optimization creates significant economic and infrastructural benefits,
          delivering measurable improvements to urban environments and communities.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => (
          <BenefitCard
            key={index}
            title={benefit.title}
            description={benefit.description}
            icon={benefit.icon}
            colorClass={benefit.colorClass}
            delay={benefit.delay}
          />
        ))}
      </div>
    </section>
  );
};

export default BenefitsSection;
