
import { Button } from "@/components/ui/button";

const CallToActionSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-background/0 z-0"></div>
      
      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <div className="glass-card rounded-3xl overflow-hidden shadow-xl border border-white/20">
          <div className="p-8 md:p-16">
            <div className="max-w-3xl mx-auto text-center">
              <div className="chip bg-accent/20 text-accent inline-block">
                Join The Movement
              </div>
              <h2 className="heading-lg mt-4">Ready to Transform Urban Mobility?</h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Our intelligent traffic system is ready for implementation in your city,
                bringing economic benefits and infrastructure improvements from day one.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="rounded-full bg-accent hover:bg-accent/90 text-white h-12 px-8">
                  Request a Demo
                </Button>
                <Button variant="outline" className="rounded-full h-12 px-8">
                  Download Technical Paper
                </Button>
              </div>
              
              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { number: "30%", label: "Less Congestion" },
                  { number: "$25B", label: "Economic Impact" },
                  { number: "17%", label: "Fewer Emissions" },
                  { number: "22%", label: "Faster Commutes" }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-accent">{stat.number}</div>
                    <div className="text-sm md:text-base text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
