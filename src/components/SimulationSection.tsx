
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Vehicle = {
  id: string;
  type: 'car' | 'truck' | 'bus';
  color: string;
  direction: 'north' | 'south' | 'east' | 'west';
  position: { x: number; y: number };
  speed: number;
  waiting: boolean;
  created: number;
};

type TrafficLight = {
  direction: 'ns' | 'ew';
  state: 'red' | 'yellow' | 'green';
  duration: number;
  timeLeft: number;
};

const SimulationSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isRunning, setIsRunning] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trafficLights, setTrafficLights] = useState<TrafficLight[]>([
    { direction: 'ns', state: 'green', duration: 20, timeLeft: 20 },
    { direction: 'ew', state: 'red', duration: 20, timeLeft: 0 }
  ]);
  const [density, setDensity] = useState(40);
  const [optimizationEnabled, setOptimizationEnabled] = useState(false);
  const [algorithmType, setAlgorithmType] = useState('adaptive');
  const [stats, setStats] = useState({
    averageWaitTime: 0,
    throughput: 0,
    totalVehicles: 0,
    stoppedVehicles: 0
  });
  const lastFrameTime = useRef(Date.now());
  const vehicleCounter = useRef(0);
  const statsUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const waitTimes = useRef<number[]>([]);

  // Set up the canvas and start the simulation
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to fit container
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Set up the stats update interval
    statsUpdateInterval.current = setInterval(() => {
      const currentVehicles = vehicles.length;
      const stoppedCount = vehicles.filter(v => v.waiting).length;
      const recentWaitTimes = waitTimes.current.slice(-100);
      const avgWaitTime = recentWaitTimes.length > 0 
        ? recentWaitTimes.reduce((a, b) => a + b, 0) / recentWaitTimes.length 
        : 0;
      
      setStats({
        averageWaitTime: Math.round(avgWaitTime * 10) / 10,
        throughput: Math.round((vehicleCounter.current / 60) * 10) / 10,
        totalVehicles: currentVehicles,
        stoppedVehicles: stoppedCount
      });
    }, 1000);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (statsUpdateInterval.current) clearInterval(statsUpdateInterval.current);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Handle traffic light changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRunning) return;
      
      setTrafficLights(prev => {
        return prev.map(light => {
          let newTimeLeft = light.timeLeft - 1;
          let newState = light.state;
          
          if (newTimeLeft <= 0) {
            // Determine new state
            if (light.state === 'green') {
              newState = 'yellow';
              newTimeLeft = 3; // Yellow duration is fixed
            } else if (light.state === 'yellow') {
              newState = 'red';
              // Calculate duration based on optimization
              if (optimizationEnabled) {
                const stoppedInDirection = vehicles.filter(v => 
                  (light.direction === 'ns' && (v.direction === 'north' || v.direction === 'south') && v.waiting) ||
                  (light.direction === 'ew' && (v.direction === 'east' || v.direction === 'west') && v.waiting)
                ).length;
                
                const otherLight = prev.find(l => l.direction !== light.direction)!;
                const stoppedInOtherDirection = vehicles.filter(v => 
                  (otherLight.direction === 'ns' && (v.direction === 'north' || v.direction === 'south') && v.waiting) ||
                  (otherLight.direction === 'ew' && (v.direction === 'east' || v.direction === 'west') && v.waiting)
                ).length;
                
                // Adjust duration based on traffic
                let baseDuration = 20;
                if (algorithmType === 'adaptive') {
                  if (stoppedInOtherDirection > stoppedInDirection * 1.5) {
                    baseDuration = Math.min(30, Math.max(10, Math.round(stoppedInOtherDirection * 1.5)));
                  } else {
                    baseDuration = 15;
                  }
                } else if (algorithmType === 'predictive') {
                  // More sophisticated algorithm that accounts for approaching vehicles too
                  const approachingVehicles = vehicles.filter(v => 
                    (otherLight.direction === 'ns' && (v.direction === 'north' || v.direction === 'south') && !v.waiting) ||
                    (otherLight.direction === 'ew' && (v.direction === 'east' || v.direction === 'west') && !v.waiting)
                  ).length;
                  
                  baseDuration = Math.min(35, Math.max(12, Math.round((stoppedInOtherDirection * 1.2) + (approachingVehicles * 0.3))));
                } else {
                  // Fixed time algorithm
                  baseDuration = 20;
                }
                
                newTimeLeft = otherLight.state === 'red' ? baseDuration : otherLight.timeLeft + baseDuration;
              } else {
                newTimeLeft = 20; // Fixed time if optimization is disabled
              }
            } else if (light.state === 'red') {
              // Check if we should change to green (only if the other light is turning to red)
              const otherLight = prev.find(l => l.direction !== light.direction)!;
              if (otherLight.state === 'yellow') {
                newState = 'green';
                newTimeLeft = light.duration;
              }
            }
          }
          
          return {
            ...light,
            state: newState,
            timeLeft: newTimeLeft
          };
        });
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, vehicles, optimizationEnabled, algorithmType]);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      if (!isRunning) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const now = Date.now();
      const deltaTime = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw intersection
      const center = { x: canvas.width / 2, y: canvas.height / 2 };
      const roadWidth = 50;
      
      // Draw roads
      ctx.fillStyle = '#333';
      // Horizontal road
      ctx.fillRect(0, center.y - roadWidth, canvas.width, roadWidth * 2);
      // Vertical road
      ctx.fillRect(center.x - roadWidth, 0, roadWidth * 2, canvas.height);
      
      // Draw road markings
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      
      // Horizontal divider
      ctx.beginPath();
      ctx.moveTo(0, center.y);
      ctx.lineTo(center.x - roadWidth, center.y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(center.x + roadWidth, center.y);
      ctx.lineTo(canvas.width, center.y);
      ctx.stroke();
      
      // Vertical divider
      ctx.beginPath();
      ctx.moveTo(center.x, 0);
      ctx.lineTo(center.x, center.y - roadWidth);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(center.x, center.y + roadWidth);
      ctx.lineTo(center.x, canvas.height);
      ctx.stroke();
      
      // Draw traffic lights
      const lightSize = 10;
      const nsLight = trafficLights.find(l => l.direction === 'ns')!;
      const ewLight = trafficLights.find(l => l.direction === 'ew')!;
      
      // North light
      ctx.fillStyle = nsLight.state === 'red' ? 'red' : '#440000';
      ctx.fillRect(center.x + roadWidth + 5, center.y - roadWidth - lightSize - 5, lightSize, lightSize);
      ctx.fillStyle = nsLight.state === 'yellow' ? 'yellow' : '#444400';
      ctx.fillRect(center.x + roadWidth + 5, center.y - roadWidth - 2 * lightSize - 10, lightSize, lightSize);
      ctx.fillStyle = nsLight.state === 'green' ? 'green' : '#004400';
      ctx.fillRect(center.x + roadWidth + 5, center.y - roadWidth - 3 * lightSize - 15, lightSize, lightSize);
      
      // South light
      ctx.fillStyle = nsLight.state === 'red' ? 'red' : '#440000';
      ctx.fillRect(center.x - roadWidth - lightSize - 5, center.y + roadWidth + 5, lightSize, lightSize);
      ctx.fillStyle = nsLight.state === 'yellow' ? 'yellow' : '#444400';
      ctx.fillRect(center.x - roadWidth - lightSize - 5, center.y + roadWidth + lightSize + 10, lightSize, lightSize);
      ctx.fillStyle = nsLight.state === 'green' ? 'green' : '#004400';
      ctx.fillRect(center.x - roadWidth - lightSize - 5, center.y + roadWidth + 2 * lightSize + 15, lightSize, lightSize);
      
      // East light
      ctx.fillStyle = ewLight.state === 'red' ? 'red' : '#440000';
      ctx.fillRect(center.x + roadWidth + 5, center.y + roadWidth + 5, lightSize, lightSize);
      ctx.fillStyle = ewLight.state === 'yellow' ? 'yellow' : '#444400';
      ctx.fillRect(center.x + roadWidth + lightSize + 10, center.y + roadWidth + 5, lightSize, lightSize);
      ctx.fillStyle = ewLight.state === 'green' ? 'green' : '#004400';
      ctx.fillRect(center.x + roadWidth + 2 * lightSize + 15, center.y + roadWidth + 5, lightSize, lightSize);
      
      // West light
      ctx.fillStyle = ewLight.state === 'red' ? 'red' : '#440000';
      ctx.fillRect(center.x - roadWidth - lightSize - 5, center.y - roadWidth - lightSize - 5, lightSize, lightSize);
      ctx.fillStyle = ewLight.state === 'yellow' ? 'yellow' : '#444400';
      ctx.fillRect(center.x - roadWidth - 2 * lightSize - 10, center.y - roadWidth - lightSize - 5, lightSize, lightSize);
      ctx.fillStyle = ewLight.state === 'green' ? 'green' : '#004400';
      ctx.fillRect(center.x - roadWidth - 3 * lightSize - 15, center.y - roadWidth - lightSize - 5, lightSize, lightSize);
      
      // Create new vehicles randomly based on density
      if (Math.random() * 100 < density * deltaTime) {
        const direction = ['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)] as 'north' | 'south' | 'east' | 'west';
        const vehicleType = Math.random() > 0.8 
          ? (Math.random() > 0.5 ? 'truck' : 'bus') 
          : 'car';
        const vehicleColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];
        
        let position = { x: 0, y: 0 };
        
        switch (direction) {
          case 'north':
            position = { x: center.x + (Math.random() * roadWidth) - roadWidth / 2, y: canvas.height + 20 };
            break;
          case 'south':
            position = { x: center.x - (Math.random() * roadWidth) + roadWidth / 2, y: -20 };
            break;
          case 'east':
            position = { x: -20, y: center.y - (Math.random() * roadWidth) + roadWidth / 2 };
            break;
          case 'west':
            position = { x: canvas.width + 20, y: center.y + (Math.random() * roadWidth) - roadWidth / 2 };
            break;
        }
        
        setVehicles(prev => [...prev, {
          id: `vehicle-${vehicleCounter.current++}`,
          type: vehicleType,
          color: vehicleColors[Math.floor(Math.random() * vehicleColors.length)],
          direction,
          position,
          speed: 40 + Math.random() * 20,
          waiting: false,
          created: Date.now()
        }]);
      }
      
      // Update and draw vehicles
      setVehicles(prev => {
        return prev.map(vehicle => {
          let { position, speed, waiting, direction } = vehicle;
          const vehicleLength = vehicle.type === 'car' ? 15 : vehicle.type === 'truck' ? 25 : 30;
          const vehicleWidth = vehicle.type === 'car' ? 10 : 12;
          
          // Check if vehicle should stop at traffic light
          const canPass = (
            (direction === 'north' || direction === 'south') && nsLight.state === 'green' ||
            (direction === 'east' || direction === 'west') && ewLight.state === 'green'
          );
          
          // Check if vehicle is approaching the intersection
          const approachingIntersection = (
            (direction === 'north' && position.y > center.y + roadWidth && position.y < center.y + roadWidth + 100) ||
            (direction === 'south' && position.y < center.y - roadWidth && position.y > center.y - roadWidth - 100) ||
            (direction === 'east' && position.x < center.x - roadWidth && position.x > center.x - roadWidth - 100) ||
            (direction === 'west' && position.x > center.x + roadWidth && position.x < center.x + roadWidth + 100)
          );
          
          // Check if vehicle is in the intersection
          const inIntersection = (
            position.x > center.x - roadWidth && position.x < center.x + roadWidth &&
            position.y > center.y - roadWidth && position.y < center.y + roadWidth
          );
          
          // Check for collision with other vehicles
          const vehicleAhead = prev.find(other => {
            if (other.id === vehicle.id || other.direction !== vehicle.direction) return false;
            
            const distance = direction === 'north' || direction === 'south'
              ? Math.abs(other.position.y - position.y)
              : Math.abs(other.position.x - position.x);
              
            const otherIsAhead = (
              (direction === 'north' && other.position.y < position.y) ||
              (direction === 'south' && other.position.y > position.y) ||
              (direction === 'east' && other.position.x > position.x) ||
              (direction === 'west' && other.position.x < position.x)
            );
            
            return otherIsAhead && distance < vehicleLength * 2;
          });
          
          // Update vehicle waiting state
          if (!canPass && approachingIntersection && !inIntersection) {
            waiting = true;
            speed = 0;
            // Record wait start time if this is the first time waiting
            if (!vehicle.waiting) {
              waitTimes.current.push(0);
            }
          } else if (vehicleAhead) {
            waiting = true;
            speed = 0;
          } else {
            if (waiting) {
              // Record wait time when the vehicle starts moving again
              const waitTime = (Date.now() - vehicle.created) / 1000;
              if (waitTime > 0.5) { // Ignore very short stops
                waitTimes.current[waitTimes.current.length - 1] = waitTime;
              } else {
                waitTimes.current.pop(); // Remove the last entry if wait was too short
              }
            }
            waiting = false;
            speed = 40 + Math.random() * 20;
          }
          
          // Update position
          if (!waiting) {
            switch (direction) {
              case 'north':
                position.y -= speed * deltaTime;
                break;
              case 'south':
                position.y += speed * deltaTime;
                break;
              case 'east':
                position.x += speed * deltaTime;
                break;
              case 'west':
                position.x -= speed * deltaTime;
                break;
            }
          }
          
          // Draw vehicle
          ctx.save();
          ctx.translate(position.x, position.y);
          
          if (direction === 'north') {
            ctx.rotate(Math.PI);
          } else if (direction === 'east') {
            ctx.rotate(Math.PI * 0.5);
          } else if (direction === 'west') {
            ctx.rotate(Math.PI * 1.5);
          }
          
          ctx.fillStyle = vehicle.color;
          
          // Car body
          ctx.fillRect(-vehicleWidth / 2, -vehicleLength / 2, vehicleWidth, vehicleLength);
          
          // Windows
          ctx.fillStyle = '#1a1a1a';
          if (vehicle.type === 'car') {
            ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 3, vehicleWidth - 2, 3);
            ctx.fillRect(-vehicleWidth / 2 + 1, vehicleLength / 2 - 6, vehicleWidth - 2, 3);
          } else if (vehicle.type === 'truck') {
            ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 3, vehicleWidth - 2, 5);
          } else {
            // Bus windows
            for (let i = 0; i < 4; i++) {
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 5 + i * 5, vehicleWidth - 2, 3);
            }
          }
          
          ctx.restore();
          
          // Remove vehicles that have left the canvas
          const outOfBounds = (
            position.x < -50 || position.x > canvas.width + 50 ||
            position.y < -50 || position.y > canvas.height + 50
          );
          
          return outOfBounds ? null : { ...vehicle, position, speed, waiting };
        }).filter(Boolean) as Vehicle[];
      });
      
      // Draw traffic light timers
      ctx.font = '12px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(`NS: ${nsLight.timeLeft}s`, center.x - roadWidth - 30, center.y);
      ctx.fillText(`EW: ${ewLight.timeLeft}s`, center.x, center.y - roadWidth - 10);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, optimizationEnabled]);
  
  return (
    <section id="simulation" className="section-container">
      <div className="space-y-6 text-center mb-10">
        <div className="chip bg-accent/10 text-accent inline-block">
          Interactive Simulation
        </div>
        <h2 className="heading-lg">See Our AI Traffic Optimization In Action</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This interactive 3D traffic simulation demonstrates how our AI-powered traffic management system optimizes traffic 
          flow at intersections. Try adjusting the parameters to see the difference in wait times and throughput.
        </p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 p-6">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black/90 border border-white/10">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full"
              />
              
              <div className="absolute top-4 left-4 flex gap-2">
                <Button 
                  size="sm" 
                  variant={isRunning ? "default" : "outline"}
                  onClick={() => setIsRunning(!isRunning)}
                  className="h-8 rounded-full"
                >
                  {isRunning ? "Pause" : "Resume"}
                </Button>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 text-sm flex justify-between">
                <div>Vehicles: {stats.totalVehicles} (Stopped: {stats.stoppedVehicles})</div>
                <div>Avg Wait: {stats.averageWaitTime}s</div>
                <div>Throughput: {stats.throughput}/min</div>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Traffic Controls</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="density">Traffic Density</Label>
                    <span className="text-sm text-muted-foreground">{density}%</span>
                  </div>
                  <Slider 
                    id="density"
                    value={[density]} 
                    min={5} 
                    max={100} 
                    step={5} 
                    onValueChange={value => setDensity(value[0])}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="optimize" 
                    checked={optimizationEnabled}
                    onCheckedChange={setOptimizationEnabled}
                  />
                  <Label htmlFor="optimize">Enable AI Optimization</Label>
                </div>
                
                <Tabs value={algorithmType} onValueChange={setAlgorithmType} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="fixed">Fixed Time</TabsTrigger>
                    <TabsTrigger value="adaptive">Adaptive</TabsTrigger>
                    <TabsTrigger value="predictive">Predictive</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fixed">
                    <div className="p-4 border rounded-lg mt-2">
                      <h4 className="font-medium">Fixed-Time Algorithm</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Traditional traffic lights with fixed timing regardless of traffic flow.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="adaptive">
                    <div className="p-4 border rounded-lg mt-2">
                      <h4 className="font-medium">Adaptive Algorithm</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Adjusts light timing based on current traffic volume at the intersection.
                      </p>
                    </div>
                  </TabsContent>
                  <TabsContent value="predictive">
                    <div className="p-4 border rounded-lg mt-2">
                      <h4 className="font-medium">Predictive AI Algorithm</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Advanced AI that predicts upcoming traffic flow patterns and adjusts proactively.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="space-y-4 pt-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">Performance Metrics</span>
                    <span className="text-xs text-muted-foreground">Live Data</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Avg Wait Time</div>
                      <div className="text-2xl font-semibold text-accent">{stats.averageWaitTime}s</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Throughput</div>
                      <div className="text-2xl font-semibold text-accent">{stats.throughput}/min</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium">Efficiency Improvement</div>
                    <div className="w-full h-3 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ 
                          width: `${optimizationEnabled ? 
                            (algorithmType === 'predictive' ? 75 : algorithmType === 'adaptive' ? 45 : 10) 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-right mt-1 text-muted-foreground">
                      {optimizationEnabled ? 
                        (algorithmType === 'predictive' ? 'Up to 75% improvement' : 
                         algorithmType === 'adaptive' ? 'Up to 45% improvement' : 
                         'Up to 10% improvement') 
                        : 'No optimization applied'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Our AI-powered traffic management system has been shown to reduce average wait times by up to 75% 
          and increase intersection throughput by up to 30%, leading to significant reductions in emissions 
          and fuel consumption.
        </p>
        <Button className="mt-6 rounded-full bg-accent hover:bg-accent/90 text-white px-8 py-6">
          See Full Technical Report
        </Button>
      </div>
    </section>
  );
};

export default SimulationSection;
