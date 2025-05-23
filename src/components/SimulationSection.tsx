import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define types for our simulation
type VehicleType = 'car' | 'truck' | 'bus';
type Direction = 'north' | 'south' | 'east' | 'west';
type LightState = 'red' | 'yellow' | 'green';
type LightDirection = 'ns' | 'ew';
type AlgorithmType = 'fixed' | 'adaptive' | 'predictive';

interface Vehicle {
  id: string;
  type: VehicleType;
  color: string;
  direction: Direction;
  position: { x: number; y: number };
  speed: number;
  waiting: boolean;
  created: number;
  lane: number;
}

interface TrafficLight {
  direction: LightDirection;
  state: LightState;
  duration: number;
  timeLeft: number;
}

interface SimulationStats {
  averageWaitTime: number;
  throughput: number;
  totalVehicles: number;
  stoppedVehicles: number;
}

const SimulationSection = () => {
  // Canvas and animation references
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);
  const canvasInitialized = useRef(false);
  
  // Simulation state
  const [isRunning, setIsRunning] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trafficLights, setTrafficLights] = useState<TrafficLight[]>([
    { direction: 'ns', state: 'green', duration: 20, timeLeft: 20 },
    { direction: 'ew', state: 'red', duration: 20, timeLeft: 20 }
  ]);
  const [density, setDensity] = useState(40);
  const [optimizationEnabled, setOptimizationEnabled] = useState(false);
  const [algorithmType, setAlgorithmType] = useState<AlgorithmType>('adaptive');
  const [stats, setStats] = useState<SimulationStats>({
    averageWaitTime: 0,
    throughput: 0,
    totalVehicles: 0,
    stoppedVehicles: 0
  });
  
  // Refs for tracking simulation metrics
  const vehicleIdCounter = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const lastLightUpdateTimeRef = useRef(Date.now());
  const waitTimesRef = useRef<number[]>([]);
  const throughputWindowRef = useRef<number[]>([]);
  const completedVehiclesRef = useRef(0);

  // Initialize canvas and set up resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initializeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        canvasInitialized.current = true;
      
      // Draw initial background
      drawBackground(ctx, canvas.width, canvas.height);
      
      // Display loading message
      ctx.font = '16px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('Simulation initializing...', canvas.width / 2, canvas.height / 2);
    };
    
    initializeCanvas();
    
    // Handle window resize
    const handleResize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      drawBackground(ctx, canvas.width, canvas.height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Set up stats update interval
    const statsInterval = setInterval(() => updateStats(), 1000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(statsInterval);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, []);
  
  // Update simulation statistics
  const updateStats = () => {
      const stoppedCount = vehicles.filter(v => v.waiting).length;
    
    // Calculate average wait time from recent wait times
    const recentWaitTimes = waitTimesRef.current.slice(-100);
      const avgWaitTime = recentWaitTimes.length > 0 
      ? recentWaitTimes.reduce((sum, time) => sum + time, 0) / recentWaitTimes.length 
        : 0;
      
    // Calculate throughput (vehicles per minute)
      const now = Date.now();
    const oneMinuteAgo = now - 60000;
    throughputWindowRef.current = throughputWindowRef.current.filter(time => time > oneMinuteAgo);
    const vehiclesPerMinute = throughputWindowRef.current.length;
      
      setStats({
        averageWaitTime: Math.round(avgWaitTime * 10) / 10,
        throughput: vehiclesPerMinute,
      totalVehicles: vehicles.length,
        stoppedVehicles: stoppedCount
      });
  };
  
  // Effect to handle changes in optimization settings
  useEffect(() => {
    // Immediately update traffic light durations when settings change
      setTrafficLights(prev => {
      const updatedLights = JSON.parse(JSON.stringify(prev));
      
      // Get references to both lights
      const nsLight = updatedLights.find(l => l.direction === 'ns')!;
      const ewLight = updatedLights.find(l => l.direction === 'ew')!;
      
      // If optimization is disabled or using fixed algorithm, reset to standard durations
      if (!optimizationEnabled || algorithmType === 'fixed') {
        nsLight.duration = 20;
        ewLight.duration = 20;
        
        // Don't change timeLeft for yellow lights
        if (nsLight.state === 'green') {
          nsLight.timeLeft = Math.min(nsLight.timeLeft, 20);
        }
        if (ewLight.state === 'green') {
          ewLight.timeLeft = Math.min(ewLight.timeLeft, 20);
        }
      } 
      // For adaptive and predictive algorithms, adjust durations based on current traffic
      else if (optimizationEnabled) {
        // Count waiting vehicles in each direction
        const nsWaiting = vehicles.filter(v => 
          (v.direction === 'north' || v.direction === 'south') && v.waiting
                ).length;
                
        const ewWaiting = vehicles.filter(v => 
          (v.direction === 'east' || v.direction === 'west') && v.waiting
                ).length;
                
        // Apply different duration calculations based on algorithm type
                if (algorithmType === 'adaptive') {
          // Adaptive is more responsive to current waiting vehicles
          if (nsLight.state === 'green') {
            if (nsWaiting < ewWaiting * 0.7) {
              nsLight.duration = Math.max(10, 15);
              nsLight.timeLeft = Math.min(nsLight.timeLeft, nsLight.duration);
            } else if (nsWaiting > ewWaiting * 1.5) {
              nsLight.duration = Math.min(30, 25);
              nsLight.timeLeft = Math.min(nsLight.timeLeft, nsLight.duration);
            }
          }
          
          if (ewLight.state === 'green') {
            if (ewWaiting < nsWaiting * 0.7) {
              ewLight.duration = Math.max(10, 15);
              ewLight.timeLeft = Math.min(ewLight.timeLeft, ewLight.duration);
            } else if (ewWaiting > nsWaiting * 1.5) {
              ewLight.duration = Math.min(30, 25);
              ewLight.timeLeft = Math.min(ewLight.timeLeft, ewLight.duration);
            }
          }
        } 
        else if (algorithmType === 'predictive') {
          // Predictive is more aggressive and considers approaching vehicles too
          const nsApproaching = vehicles.filter(v => 
            (v.direction === 'north' || v.direction === 'south') && !v.waiting
          ).length;
          
          const ewApproaching = vehicles.filter(v => 
            (v.direction === 'east' || v.direction === 'west') && !v.waiting
          ).length;
          
          // Calculate weighted traffic scores
          const nsTraffic = nsWaiting * 1.2 + nsApproaching * 0.5;
          const ewTraffic = ewWaiting * 1.2 + ewApproaching * 0.5;
          
          if (nsLight.state === 'green') {
            if (nsTraffic < ewTraffic * 0.6) {
              nsLight.duration = Math.max(12, 14);
              nsLight.timeLeft = Math.min(nsLight.timeLeft, nsLight.duration);
            } else if (nsTraffic > ewTraffic * 1.5) {
              nsLight.duration = Math.min(35, 28);
              nsLight.timeLeft = Math.min(nsLight.timeLeft, nsLight.duration);
            }
          }
          
          if (ewLight.state === 'green') {
            if (ewTraffic < nsTraffic * 0.6) {
              ewLight.duration = Math.max(12, 14);
              ewLight.timeLeft = Math.min(ewLight.timeLeft, ewLight.duration);
            } else if (ewTraffic > nsTraffic * 1.5) {
              ewLight.duration = Math.min(35, 28);
              ewLight.timeLeft = Math.min(ewLight.timeLeft, ewLight.duration);
            }
          }
        }
      }
      
      return updatedLights;
    });
  }, [optimizationEnabled, algorithmType, vehicles]);
  
  // Traffic optimization logic
  useEffect(() => {
    if (!isRunning) return;
    
    const optimizationInterval = setInterval(() => {
      // Skip optimization if it's disabled, but still run the interval
      if (!optimizationEnabled) return;
      
      // Get current traffic conditions
      const nsLight = trafficLights.find(l => l.direction === 'ns')!;
      const ewLight = trafficLights.find(l => l.direction === 'ew')!;
      
      // Only adjust durations when a light is green (before it cycles)
      if (nsLight.state !== 'green' && ewLight.state !== 'green') return;
      
      // Count waiting vehicles in each direction
      const nsWaiting = vehicles.filter(v => 
        (v.direction === 'north' || v.direction === 'south') && v.waiting
      ).length;
      
      const ewWaiting = vehicles.filter(v => 
        (v.direction === 'east' || v.direction === 'west') && v.waiting
      ).length;
      
      setTrafficLights(prev => {
        const updatedLights = [...prev];
        const activeLight = updatedLights.find(l => l.state === 'green')!;
        
        if (algorithmType === 'fixed') {
          // Fixed timing - set standard durations
          if (activeLight.direction === 'ns') {
            activeLight.duration = 20;
          } else if (activeLight.direction === 'ew') {
            activeLight.duration = 20;
          }
          return updatedLights;
        }
        else if (algorithmType === 'adaptive') {
          // Adaptive algorithm: adjust light durations based on current waiting vehicles
          let newDuration = activeLight.duration;
          
          if (activeLight.direction === 'ns') {
            if (nsWaiting < ewWaiting * 0.7) {
              // Fewer NS vehicles waiting - shorten NS green time
              newDuration = Math.max(10, Math.min(activeLight.timeLeft, activeLight.duration - 2));
            } else if (nsWaiting > ewWaiting * 1.5) {
              // Many more NS vehicles waiting - extend NS green time
              newDuration = Math.min(30, activeLight.duration + 3);
                  } else {
              // Balanced traffic - standard duration
              newDuration = 20;
            }
          } else if (activeLight.direction === 'ew') {
            if (ewWaiting < nsWaiting * 0.7) {
              // Fewer EW vehicles waiting - shorten EW green time
              newDuration = Math.max(10, Math.min(activeLight.timeLeft, activeLight.duration - 2));
            } else if (ewWaiting > nsWaiting * 1.5) {
              // Many more EW vehicles waiting - extend EW green time
              newDuration = Math.min(30, activeLight.duration + 3);
            } else {
              // Balanced traffic - standard duration
              newDuration = 20;
            }
          }
          
          activeLight.duration = newDuration;
          activeLight.timeLeft = Math.min(newDuration, activeLight.timeLeft);
          return updatedLights;
        }
        else if (algorithmType === 'predictive') {
          // Predictive algorithm: consider both waiting and approaching vehicles
          const nsApproaching = vehicles.filter(v => 
            (v.direction === 'north' || v.direction === 'south') && !v.waiting
                  ).length;
                  
          const ewApproaching = vehicles.filter(v => 
            (v.direction === 'east' || v.direction === 'west') && !v.waiting
          ).length;
          
          let newDuration = activeLight.duration;
          
          if (activeLight.direction === 'ns') {
            // Calculate weighted traffic scores
            const nsTraffic = nsWaiting * 1.2 + nsApproaching * 0.5;
            const ewTraffic = ewWaiting * 1.2 + ewApproaching * 0.5;
            
            if (nsTraffic < ewTraffic * 0.6) {
              // Much less NS traffic - reduce green time
              newDuration = Math.max(12, Math.min(activeLight.timeLeft, activeLight.duration - 3));
            } else if (nsTraffic > ewTraffic * 1.5) {
              // Much more NS traffic - extend green time
              newDuration = Math.min(35, activeLight.duration + 5);
                } else {
              // Balanced traffic - standard duration
              newDuration = 20;
            }
          } else if (activeLight.direction === 'ew') {
            // Calculate weighted traffic scores
            const nsTraffic = nsWaiting * 1.2 + nsApproaching * 0.5;
            const ewTraffic = ewWaiting * 1.2 + ewApproaching * 0.5;
            
            if (ewTraffic < nsTraffic * 0.6) {
              // Much less EW traffic - reduce green time
              newDuration = Math.max(12, Math.min(activeLight.timeLeft, activeLight.duration - 3));
            } else if (ewTraffic > nsTraffic * 1.5) {
              // Much more EW traffic - extend green time
              newDuration = Math.min(35, activeLight.duration + 5);
              } else {
              // Balanced traffic - standard duration
              newDuration = 20;
            }
          }
          
          activeLight.duration = newDuration;
          activeLight.timeLeft = Math.min(newDuration, activeLight.timeLeft);
          return updatedLights;
        }
        
        return updatedLights;
      });
    }, 2000); // Check every 2 seconds
    
    return () => clearInterval(optimizationInterval);
  }, [isRunning, optimizationEnabled, algorithmType, vehicles, trafficLights]);
  
  // Traffic light timing logic
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      
      setTrafficLights(prev => {
        // Create a deep copy to avoid issues
        const updatedLights = JSON.parse(JSON.stringify(prev));
        
        // Get references to both lights
        const nsLight = updatedLights.find(l => l.direction === 'ns')!;
        const ewLight = updatedLights.find(l => l.direction === 'ew')!;
        
        // Decrement timeLeft for all lights
        if (nsLight.state === 'green' || nsLight.state === 'yellow') {
          nsLight.timeLeft = Math.max(0, nsLight.timeLeft - 1);
        }
        
        if (ewLight.state === 'green' || ewLight.state === 'yellow') {
          ewLight.timeLeft = Math.max(0, ewLight.timeLeft - 1);
        }
        
        // Process light transitions - normal traffic light cycle logic
        if (nsLight.state === 'green' && nsLight.timeLeft === 0) {
          // Green → Yellow
          nsLight.state = 'yellow';
          nsLight.timeLeft = 3; // Yellow light duration
        } 
        else if (nsLight.state === 'yellow' && nsLight.timeLeft === 0) {
          // Yellow → Red
          nsLight.state = 'red';
          
          // Make east-west light green
          ewLight.state = 'green';
          
          // Set the duration based on the selected algorithm
          if (!optimizationEnabled || algorithmType === 'fixed') {
            ewLight.timeLeft = 20; // Fixed time algorithm
            ewLight.duration = 20;
                } else {
            ewLight.timeLeft = ewLight.duration; // Use the duration set by the optimization algorithms
          }
        }
        
        if (ewLight.state === 'green' && ewLight.timeLeft === 0) {
          // Green → Yellow
          ewLight.state = 'yellow';
          ewLight.timeLeft = 3; // Yellow light duration
        } 
        else if (ewLight.state === 'yellow' && ewLight.timeLeft === 0) {
          // Yellow → Red
          ewLight.state = 'red';
          
          // Make north-south light green
          nsLight.state = 'green';
          
          // Set the duration based on the selected algorithm
          if (!optimizationEnabled || algorithmType === 'fixed') {
            nsLight.timeLeft = 20; // Fixed time algorithm
            nsLight.duration = 20;
          } else {
            nsLight.timeLeft = nsLight.duration; // Use the duration set by the optimization algorithms
          }
        }
        
        // Safety check - never both green at same time
        if (nsLight.state === 'green' && ewLight.state === 'green') {
          // If somehow both are green, prioritize the one with more time left
          if (nsLight.timeLeft >= ewLight.timeLeft) {
            ewLight.state = 'red';
          } else {
            nsLight.state = 'red';
          }
        }
        
        return updatedLights;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, algorithmType, optimizationEnabled]);

  // Main animation loop
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (!canvasInitialized.current) {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = canvas.parentElement?.clientHeight || 600;
      canvasInitialized.current = true;
    }
    
    const animate = () => {
      if (!isRunning) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }
      
      const now = Date.now();
      const deltaTime = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background, roads, and intersection
      drawBackground(ctx, canvas.width, canvas.height);
      
      // Get current traffic light states
      const nsLight = trafficLights.find(l => l.direction === 'ns')!;
      const ewLight = trafficLights.find(l => l.direction === 'ew')!;
      
      // Draw traffic lights
      drawTrafficLights(ctx, canvas.width, canvas.height, nsLight, ewLight);
      
      // Generate new vehicles based on density
      if (Math.random() * 100 < density * deltaTime) {
        generateVehicle(canvas.width, canvas.height);
      }
      
      // Update and draw vehicles
      updateVehicles(deltaTime, canvas.width, canvas.height, nsLight, ewLight);
      
      // Draw stats overlay
      drawStatsOverlay(ctx, canvas.width, canvas.height, nsLight, ewLight);
      
      // Continue animation loop
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    animationFrameId.current = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrameId.current);
  }, [isRunning, density, trafficLights, optimizationEnabled, algorithmType, vehicles]);
  
  // Draw the background, roads, and intersection
  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const center = { x: width / 2, y: height / 2 };
      const roadWidth = 60;
      
    // Draw background
      ctx.fillStyle = '#f1f1f1';
    ctx.fillRect(0, 0, width, height);
      
    // Draw grass areas
      ctx.fillStyle = '#8db580';
      ctx.fillRect(0, 0, center.x - roadWidth, center.y - roadWidth);
    ctx.fillRect(center.x + roadWidth, 0, width - (center.x + roadWidth), center.y - roadWidth);
    ctx.fillRect(0, center.y + roadWidth, center.x - roadWidth, height - (center.y + roadWidth));
    ctx.fillRect(center.x + roadWidth, center.y + roadWidth, width - (center.x + roadWidth), height - (center.y + roadWidth));
    
    // Draw roads
      ctx.fillStyle = '#393939';
    ctx.fillRect(0, center.y - roadWidth, width, roadWidth * 2);
    ctx.fillRect(center.x - roadWidth, 0, roadWidth * 2, height);
      
    // Draw road markings
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      
    // Horizontal road borders
      ctx.beginPath();
      ctx.moveTo(0, center.y - roadWidth);
    ctx.lineTo(width, center.y - roadWidth);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, center.y + roadWidth);
    ctx.lineTo(width, center.y + roadWidth);
      ctx.stroke();
      
    // Vertical road borders
      ctx.beginPath();
      ctx.moveTo(center.x - roadWidth, 0);
    ctx.lineTo(center.x - roadWidth, height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(center.x + roadWidth, 0);
    ctx.lineTo(center.x + roadWidth, height);
      ctx.stroke();
      
    // Draw center lines
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      
      ctx.beginPath();
      ctx.moveTo(0, center.y);
    ctx.lineTo(width, center.y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(center.x, 0);
    ctx.lineTo(center.x, height);
      ctx.stroke();
      
    // Draw crosswalks
      ctx.setLineDash([]);
      ctx.fillStyle = 'white';
      
      const stripeWidth = 6;
      const stripeGap = 4;
      const crosswalkWidth = 15;
      
    // North crosswalk
      for (let x = center.x - roadWidth - crosswalkWidth; x < center.x + roadWidth + crosswalkWidth; x += stripeWidth + stripeGap) {
        ctx.fillRect(x, center.y - roadWidth - crosswalkWidth, stripeWidth, crosswalkWidth);
      }
      
    // South crosswalk
      for (let x = center.x - roadWidth - crosswalkWidth; x < center.x + roadWidth + crosswalkWidth; x += stripeWidth + stripeGap) {
        ctx.fillRect(x, center.y + roadWidth, stripeWidth, crosswalkWidth);
      }
      
    // West crosswalk
      for (let y = center.y - roadWidth - crosswalkWidth; y < center.y + roadWidth + crosswalkWidth; y += stripeWidth + stripeGap) {
        ctx.fillRect(center.x - roadWidth - crosswalkWidth, y, crosswalkWidth, stripeWidth);
      }
      
    // East crosswalk
      for (let y = center.y - roadWidth - crosswalkWidth; y < center.y + roadWidth + crosswalkWidth; y += stripeWidth + stripeGap) {
        ctx.fillRect(center.x + roadWidth, y, crosswalkWidth, stripeWidth);
      }
  };
  
  // Draw traffic lights
  const drawTrafficLights = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    nsLight: TrafficLight, 
    ewLight: TrafficLight
  ) => {
    const center = { x: width / 2, y: height / 2 };
    const roadWidth = 60;
    
    // Helper function to draw a single traffic light
    const drawTrafficLight = (
      x: number, 
      y: number, 
      direction: 'vertical' | 'horizontal', 
      state: LightState, 
      timeLeft: number
    ) => {
        ctx.fillStyle = '#222';
        
        if (direction === 'vertical') {
        // Draw vertical traffic light housing
          ctx.fillRect(x - 7, y - 22, 14, 40);
          
        // Draw red light
          ctx.fillStyle = state === 'red' ? '#ff3b30' : '#550000';
          ctx.beginPath();
          ctx.arc(x, y - 15, 5, 0, Math.PI * 2);
          ctx.fill();
          
        // Draw yellow light
          ctx.fillStyle = state === 'yellow' ? '#ffcc00' : '#553300';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
        // Draw green light
          ctx.fillStyle = state === 'green' ? '#34c759' : '#005500';
          ctx.beginPath();
          ctx.arc(x, y + 15, 5, 0, Math.PI * 2);
          ctx.fill();
          
        // Draw border and pole
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 7, y - 22, 14, 40);
          
          ctx.fillStyle = '#333';
          ctx.fillRect(x - 2, y + 18, 4, 15);
        } else {
        // Draw horizontal traffic light housing
          ctx.fillRect(x - 22, y - 7, 40, 14);
          
        // Draw red light
          ctx.fillStyle = state === 'red' ? '#ff3b30' : '#550000';
          ctx.beginPath();
          ctx.arc(x - 15, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
        // Draw yellow light
          ctx.fillStyle = state === 'yellow' ? '#ffcc00' : '#553300';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
        // Draw green light
          ctx.fillStyle = state === 'green' ? '#34c759' : '#005500';
          ctx.beginPath();
          ctx.arc(x + 15, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
        // Draw border and pole
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 22, y - 7, 40, 14);
          
          ctx.fillStyle = '#333';
          ctx.fillRect(x + 18, y - 2, 15, 4);
        }
      };
      
    // Draw the four traffic lights at the intersection
      drawTrafficLight(
        center.x + roadWidth + 20, 
        center.y - roadWidth - 20, 
        'vertical', 
        nsLight.state,
      nsLight.timeLeft
      );
      
      drawTrafficLight(
        center.x - roadWidth - 20, 
        center.y + roadWidth + 20, 
        'vertical', 
        nsLight.state,
      nsLight.timeLeft
      );
      
      drawTrafficLight(
        center.x + roadWidth + 20, 
        center.y + roadWidth + 20, 
        'horizontal', 
        ewLight.state,
      ewLight.timeLeft
      );
      
      drawTrafficLight(
        center.x - roadWidth - 20, 
        center.y - roadWidth - 20, 
        'horizontal', 
        ewLight.state,
      ewLight.timeLeft
    );
    
    // Draw modern countdown timer in top right corner
    const padding = 20;
    const timerWidth = 180;
    const timerHeight = 90;
    const cornerRadius = 12;
    
    // Draw rounded rectangle background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.moveTo(width - padding - timerWidth + cornerRadius, padding);
    ctx.arcTo(width - padding, padding, width - padding, padding + cornerRadius, cornerRadius);
    ctx.arcTo(width - padding, padding + timerHeight, width - padding - cornerRadius, padding + timerHeight, cornerRadius);
    ctx.arcTo(width - padding - timerWidth, padding + timerHeight, width - padding - timerWidth, padding + timerHeight - cornerRadius, cornerRadius);
    ctx.arcTo(width - padding - timerWidth, padding, width - padding - timerWidth + cornerRadius, padding, cornerRadius);
    ctx.closePath();
    ctx.fill();
    
    // Add subtle glow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    
    // Add title
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TRAFFIC SIGNAL', width - padding - timerWidth/2, padding + 20);
    
    // Draw divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - padding - timerWidth + 20, padding + 30);
    ctx.lineTo(width - padding - 20, padding + 30);
    ctx.stroke();
    
    // Draw NS timer
    ctx.fillStyle = nsLight.state === 'green' ? '#34c759' : 
                   nsLight.state === 'yellow' ? '#ffcc00' : '#ff3b30';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('N/S:', width - padding - timerWidth + 20, padding + 55);
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`${nsLight.timeLeft}s`, width - padding - timerWidth + 65, padding + 55);
    
    // Draw EW timer
    ctx.fillStyle = ewLight.state === 'green' ? '#34c759' : 
                   ewLight.state === 'yellow' ? '#ffcc00' : '#ff3b30';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('E/W:', width - padding - timerWidth + 20, padding + 80);
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`${ewLight.timeLeft}s`, width - padding - timerWidth + 65, padding + 80);
  };
  
  // Generate a new vehicle - adjust density effect
  const generateVehicle = (canvasWidth: number, canvasHeight: number) => {
    // Directly link vehicle generation to density setting
    // Higher density = more vehicles
    if (Math.random() * 100 > density) return;
    
    const center = { x: canvasWidth / 2, y: canvasHeight / 2 };
    const roadWidth = 60;
    const laneWidth = roadWidth / 2;
    
    // Randomly select direction, vehicle type, and lane
    const direction = ['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)] as Direction;
        const vehicleType = Math.random() > 0.8 
          ? (Math.random() > 0.5 ? 'truck' : 'bus') 
          : 'car';
        
        const vehicleColors = [
      '#1A1F2C', '#403E43', '#221F26', '#8E9196', '#4A4A4A', '#555555'
        ];
        
        const lane = Math.floor(Math.random() * 2);
        let position = { x: 0, y: 0 };
        const laneOffset = laneWidth * 0.5 + (lane * laneWidth);
        
    // Set initial position based on direction
        switch (direction) {
          case 'north':
            position = { 
              x: center.x + laneOffset,
          y: canvasHeight + 20 
            };
            break;
          case 'south':
            position = { 
              x: center.x - laneOffset,
              y: -20 
            };
            break;
          case 'east':
            position = { 
              x: -20,
              y: center.y + laneOffset 
            };
            break;
          case 'west':
            position = { 
          x: canvasWidth + 20,
              y: center.y - laneOffset 
            };
            break;
        }
        
    // Create and add the new vehicle
        setVehicles(prev => [...prev, {
      id: `vehicle-${vehicleIdCounter.current++}`,
          type: vehicleType,
          color: vehicleColors[Math.floor(Math.random() * vehicleColors.length)],
          direction,
          position,
          speed: 40 + Math.random() * 20,
          waiting: false,
          created: Date.now(),
          lane
        }]);
  };
  
  // Update and draw vehicles
  const updateVehicles = (
    deltaTime: number, 
    canvasWidth: number, 
    canvasHeight: number, 
    nsLight: TrafficLight, 
    ewLight: TrafficLight
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const center = { x: canvasWidth / 2, y: canvasHeight / 2 };
    const roadWidth = 60;
    const laneWidth = roadWidth / 2;
      
      setVehicles(prev => {
        return prev.map(vehicle => {
          let { position, speed, waiting, direction, lane } = vehicle;
          const vehicleLength = vehicle.type === 'car' ? 15 : vehicle.type === 'truck' ? 25 : 30;
          const vehicleWidth = vehicle.type === 'car' ? 10 : 12;
          
        // Determine if vehicle can pass through intersection
          const canPass = (
          (direction === 'north' || direction === 'south') && (nsLight.state === 'green' || nsLight.state === 'yellow') ||
          (direction === 'east' || direction === 'west') && (ewLight.state === 'green' || ewLight.state === 'yellow')
        );
        
        // Calculate exact distance to intersection
        let distanceToIntersection = 0;
        if (direction === 'north') {
          distanceToIntersection = position.y - (center.y + roadWidth);
        } else if (direction === 'south') {
          distanceToIntersection = (center.y - roadWidth) - position.y;
        } else if (direction === 'east') {
          distanceToIntersection = (center.x - roadWidth) - position.x;
        } else if (direction === 'west') {
          distanceToIntersection = position.x - (center.x + roadWidth);
        }
        
        // Check if approaching intersection - refined logic to stop exactly at intersection
        const stoppingDistance = 5; // Small buffer so vehicles stop exactly at intersection edge
          const approachingIntersection = (
          distanceToIntersection > 0 && distanceToIntersection < 100
          );
          
        // Check if already in intersection
          const inIntersection = (
            position.x > center.x - roadWidth && position.x < center.x + roadWidth &&
            position.y > center.y - roadWidth && position.y < center.y + roadWidth
          );
          
        // Check for vehicle ahead - improved distance calculation
          const vehicleAhead = prev.find(other => {
            if (other.id === vehicle.id || other.direction !== vehicle.direction || other.lane !== vehicle.lane) return false;
            
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
          
        // Update vehicle waiting status and speed
          if (!canPass && approachingIntersection && !inIntersection) {
          // Need to stop at intersection
            waiting = true;
            speed = 0;
          
          // Move vehicle exactly to the intersection boundary for clean stopping
          if (direction === 'north' && distanceToIntersection < stoppingDistance) {
            position.y = center.y + roadWidth + stoppingDistance;
          } else if (direction === 'south' && distanceToIntersection < stoppingDistance) {
            position.y = center.y - roadWidth - stoppingDistance;
          } else if (direction === 'east' && distanceToIntersection < stoppingDistance) {
            position.x = center.x - roadWidth - stoppingDistance;
          } else if (direction === 'west' && distanceToIntersection < stoppingDistance) {
            position.x = center.x + roadWidth + stoppingDistance;
          }
          
            if (!vehicle.waiting) {
            waitTimesRef.current.push(0);
            }
          } else if (vehicleAhead) {
            waiting = true;
            speed = 0;
          } else {
            if (waiting) {
              const waitTime = (Date.now() - vehicle.created) / 1000;
              if (waitTime > 0.5) {
              waitTimesRef.current[waitTimesRef.current.length - 1] = waitTime;
              } else {
              waitTimesRef.current.pop();
              }
            }
            waiting = false;
            speed = 40 + Math.random() * 20;
          }
          
        // Update vehicle position
          if (!waiting) {
            switch (direction) {
              case 'north':
                position.y -= speed * deltaTime;
                position.x = center.x + (laneWidth * 0.5 + (lane * laneWidth));
                break;
              case 'south':
                position.y += speed * deltaTime;
                position.x = center.x - (laneWidth * 0.5 + (lane * laneWidth));
                break;
              case 'east':
                position.x += speed * deltaTime;
                position.y = center.y + (laneWidth * 0.5 + (lane * laneWidth));
                break;
              case 'west':
                position.x -= speed * deltaTime;
                position.y = center.y - (laneWidth * 0.5 + (lane * laneWidth));
                break;
            }
          }
        
        // Draw the vehicle
        drawVehicle(ctx, vehicle, vehicleLength, vehicleWidth);
        
        // Check if vehicle is out of bounds
        const outOfBounds = (
          position.x < -50 || position.x > canvasWidth + 50 ||
          position.y < -50 || position.y > canvasHeight + 50
        );
        
        if (outOfBounds) {
          throughputWindowRef.current.push(Date.now());
          completedVehiclesRef.current++;
        }
        
        return outOfBounds ? null : { ...vehicle, position, speed, waiting };
      }).filter(Boolean) as Vehicle[];
    });
  };
  
  // Draw a vehicle
  const drawVehicle = (ctx: CanvasRenderingContext2D, vehicle: Vehicle, vehicleLength: number, vehicleWidth: number) => {
    const { position, direction, type, color } = vehicle;
          
          ctx.save();
          ctx.translate(position.x, position.y);
          
    // Rotate based on direction
          if (direction === 'north') {
            ctx.rotate(Math.PI * 0);
          } else if (direction === 'south') {
            ctx.rotate(Math.PI * 1);
          } else if (direction === 'east') {
            ctx.rotate(Math.PI * 0.5);
          } else if (direction === 'west') {
            ctx.rotate(Math.PI * 1.5);
          }
          
    // Draw shadow
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 1, vehicleWidth, vehicleLength);
          
    // Draw vehicle body
    ctx.fillStyle = color;
          ctx.fillRect(-vehicleWidth / 2, -vehicleLength / 2, vehicleWidth, vehicleLength);
          
    // Draw vehicle details based on type
    if (type === 'car') {
            ctx.fillStyle = '#222222';
            ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 3, vehicleWidth - 2, 3);
            ctx.fillRect(-vehicleWidth / 2 + 1, vehicleLength / 2 - 6, vehicleWidth - 2, 3);
            
      // Draw lights
            if (direction === 'north' || direction === 'south' || direction === 'west') {
              ctx.fillStyle = '#ff3b30';
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 1, 2, 1);
              ctx.fillRect(vehicleWidth / 2 - 3, -vehicleLength / 2 + 1, 2, 1);
            } else {
              ctx.fillStyle = '#ffcc00';
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 1, 2, 1);
              ctx.fillRect(vehicleWidth / 2 - 3, -vehicleLength / 2 + 1, 2, 1);
            }
    } else if (type === 'truck') {
            ctx.fillStyle = '#222222';
            ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 3, vehicleWidth - 2, 6);
            
      ctx.fillStyle = color === '#1A1F2C' ? '#262A37' : '#4E4950';
            ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 10, vehicleWidth - 2, vehicleLength - 13);
            
      // Draw lights
            if (direction === 'north' || direction === 'south' || direction === 'west') {
              ctx.fillStyle = '#ff3b30';
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 1, 2, 2);
              ctx.fillRect(vehicleWidth / 2 - 3, -vehicleLength / 2 + 1, 2, 2);
            } else {
              ctx.fillStyle = '#ffcc00';
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 1, 2, 2);
              ctx.fillRect(vehicleWidth / 2 - 3, -vehicleLength / 2 + 1, 2, 2);
            }
    } else { // Bus
            ctx.fillStyle = '#222222';
            for (let i = 0; i < 4; i++) {
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 5 + i * 5, vehicleWidth - 2, 3);
            }
            
      // Draw lights
            if (direction === 'north' || direction === 'south' || direction === 'west') {
              ctx.fillStyle = '#ff3b30';
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 1, 3, 2);
              ctx.fillRect(vehicleWidth / 2 - 4, -vehicleLength / 2 + 1, 3, 2);
            } else {
              ctx.fillStyle = '#ffcc00';
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 1, 3, 2);
              ctx.fillRect(vehicleWidth / 2 - 4, -vehicleLength / 2 + 1, 3, 2);
            }
          }
          
          ctx.restore();
  };
  
  // Draw stats overlay
  const drawStatsOverlay = (
    ctx: CanvasRenderingContext2D, 
    canvasWidth: number, 
    canvasHeight: number, 
    nsLight: TrafficLight, 
    ewLight: TrafficLight
  ) => {
    const center = { x: canvasWidth / 2, y: canvasHeight / 2 };
    const roadWidth = 60;
    
    // Draw stats at the top left with modern design
    const padding = 20;
    const statsWidth = 180;
    const statsHeight = 90;
    const cornerRadius = 12;
    
    // Draw rounded rectangle background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.moveTo(padding + cornerRadius, padding);
    ctx.arcTo(padding + statsWidth, padding, padding + statsWidth, padding + cornerRadius, cornerRadius);
    ctx.arcTo(padding + statsWidth, padding + statsHeight, padding + statsWidth - cornerRadius, padding + statsHeight, cornerRadius);
    ctx.arcTo(padding, padding + statsHeight, padding, padding + statsHeight - cornerRadius, cornerRadius);
    ctx.arcTo(padding, padding, padding + cornerRadius, padding, cornerRadius);
    ctx.closePath();
    ctx.fill();
    
    // Add subtle glow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
    
    // Add title
    ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('TRAFFIC STATISTICS', padding + statsWidth/2, padding + 20);
    
    // Draw divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding + 20, padding + 30);
    ctx.lineTo(padding + statsWidth - 20, padding + 30);
    ctx.stroke();
    
    // Display statistics with modern font
    ctx.textAlign = 'left';
    ctx.font = '14px Arial';
    
    // Vehicle counts
    ctx.fillText(`Vehicles: ${stats.totalVehicles}`, padding + 20, padding + 50);
    ctx.fillText(`Stopped: ${stats.stoppedVehicles}`, padding + 20, padding + 70);
  };
  
  // UI control handlers with immediate effect
  const handleOptimizationToggle = (value: boolean) => {
    setOptimizationEnabled(value);
  };
  
  const handleAlgorithmChange = (value: AlgorithmType) => {
    setAlgorithmType(value);
  };
  
  return (
    <section id="simulation" className="section-container py-20">
      <div className="space-y-6 text-center mb-10">
        <div className="chip bg-accent/10 text-accent inline-block">
          Interactive Simulation
        </div>
        <h2 className="heading-lg">See Our AI Traffic Optimization In Action</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          This interactive traffic simulation demonstrates how our AI-powered traffic management system optimizes traffic 
          flow at intersections. Try adjusting the parameters to see the difference in wait times and throughput.
        </p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2 p-6">
            <div className="relative aspect-video rounded-lg overflow-hidden border border-white/20 shadow-xl bg-gray-100">
              <canvas 
                ref={canvasRef} 
                className="w-full h-full"
                style={{ display: 'block' }}
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
              
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white p-3 text-sm flex justify-between">
                <div>Avg Wait Time: {stats.averageWaitTime}s</div>
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
                    onCheckedChange={handleOptimizationToggle}
                  />
                  <Label htmlFor="optimize">Enable AI Optimization</Label>
                </div>
                
                <Tabs value={algorithmType} onValueChange={handleAlgorithmChange} className="w-full">
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
