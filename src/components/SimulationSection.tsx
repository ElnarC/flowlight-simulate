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
  countdown: number;
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
    { direction: 'ns', state: 'green', duration: 20, timeLeft: 20, countdown: 0 },
    { direction: 'ew', state: 'red', duration: 20, timeLeft: 0, countdown: 3 }
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
  
  // Traffic optimization logic
  useEffect(() => {
    if (!isRunning || !optimizationEnabled) return;
    
    const optimizationInterval = setInterval(() => {
      // Get current traffic conditions
      const nsLight = trafficLights.find(l => l.direction === 'ns')!;
      const ewLight = trafficLights.find(l => l.direction === 'ew')!;
      
      // Count waiting vehicles in each direction
      const nsWaiting = vehicles.filter(v => 
        (v.direction === 'north' || v.direction === 'south') && v.waiting
      ).length;
      
      const ewWaiting = vehicles.filter(v => 
        (v.direction === 'east' || v.direction === 'west') && v.waiting
      ).length;
      
      if (algorithmType === 'adaptive') {
        // Adaptive algorithm: adjust light durations based on current waiting vehicles
        setTrafficLights(prev => {
          return prev.map(light => {
            if (light.state !== 'green') return light;
            
            let newDuration = light.duration;
            
            if (light.direction === 'ns' && nsWaiting < ewWaiting * 0.7) {
              // Fewer NS vehicles waiting - shorten NS green time
              newDuration = Math.max(10, light.duration - 2);
            } else if (light.direction === 'ew' && ewWaiting < nsWaiting * 0.7) {
              // Fewer EW vehicles waiting - shorten EW green time
              newDuration = Math.max(10, light.duration - 2);
            } else if (light.direction === 'ns' && nsWaiting > ewWaiting * 1.5) {
              // Many more NS vehicles waiting - extend NS green time
              newDuration = Math.min(30, light.duration + 3);
            } else if (light.direction === 'ew' && ewWaiting > nsWaiting * 1.5) {
              // Many more EW vehicles waiting - extend EW green time
              newDuration = Math.min(30, light.duration + 3);
            }
            
            return {
              ...light,
              duration: newDuration,
              timeLeft: Math.min(newDuration, light.timeLeft)
            };
          });
        });
      } else if (algorithmType === 'predictive') {
        // Predictive algorithm: consider both waiting and approaching vehicles
        const nsApproaching = vehicles.filter(v => 
          (v.direction === 'north' || v.direction === 'south') && !v.waiting
        ).length;
        
        const ewApproaching = vehicles.filter(v => 
          (v.direction === 'east' || v.direction === 'west') && !v.waiting
        ).length;
        
        setTrafficLights(prev => {
          return prev.map(light => {
            if (light.state !== 'green') return light;
            
            let newDuration = light.duration;
            
            if (light.direction === 'ns') {
              // Calculate weighted traffic scores
              const nsTraffic = nsWaiting * 1.2 + nsApproaching * 0.5;
              const ewTraffic = ewWaiting * 1.2 + ewApproaching * 0.5;
              
              if (nsTraffic < ewTraffic * 0.6) {
                // Much less NS traffic - reduce green time
                newDuration = Math.max(12, light.duration - 3);
              } else if (nsTraffic > ewTraffic * 1.5) {
                // Much more NS traffic - extend green time
                newDuration = Math.min(35, light.duration + 5);
              }
            } else if (light.direction === 'ew') {
              // Calculate weighted traffic scores
              const nsTraffic = nsWaiting * 1.2 + nsApproaching * 0.5;
              const ewTraffic = ewWaiting * 1.2 + ewApproaching * 0.5;
              
              if (ewTraffic < nsTraffic * 0.6) {
                // Much less EW traffic - reduce green time
                newDuration = Math.max(12, light.duration - 3);
              } else if (ewTraffic > nsTraffic * 1.5) {
                // Much more EW traffic - extend green time
                newDuration = Math.min(35, light.duration + 5);
              }
            }
            
            return {
              ...light,
              duration: newDuration,
              timeLeft: Math.min(newDuration, light.timeLeft)
            };
          });
        });
      }
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
        
        // First, decrement countdown timers for lights in red state
        if (nsLight.state === 'red' && nsLight.countdown > 0) {
          nsLight.countdown = Math.max(0, nsLight.countdown - 1);
        }
        
        if (ewLight.state === 'red' && ewLight.countdown > 0) {
          ewLight.countdown = Math.max(0, ewLight.countdown - 1);
        }
        
        // Then, decrement timeLeft for all lights
        nsLight.timeLeft = Math.max(0, nsLight.timeLeft - 1);
        ewLight.timeLeft = Math.max(0, ewLight.timeLeft - 1);
        
        // Process light transitions
        if (nsLight.timeLeft === 0) {
          if (nsLight.state === 'green') {
            // Green → Yellow
            nsLight.state = 'yellow';
            nsLight.timeLeft = 3;
          } else if (nsLight.state === 'yellow') {
            // Yellow → Red
            nsLight.state = 'red';
            
            // Set duration based on optimization logic
            if (optimizationEnabled) {
              const nsWaiting = vehicles.filter(v => 
                (v.direction === 'north' || v.direction === 'south') && v.waiting
              ).length;
              
              const ewWaiting = vehicles.filter(v => 
                (v.direction === 'east' || v.direction === 'west') && v.waiting
              ).length;
              
              if (algorithmType === 'adaptive') {
                nsLight.timeLeft = Math.max(15, Math.min(30, 15 + Math.floor(ewWaiting / 3)));
              } else if (algorithmType === 'predictive') {
                const ewApproaching = vehicles.filter(v => 
                  (v.direction === 'east' || v.direction === 'west') && !v.waiting
                ).length;
                
                nsLight.timeLeft = Math.max(20, Math.min(35, 20 + Math.floor((ewWaiting + ewApproaching * 0.5) / 3)));
              } else {
                nsLight.timeLeft = 20;
              }
            } else {
              nsLight.timeLeft = 20;
            }
            
            // Start countdown for east-west light
            ewLight.countdown = 3;
          }
        }
        
        if (ewLight.timeLeft === 0) {
          if (ewLight.state === 'green') {
            // Green → Yellow
            ewLight.state = 'yellow';
            ewLight.timeLeft = 3;
          } else if (ewLight.state === 'yellow') {
            // Yellow → Red
            ewLight.state = 'red';
            
            // Set duration based on optimization logic
            if (optimizationEnabled) {
              const nsWaiting = vehicles.filter(v => 
                (v.direction === 'north' || v.direction === 'south') && v.waiting
              ).length;
              
              const ewWaiting = vehicles.filter(v => 
                (v.direction === 'east' || v.direction === 'west') && v.waiting
              ).length;
              
              if (algorithmType === 'adaptive') {
                ewLight.timeLeft = Math.max(15, Math.min(30, 15 + Math.floor(nsWaiting / 3)));
              } else if (algorithmType === 'predictive') {
                const nsApproaching = vehicles.filter(v => 
                  (v.direction === 'north' || v.direction === 'south') && !v.waiting
                ).length;
                
                ewLight.timeLeft = Math.max(20, Math.min(35, 20 + Math.floor((nsWaiting + nsApproaching * 0.5) / 3)));
              } else {
                ewLight.timeLeft = 20;
              }
            } else {
              ewLight.timeLeft = 20;
            }
            
            // Start countdown for north-south light
            nsLight.countdown = 3;
          }
        }
        
        // Handle countdown completion (red to green transition)
        if (nsLight.countdown === 0 && nsLight.state === 'red' && ewLight.state === 'red') {
          // If both lights are red and NS countdown is complete, make NS green
          nsLight.state = 'green';
          nsLight.timeLeft = nsLight.duration;
        }
        
        if (ewLight.countdown === 0 && ewLight.state === 'red' && nsLight.state === 'red') {
          // If both lights are red and EW countdown is complete, make EW green
          ewLight.state = 'green';
          ewLight.timeLeft = ewLight.duration;
        }
        
        // Safety check - never both green at same time
        if (nsLight.state === 'green' && ewLight.state === 'green') {
          // If somehow both are green, prioritize the one with more time left
          if (nsLight.timeLeft >= ewLight.timeLeft) {
            ewLight.state = 'red';
            ewLight.timeLeft = nsLight.timeLeft + 3;
          } else {
            nsLight.state = 'red';
            nsLight.timeLeft = ewLight.timeLeft + 3;
          }
        }
        
        return updatedLights;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, vehicles, optimizationEnabled, algorithmType]);
  
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
      countdown: number, 
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
        
        // Always draw timer box for better visibility
        ctx.fillStyle = 'black';
        ctx.fillRect(x - 15, y - 40, 30, 15);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // Display countdown or timer based on light state
        if (countdown > 0 && state === 'red') {
          // Display countdown to green
          ctx.fillStyle = '#ffcc00';
          ctx.fillText(`${countdown}s`, x, y - 30);
        } else {
          // Display remaining time for current state
          ctx.fillText(`${timeLeft}s`, x, y - 30);
        }
        
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
        
        // Always draw timer box for better visibility
        ctx.fillStyle = 'black';
        ctx.fillRect(x - 42, y - 12, 30, 24);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        
        // Display countdown or timer based on light state
        if (countdown > 0 && state === 'red') {
          // Display countdown to green
          ctx.fillStyle = '#ffcc00';
          ctx.fillText(`${countdown}s`, x - 27, y + 4);
        } else {
          // Display remaining time for current state
          ctx.fillText(`${timeLeft}s`, x - 27, y + 4);
        }
        
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
      nsLight.countdown,
      nsLight.timeLeft
    );
    
    drawTrafficLight(
      center.x - roadWidth - 20, 
      center.y + roadWidth + 20, 
      'vertical', 
      nsLight.state,
      nsLight.countdown,
      nsLight.timeLeft
    );
    
    drawTrafficLight(
      center.x + roadWidth + 20, 
      center.y + roadWidth + 20, 
      'horizontal', 
      ewLight.state,
      ewLight.countdown,
      ewLight.timeLeft
    );
    
    drawTrafficLight(
      center.x - roadWidth - 20, 
      center.y - roadWidth - 20, 
      'horizontal', 
      ewLight.state,
      ewLight.countdown,
      ewLight.timeLeft
    );
    
    // Draw countdown indicators in the center of the intersection
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(center.x - 50, center.y - 60, 100, 50);
    
    ctx.textAlign = 'center';
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    
    // Show traffic light status
    ctx.fillText('Traffic Status:', center.x, center.y - 40);
    
    // Show NS traffic light status
    if (nsLight.state === 'green') {
      ctx.fillStyle = '#34c759';
      ctx.fillText(`NS: GREEN (${nsLight.timeLeft}s)`, center.x, center.y - 20);
    } else if (nsLight.state === 'yellow') {
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(`NS: YELLOW (${nsLight.timeLeft}s)`, center.x, center.y - 20);
    } else {
      ctx.fillStyle = '#ff3b30';
      ctx.fillText(`NS: RED ${nsLight.countdown > 0 ? `(${nsLight.countdown}s →)` : ''}`, center.x, center.y - 20);
    }
    
    // Show EW traffic light status
    if (ewLight.state === 'green') {
      ctx.fillStyle = '#34c759';
      ctx.fillText(`EW: GREEN (${ewLight.timeLeft}s)`, center.x, center.y);
    } else if (ewLight.state === 'yellow') {
      ctx.fillStyle = '#ffcc00';
      ctx.fillText(`EW: YELLOW (${ewLight.timeLeft}s)`, center.x, center.y);
    } else {
      ctx.fillStyle = '#ff3b30';
      ctx.fillText(`EW: RED ${ewLight.countdown > 0 ? `(${ewLight.countdown}s →)` : ''}`, center.x, center.y);
    }
  };
  
  // Generate a new vehicle
  const generateVehicle = (canvasWidth: number, canvasHeight: number) => {
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
        
        // Check if approaching intersection
        const approachingIntersection = (
          (direction === 'north' && position.y > center.y + roadWidth && position.y < center.y + roadWidth + 100) ||
          (direction === 'south' && position.y < center.y - roadWidth && position.y > center.y - roadWidth - 100) ||
          (direction === 'east' && position.x < center.x - roadWidth && position.x > center.x - roadWidth - 100) ||
          (direction === 'west' && position.x > center.x + roadWidth && position.x < center.x + roadWidth + 100)
        );
        
        // Check if in intersection
        const inIntersection = (
          position.x > center.x - roadWidth && position.x < center.x + roadWidth &&
          position.y > center.y - roadWidth && position.y < center.y + roadWidth
        );
        
        // Check for vehicle ahead
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
          waiting = true;
          speed = 0;
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
    
    // Draw stats at the top
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(10, 10, 180, 90);
    
    ctx.fillStyle = 'white';
    ctx.fillText(`Total Vehicles: ${stats.totalVehicles}`, 20, 30);
    ctx.fillText(`Stopped: ${stats.stoppedVehicles}`, 20, 50);
    ctx.fillText(`Avg Wait: ${stats.averageWaitTime}s`, 20, 70);
    ctx.fillText(`Throughput: ${stats.throughput}/min`, 20, 90);
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
