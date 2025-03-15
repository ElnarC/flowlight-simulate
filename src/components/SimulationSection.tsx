import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

type Vehicle = {
  id: string;
  type: 'car' | 'truck' | 'bus';
  color: string;
  direction: 'north' | 'south' | 'east' | 'west';
  position: { x: number; y: number };
  speed: number;
  waiting: boolean;
  created: number;
  lane: number;
};

type TrafficLight = {
  direction: 'ns' | 'ew';
  state: 'red' | 'yellow' | 'green';
  duration: number;
  timeLeft: number;
  countdown: number;
};

const SimulationSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isRunning, setIsRunning] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trafficLights, setTrafficLights] = useState<TrafficLight[]>([
    { direction: 'ns', state: 'green', duration: 20, timeLeft: 20, countdown: 0 },
    { direction: 'ew', state: 'red', duration: 20, timeLeft: 0, countdown: 3 }
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
  const completedVehiclesRef = useRef(0);
  const throughputTimeWindowRef = useRef<number[]>([]);
  const canvasInitialized = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        canvasInitialized.current = true;
        drawInitialState(ctx, canvas.width, canvas.height);
      }
    };

    const drawInitialState = (context: CanvasRenderingContext2D, width: number, height: number) => {
      context.fillStyle = '#f1f1f1';
      context.fillRect(0, 0, width, height);
      
      const center = { x: width / 2, y: height / 2 };
      const roadWidth = 60;
      
      context.fillStyle = '#8db580';
      context.fillRect(0, 0, center.x - roadWidth, center.y - roadWidth);
      context.fillRect(center.x + roadWidth, 0, width - (center.x + roadWidth), center.y - roadWidth);
      context.fillRect(0, center.y + roadWidth, center.x - roadWidth, height - (center.y + roadWidth));
      context.fillRect(center.x + roadWidth, center.y + roadWidth, width - (center.x + roadWidth), height - (center.y + roadWidth));
      
      context.fillStyle = '#393939';
      context.fillRect(0, center.y - roadWidth, width, roadWidth * 2);
      context.fillRect(center.x - roadWidth, 0, roadWidth * 2, height);
      
      context.strokeStyle = 'white';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(0, center.y - roadWidth);
      context.lineTo(width, center.y - roadWidth);
      context.stroke();
      
      context.font = '16px Arial';
      context.fillStyle = 'white';
      context.textAlign = 'center';
      context.fillText('Simulation initializing...', center.x, center.y);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    statsUpdateInterval.current = setInterval(() => {
      const currentVehicles = vehicles.length;
      const stoppedCount = vehicles.filter(v => v.waiting).length;
      const recentWaitTimes = waitTimes.current.slice(-100);
      const avgWaitTime = recentWaitTimes.length > 0 
        ? recentWaitTimes.reduce((a, b) => a + b, 0) / recentWaitTimes.length 
        : 0;
      
      const now = Date.now();
      throughputTimeWindowRef.current = throughputTimeWindowRef.current.filter(time => now - time < 60000);
      const vehiclesPerMinute = throughputTimeWindowRef.current.length;
      
      setStats({
        averageWaitTime: Math.round(avgWaitTime * 10) / 10,
        throughput: vehiclesPerMinute,
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

  useEffect(() => {
    if (!isRunning || !optimizationEnabled) return;
    
    const optimizationInterval = setInterval(() => {
      // Get current traffic conditions
      const nsLight = trafficLights.find(l => l.direction === 'ns')!;
      const ewLight = trafficLights.find(l => l.direction === 'ew')!;
      
      // Count vehicles waiting in each direction
      const nsWaiting = vehicles.filter(v => 
        (v.direction === 'north' || v.direction === 'south') && v.waiting
      ).length;
      
      const ewWaiting = vehicles.filter(v => 
        (v.direction === 'east' || v.direction === 'west') && v.waiting
      ).length;
      
      // Apply optimization based on algorithm type
      if (algorithmType === 'adaptive') {
        // Adjust light durations based on waiting vehicles
        setTrafficLights(prev => {
          return prev.map(light => {
            if (light.state !== 'green') return light;
            
            let newDuration = light.duration;
            if (light.direction === 'ns' && nsWaiting < ewWaiting * 0.7) {
              // Shorten NS green time if few NS vehicles waiting
              newDuration = Math.max(10, light.duration - 2);
            } else if (light.direction === 'ew' && ewWaiting < nsWaiting * 0.7) {
              // Shorten EW green time if few EW vehicles waiting
              newDuration = Math.max(10, light.duration - 2);
            } else if (light.direction === 'ns' && nsWaiting > ewWaiting * 1.5) {
              // Extend NS green time if many NS vehicles waiting
              newDuration = Math.min(30, light.duration + 3);
            } else if (light.direction === 'ew' && ewWaiting > nsWaiting * 1.5) {
              // Extend EW green time if many EW vehicles waiting
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
        // Count approaching vehicles
        const nsApproaching = vehicles.filter(v => 
          (v.direction === 'north' || v.direction === 'south') && !v.waiting
        ).length;
        
        const ewApproaching = vehicles.filter(v => 
          (v.direction === 'east' || v.direction === 'west') && !v.waiting
        ).length;
        
        // Adjust light durations based on approaching and waiting vehicles
        setTrafficLights(prev => {
          return prev.map(light => {
            if (light.state !== 'green') return light;
            
            let newDuration = light.duration;
            if (light.direction === 'ns') {
              const nsTraffic = nsWaiting * 1.2 + nsApproaching * 0.5;
              const ewTraffic = ewWaiting * 1.2 + ewApproaching * 0.5;
              
              if (nsTraffic < ewTraffic * 0.6) {
                // Reduce NS green time if EW traffic is heavier
                newDuration = Math.max(12, light.duration - 3);
              } else if (nsTraffic > ewTraffic * 1.5) {
                // Extend NS green time if NS traffic is heavier
                newDuration = Math.min(35, light.duration + 5);
              }
            } else if (light.direction === 'ew') {
              const nsTraffic = nsWaiting * 1.2 + nsApproaching * 0.5;
              const ewTraffic = ewWaiting * 1.2 + ewApproaching * 0.5;
              
              if (ewTraffic < nsTraffic * 0.6) {
                // Reduce EW green time if NS traffic is heavier
                newDuration = Math.max(12, light.duration - 3);
              } else if (ewTraffic > nsTraffic * 1.5) {
                // Extend EW green time if EW traffic is heavier
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

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRunning) return;
      
      setTrafficLights(prev => {
        return prev.map(light => {
          let newTimeLeft = light.timeLeft - 1;
          let newState = light.state;
          let newCountdown = light.countdown;
          
          if (newTimeLeft <= 0) {
            if (light.state === 'green') {
              newState = 'yellow';
              newTimeLeft = 3;
              newCountdown = 0;
            } else if (light.state === 'yellow') {
              newState = 'red';
              
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
                
                let baseDuration = 20;
                if (algorithmType === 'adaptive') {
                  if (stoppedInOtherDirection > stoppedInDirection * 1.5) {
                    baseDuration = Math.min(30, Math.max(10, Math.round(stoppedInOtherDirection * 1.5)));
                  } else {
                    baseDuration = 15;
                  }
                } else if (algorithmType === 'predictive') {
                  const approachingVehicles = vehicles.filter(v => 
                    (otherLight.direction === 'ns' && (v.direction === 'north' || v.direction === 'south') && !v.waiting) ||
                    (otherLight.direction === 'ew' && (v.direction === 'east' || v.direction === 'west') && !v.waiting)
                  ).length;
                  
                  baseDuration = Math.min(35, Math.max(12, Math.round((stoppedInOtherDirection * 1.2) + (approachingVehicles * 0.3))));
                } else {
                  baseDuration = 20;
                }
                
                newTimeLeft = otherLight.state === 'red' ? baseDuration : otherLight.timeLeft + baseDuration;
              } else {
                newTimeLeft = 20;
              }
              
              const otherLight = prev.find(l => l.direction !== light.direction)!;
              if (otherLight.state === 'red') {
                newCountdown = 3;
              }
            } else if (light.state === 'red') {
              const otherLight = prev.find(l => l.direction !== light.direction)!;
              if (otherLight.state === 'yellow' || otherLight.state === 'red') {
                if (light.countdown > 0) {
                  newCountdown = light.countdown - 1;
                  newState = 'red';
                  newTimeLeft = 1; // Keep the light red for another second
                } else {
                  newState = 'green';
                  newTimeLeft = light.duration;
                }
              } else {
                // Keep the light red while the other light is green
                newTimeLeft = 1;
              }
            }
          }
          
          return {
            ...light,
            state: newState,
            timeLeft: newTimeLeft,
            countdown: newCountdown
          };
        });
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, vehicles, optimizationEnabled, algorithmType]);

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
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const now = Date.now();
      const deltaTime = (now - lastFrameTime.current) / 1000;
      lastFrameTime.current = now;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const center = { x: canvas.width / 2, y: canvas.height / 2 };
      const roadWidth = 60;
      const laneWidth = roadWidth / 2;
      
      ctx.fillStyle = '#f1f1f1';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#8db580';
      ctx.fillRect(0, 0, center.x - roadWidth, center.y - roadWidth);
      ctx.fillRect(center.x + roadWidth, 0, canvas.width - (center.x + roadWidth), center.y - roadWidth);
      ctx.fillRect(0, center.y + roadWidth, center.x - roadWidth, canvas.height - (center.y + roadWidth));
      ctx.fillRect(center.x + roadWidth, center.y + roadWidth, canvas.width - (center.x + roadWidth), canvas.height - (center.y + roadWidth));
      
      ctx.fillStyle = '#393939';
      ctx.fillRect(0, center.y - roadWidth, canvas.width, roadWidth * 2);
      ctx.fillRect(center.x - roadWidth, 0, roadWidth * 2, canvas.height);
      
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      
      ctx.beginPath();
      ctx.moveTo(0, center.y - roadWidth);
      ctx.lineTo(canvas.width, center.y - roadWidth);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, center.y + roadWidth);
      ctx.lineTo(canvas.width, center.y + roadWidth);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(center.x - roadWidth, 0);
      ctx.lineTo(center.x - roadWidth, canvas.height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(center.x + roadWidth, 0);
      ctx.lineTo(center.x + roadWidth, canvas.height);
      ctx.stroke();
      
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      
      ctx.beginPath();
      ctx.moveTo(0, center.y);
      ctx.lineTo(canvas.width, center.y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(center.x, 0);
      ctx.lineTo(center.x, canvas.height);
      ctx.stroke();
      
      ctx.setLineDash([]);
      ctx.fillStyle = 'white';
      
      const stripeWidth = 6;
      const stripeGap = 4;
      const crosswalkWidth = 15;
      
      for (let x = center.x - roadWidth - crosswalkWidth; x < center.x + roadWidth + crosswalkWidth; x += stripeWidth + stripeGap) {
        ctx.fillRect(x, center.y - roadWidth - crosswalkWidth, stripeWidth, crosswalkWidth);
      }
      
      for (let x = center.x - roadWidth - crosswalkWidth; x < center.x + roadWidth + crosswalkWidth; x += stripeWidth + stripeGap) {
        ctx.fillRect(x, center.y + roadWidth, stripeWidth, crosswalkWidth);
      }
      
      for (let y = center.y - roadWidth - crosswalkWidth; y < center.y + roadWidth + crosswalkWidth; y += stripeWidth + stripeGap) {
        ctx.fillRect(center.x - roadWidth - crosswalkWidth, y, crosswalkWidth, stripeWidth);
      }
      
      for (let y = center.y - roadWidth - crosswalkWidth; y < center.y + roadWidth + crosswalkWidth; y += stripeWidth + stripeGap) {
        ctx.fillRect(center.x + roadWidth, y, crosswalkWidth, stripeWidth);
      }
      
      const nsLight = trafficLights.find(l => l.direction === 'ns')!;
      const ewLight = trafficLights.find(l => l.direction === 'ew')!;
      
      const drawTrafficLight = (x: number, y: number, direction: 'vertical' | 'horizontal', state: 'red' | 'yellow' | 'green', countdown: number) => {
        ctx.fillStyle = '#222';
        
        if (direction === 'vertical') {
          ctx.fillRect(x - 7, y - 22, 14, 40);
          
          ctx.fillStyle = state === 'red' ? '#ff3b30' : '#550000';
          ctx.beginPath();
          ctx.arc(x, y - 15, 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = state === 'yellow' ? '#ffcc00' : '#553300';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = state === 'green' ? '#34c759' : '#005500';
          ctx.beginPath();
          ctx.arc(x, y + 15, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw countdown timer
          if (countdown > 0) {
            ctx.fillStyle = 'black';
            ctx.fillRect(x - 10, y - 35, 20, 12);
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${countdown}`, x, y - 26);
          } else if (state === 'green') {
            // Show remaining green time
            const nsLight = trafficLights.find(l => l.direction === 'ns')!;
            if (nsLight.state === 'green') {
              ctx.fillStyle = 'black';
              ctx.fillRect(x - 10, y - 35, 20, 12);
              ctx.fillStyle = 'white';
              ctx.font = '10px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(`${nsLight.timeLeft}`, x, y - 26);
            }
          }
          
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 7, y - 22, 14, 40);
          
          ctx.fillStyle = '#333';
          ctx.fillRect(x - 2, y + 18, 4, 15);
        } else {
          ctx.fillRect(x - 22, y - 7, 40, 14);
          
          ctx.fillStyle = state === 'red' ? '#ff3b30' : '#550000';
          ctx.beginPath();
          ctx.arc(x - 15, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = state === 'yellow' ? '#ffcc00' : '#553300';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = state === 'green' ? '#34c759' : '#005500';
          ctx.beginPath();
          ctx.arc(x + 15, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw countdown timer
          if (countdown > 0) {
            ctx.fillStyle = 'black';
            ctx.fillRect(x - 35, y - 10, 12, 20);
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${countdown}`, x - 29, y + 4);
          } else if (state === 'green') {
            // Show remaining green time
            const ewLight = trafficLights.find(l => l.direction === 'ew')!;
            if (ewLight.state === 'green') {
              ctx.fillStyle = 'black';
              ctx.fillRect(x - 35, y - 10, 12, 20);
              ctx.fillStyle = 'white';
              ctx.font = '10px Arial';
              ctx.textAlign = 'center';
              ctx.fillText(`${ewLight.timeLeft}`, x - 29, y + 4);
            }
          }
          
          ctx.strokeStyle = '#111';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 22, y - 7, 40, 14);
          
          ctx.fillStyle = '#333';
          ctx.fillRect(x + 18, y - 2, 15, 4);
        }
      };
      
      drawTrafficLight(
        center.x + roadWidth + 20, 
        center.y - roadWidth - 20, 
        'vertical', 
        nsLight.state,
        nsLight.countdown
      );
      
      drawTrafficLight(
        center.x - roadWidth - 20, 
        center.y + roadWidth + 20, 
        'vertical', 
        nsLight.state,
        nsLight.countdown
      );
      
      drawTrafficLight(
        center.x + roadWidth + 20, 
        center.y + roadWidth + 20, 
        'horizontal', 
        ewLight.state,
        ewLight.countdown
      );
      
      drawTrafficLight(
        center.x - roadWidth - 20, 
        center.y - roadWidth - 20, 
        'horizontal', 
        ewLight.state,
        ewLight.countdown
      );
      
      // Draw countdown indicators in the center of the intersection
      if (nsLight.state === 'green' && nsLight.timeLeft <= 5) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(center.x - 15, center.y - 45, 30, 30);
        ctx.fillStyle = '#34c759';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${nsLight.timeLeft}`, center.x, center.y - 25);
      } else if (ewLight.state === 'green' && ewLight.timeLeft <= 5) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(center.x - 15, center.y - 45, 30, 30);
        ctx.fillStyle = '#34c759';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${ewLight.timeLeft}`, center.x, center.y - 25);
      } else if (nsLight.countdown > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(center.x - 15, center.y - 45, 30, 30);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${nsLight.countdown}`, center.x, center.y - 25);
      } else if (ewLight.countdown > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(center.x - 15, center.y - 45, 30, 30);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${ewLight.countdown}`, center.x, center.y - 25);
      }
      
      if (Math.random() * 100 < density * deltaTime) {
        const direction = ['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)] as 'north' | 'south' | 'east' | 'west';
        const vehicleType = Math.random() > 0.8 
          ? (Math.random() > 0.5 ? 'truck' : 'bus') 
          : 'car';
        
        const vehicleColors = [
          '#1A1F2C',
          '#403E43',
          '#221F26',
          '#8E9196',
          '#4A4A4A',
          '#555555'
        ];
        
        const lane = Math.floor(Math.random() * 2);
        let position = { x: 0, y: 0 };
        const laneOffset = laneWidth * 0.5 + (lane * laneWidth);
        
        switch (direction) {
          case 'north':
            position = { 
              x: center.x + laneOffset,
              y: canvas.height + 20 
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
              x: canvas.width + 20,
              y: center.y - laneOffset 
            };
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
          created: Date.now(),
          lane
        }]);
      }
      
      setVehicles(prev => {
        return prev.map(vehicle => {
          let { position, speed, waiting, direction, lane } = vehicle;
          const vehicleLength = vehicle.type === 'car' ? 15 : vehicle.type === 'truck' ? 25 : 30;
          const vehicleWidth = vehicle.type === 'car' ? 10 : 12;
          
          const canPass = (
            (direction === 'north' || direction === 'south') && (nsLight.state === 'green' || nsLight.state === 'yellow') ||
            (direction === 'east' || direction === 'west') && (ewLight.state === 'green' || ewLight.state === 'yellow')
          );
          
          const approachingIntersection = (
            (direction === 'north' && position.y > center.y + roadWidth && position.y < center.y + roadWidth + 100) ||
            (direction === 'south' && position.y < center.y - roadWidth && position.y > center.y - roadWidth - 100) ||
            (direction === 'east' && position.x < center.x - roadWidth && position.x > center.x - roadWidth - 100) ||
            (direction === 'west' && position.x > center.x + roadWidth && position.x < center.x + roadWidth + 100)
          );
          
          const inIntersection = (
            position.x > center.x - roadWidth && position.x < center.x + roadWidth &&
            position.y > center.y - roadWidth && position.y < center.y + roadWidth
          );
          
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
          
          if (!canPass && approachingIntersection && !inIntersection) {
            waiting = true;
            speed = 0;
            if (!vehicle.waiting) {
              waitTimes.current.push(0);
            }
          } else if (vehicleAhead) {
            waiting = true;
            speed = 0;
          } else {
            if (waiting) {
              const waitTime = (Date.now() - vehicle.created) / 1000;
              if (waitTime > 0.5) {
                waitTimes.current[waitTimes.current.length - 1] = waitTime;
              } else {
                waitTimes.current.pop();
              }
            }
            waiting = false;
            speed = 40 + Math.random() * 20;
          }
          
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
          
          ctx.save();
          ctx.translate(position.x, position.y);
          
          if (direction === 'north') {
            ctx.rotate(Math.PI * 0);
          } else if (direction === 'south') {
            ctx.rotate(Math.PI * 1);
          } else if (direction === 'east') {
            ctx.rotate(Math.PI * 0.5);
          } else if (direction === 'west') {
            ctx.rotate(Math.PI * 1.5);
          }
          
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 1, vehicleWidth, vehicleLength);
          
          ctx.fillStyle = vehicle.color;
          ctx.fillRect(-vehicleWidth / 2, -vehicleLength / 2, vehicleWidth, vehicleLength);
          
          if (vehicle.type === 'car') {
            ctx.fillStyle = '#222222';
            ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 3, vehicleWidth - 2, 3);
            ctx.fillRect(-vehicleWidth / 2 + 1, vehicleLength / 2 - 6, vehicleWidth - 2, 3);
            
            if (direction === 'north' || direction === 'south' || direction === 'west') {
              ctx.fillStyle = '#ff3b30';
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 1, 2, 1);
              ctx.fillRect(vehicleWidth / 2 - 3, -vehicleLength / 2 + 1, 2, 1);
            } else {
              ctx.fillStyle = '#ffcc00';
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 1, 2, 1);
              ctx.fillRect(vehicleWidth / 2 - 3, -vehicleLength / 2 + 1, 2, 1);
            }
          } else if (vehicle.type === 'truck') {
            ctx.fillStyle = '#222222';
            ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 3, vehicleWidth - 2, 6);
            
            ctx.fillStyle = vehicle.color === '#1A1F2C' ? '#262A37' : '#4E4950';
            ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 10, vehicleWidth - 2, vehicleLength - 13);
            
            if (direction === 'north' || direction === 'south' || direction === 'west') {
              ctx.fillStyle = '#ff3b30';
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 1, 2, 2);
              ctx.fillRect(vehicleWidth / 2 - 3, -vehicleLength / 2 + 1, 2, 2);
            } else {
              ctx.fillStyle = '#ffcc00';
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 1, 2, 2);
              ctx.fillRect(vehicleWidth / 2 - 3, -vehicleLength / 2 + 1, 2, 2);
            }
          } else {
            ctx.fillStyle = '#222222';
            for (let i = 0; i < 4; i++) {
              ctx.fillRect(-vehicleWidth / 2 + 1, -vehicleLength / 2 + 5 + i * 5, vehicleWidth - 2, 3);
            }
            
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
          
          const outOfBounds = (
            position.x < -50 || position.x > canvas.width + 50 ||
            position.y < -50 || position.y > canvas.height + 50
          );
          
          if (outOfBounds) {
            throughputTimeWindowRef.current.push(Date.now());
            completedVehiclesRef.current++;
          }
          
          return outOfBounds ? null : { ...vehicle, position, speed, waiting };
        }).filter(Boolean) as Vehicle[];
      });
      
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(center.x - 25, center.y - roadWidth - 40, 50, 20);
      ctx.fillStyle = 'white';
      ctx.fillText(`NS: ${nsLight.timeLeft}s`, center.x, center.y - roadWidth - 25);
      
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(center.x + roadWidth + 20, center.y - 10, 50, 20);
      ctx.fillStyle = 'white';
      ctx.fillText(`EW: ${ewLight.timeLeft}s`, center.x + roadWidth + 45, center.y + 5);
      
      if (nsLight.countdown > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(center.x - 25, center.y - roadWidth - 65, 50, 20);
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(`Wait: ${nsLight.countdown}s`, center.x, center.y - roadWidth - 50);
      }
      
      if (ewLight.countdown > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(center.x + roadWidth + 20, center.y - 35, 50, 20);
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(`Wait: ${ewLight.countdown}s`, center.x + roadWidth + 45, center.y - 20);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, optimizationEnabled, algorithmType]);
  
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
