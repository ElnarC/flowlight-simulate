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
