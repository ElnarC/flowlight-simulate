
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const TechnologyItem = ({ 
  title, 
  description, 
  index 
}: { 
  title: string; 
  description: string; 
  index: number 
}) => (
  <div className={cn(
    "flex gap-6 relative",
    "animate-slide-in [animation-delay:var(--delay)]"
  )} style={{ '--delay': `${index * 100}ms` } as React.CSSProperties}>
    <div className="flex-shrink-0">
      <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center font-semibold">
        {index + 1}
      </div>
      {index !== 3 && <div className="h-full w-px bg-border ml-5 my-2"></div>}
    </div>
    <div className="pb-8">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2">{description}</p>
    </div>
  </div>
);

const TechnologySection = () => {
  const technologies = [
    {
      title: "3D Simulation Engine",
      description: "High-fidelity physics-based simulation that accurately models real-world traffic behavior, vehicle dynamics, and pedestrian movement."
    },
    {
      title: "AI & Machine Learning",
      description: "Advanced algorithms that analyze traffic patterns and adapt signal timing to optimize flow, with reinforcement learning that improves over time."
    },
    {
      title: "Real-time Data Processing",
      description: "Edge computing infrastructure that processes sensor data from cameras and IoT devices to make split-second timing adjustments."
    },
    {
      title: "Digital Twin Technology",
      description: "Virtual representations of real intersections allowing for testing and optimization without disrupting actual traffic."
    },
  ];

  return (
    <section id="technology" className="section-container">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="glass-card rounded-2xl overflow-hidden p-6 relative z-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-accent/5 to-transparent opacity-80"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/5">
                <div className="w-full h-full relative bg-[#1E1E1E] rounded-lg overflow-hidden">
                  {/* Code editor simulation */}
                  <div className="p-4 font-mono text-sm text-white/90 overflow-hidden">
                    <div className="opacity-70">// AI Traffic Optimization Algorithm</div>
                    <div className="mt-2">
                      <span className="text-blue-400">function</span> <span className="text-yellow-300">optimizeTrafficFlow</span>(
                      <span className="text-orange-300">intersection</span>,
                      <span className="text-orange-300">trafficData</span>) {'{'}
                    </div>
                    <div className="pl-6 mt-1">
                      <span className="text-purple-400">const</span> vehicleDensity = <span className="text-yellow-300">calculateDensity</span>(trafficData);
                    </div>
                    <div className="pl-6">
                      <span className="text-purple-400">const</span> waitTimes = <span className="text-yellow-300">analyzeWaitTimes</span>(trafficData);
                    </div>
                    <div className="pl-6">
                      <span className="text-purple-400">const</span> predictedFlow = <span className="text-yellow-300">applyModel</span>(vehicleDensity, waitTimes);
                    </div>
                    <div className="pl-6 mt-1">
                      <span className="text-green-400">// Adjust signal timing</span>
                    </div>
                    <div className="pl-6">
                      <span className="text-purple-400">let</span> signalTiming = <span className="text-yellow-300">computeOptimalTiming</span>(predictedFlow);
                    </div>
                    <div className="pl-6 mt-1">
                      <span className="text-blue-400">return</span> {'{'}
                    </div>
                    <div className="pl-12">
                      northSouth: signalTiming.ns,
                    </div>
                    <div className="pl-12">
                      eastWest: signalTiming.ew,
                    </div>
                    <div className="pl-12">
                      pedestrian: signalTiming.ped
                    </div>
                    <div className="pl-6">{'}'}</div>
                    <div>{'}'}</div>
                    
                    <div className="mt-4">
                      <span className="text-blue-400">class</span> <span className="text-green-300">TrafficSimulation</span> {'{'}
                    </div>
                    <div className="pl-6">
                      <span className="text-blue-400">constructor</span>() {'{'}
                    </div>
                    <div className="pl-12">
                      <span className="text-purple-400">this</span>.physics = <span className="text-blue-400">new</span> <span className="text-green-300">PhysicsEngine</span>();
                    </div>
                    <div className="pl-12">
                      <span className="text-purple-400">this</span>.renderer = <span className="text-blue-400">new</span> <span className="text-green-300">Renderer3D</span>();
                    </div>
                    <div className="pl-6">{'}'}</div>
                    <div>{'}'}</div>
                  </div>
                  
                  {/* Cursor animation */}
                  <div className="absolute h-5 w-2 bg-white/70 animate-pulse-light" style={{ top: '250px', left: '100px' }}></div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1 rounded-lg bg-white/10 p-4">
                  <div className="text-sm font-semibold">Optimization</div>
                  <div className="mt-1 text-3xl font-semibold text-accent">85%</div>
                  <div className="mt-2 text-xs text-muted-foreground">Traffic flow improvement</div>
                </div>
                <div className="flex-1 rounded-lg bg-white/10 p-4">
                  <div className="text-sm font-semibold">Processing</div>
                  <div className="mt-1 text-3xl font-semibold text-accent">50ms</div>
                  <div className="mt-2 text-xs text-muted-foreground">Average response time</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute -top-8 -left-8 w-40 h-40 rounded-full bg-accent/10 blur-3xl -z-10"></div>
          <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-primary/10 blur-3xl -z-10"></div>
        </div>
        
        <div>
          <div className="chip bg-secondary text-primary inline-block">
            Core Technology
          </div>
          <h2 className="heading-lg mt-4">Advanced Technologies Powering Our Solution</h2>
          <p className="text-muted-foreground mt-4">
            Our platform combines cutting-edge simulation technology with artificial intelligence
            to create a revolutionary approach to traffic management. The system constantly learns
            and improves, creating increasingly efficient traffic patterns.
          </p>
          
          <div className="mt-10 space-y-0">
            {technologies.map((tech, index) => (
              <TechnologyItem 
                key={index}
                title={tech.title}
                description={tech.description}
                index={index}
              />
            ))}
          </div>
          
          <Button className="mt-6 rounded-full bg-accent hover:bg-accent/90 text-white">
            Explore Technical Specs
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
