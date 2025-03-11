
import { Card, CardContent } from "@/components/ui/card";

const ImpactSection = () => {
  return (
    <section id="impact" className="section-container">
      <div className="text-center mb-16 max-w-3xl mx-auto">
        <div className="chip bg-secondary text-primary inline-block">
          Economic & Infrastructure Impact
        </div>
        <h2 className="heading-lg mt-4">Measurable Benefits to Society</h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Our solution delivers quantifiable economic and infrastructure improvements,
          creating smarter cities that work better for everyone.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="glass-card border-0 shadow-lg overflow-hidden animate-slide-in" style={{ animationDelay: '100ms' }}>
          <div className="h-2 bg-green-500"></div>
          <CardContent className="p-6">
            <h3 className="text-2xl font-semibold">Economic Growth</h3>
            <div className="mt-6 space-y-6">
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Productivity Gains</span>
                  <span className="text-green-500">$15.2B / year</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Nationwide estimated economic impact from reduced commute times</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Fuel Cost Savings</span>
                  <span className="text-green-500">$6.7B / year</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Reduction in fuel consumption costs due to less idling and smoother traffic flow</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Vehicle Maintenance</span>
                  <span className="text-green-500">$3.4B / year</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Reduced wear and tear on vehicles from stop-and-go traffic</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Job Creation</span>
                  <span className="text-green-500">42,000+ jobs</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">New positions in system deployment, maintenance, and data analysis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-0 shadow-lg overflow-hidden animate-slide-in" style={{ animationDelay: '200ms' }}>
          <div className="h-2 bg-blue-500"></div>
          <CardContent className="p-6">
            <h3 className="text-2xl font-semibold">Infrastructure Benefits</h3>
            <div className="mt-6 space-y-6">
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Intersection Capacity</span>
                  <span className="text-blue-500">+30%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Increased throughput at intersections without physical expansion</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Infrastructure Lifespan</span>
                  <span className="text-blue-500">+15-20%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Extended life of roads and bridges due to optimized traffic patterns</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Deployment Cost</span>
                  <span className="text-blue-500">-70%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Lower cost compared to traditional intersection expansion projects</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Integration</span>
                  <span className="text-blue-500">95% compatible</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Works with existing traffic management systems in most cities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-0 shadow-lg overflow-hidden animate-slide-in" style={{ animationDelay: '300ms' }}>
          <div className="h-2 bg-purple-500"></div>
          <CardContent className="p-6">
            <h3 className="text-2xl font-semibold">Social Impact</h3>
            <div className="mt-6 space-y-6">
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Commute Time</span>
                  <span className="text-purple-500">-22%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Average reduction in commute times across implemented areas</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Emissions Reduction</span>
                  <span className="text-purple-500">-17%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Decreased carbon emissions from vehicles due to improved traffic flow</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Road Safety</span>
                  <span className="text-purple-500">-15%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Reduction in accidents at intersections with our system</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm font-medium">
                  <span>Quality of Life</span>
                  <span className="text-purple-500">+18%</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Improvement in quality of life survey scores for commuters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ImpactSection;
