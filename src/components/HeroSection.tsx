
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const animationContainer = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (animationContainer.current) {
        const trafficLights = Array.from(animationContainer.current.querySelectorAll('.traffic-light'));
        trafficLights.forEach((light) => {
          const currentColor = light.getAttribute('data-color');
          const newColor = currentColor === 'red' ? 'green' : currentColor === 'green' ? 'yellow' : 'red';
          light.setAttribute('data-color', newColor);
          
          // Update the active circle
          const circles = Array.from(light.querySelectorAll('.circle'));
          circles.forEach((circle, index) => {
            const shouldBeActive = 
              (newColor === 'red' && index === 0) || 
              (newColor === 'yellow' && index === 1) || 
              (newColor === 'green' && index === 2);
            circle.classList.toggle('opacity-100', shouldBeActive);
            circle.classList.toggle('opacity-30', !shouldBeActive);
          });
        });
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-full h-full bg-grid-pattern opacity-5"></div>
      </div>
      
      <div className="container max-w-6xl mx-auto z-10 px-4 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="chip bg-accent/10 text-accent inline-block">
              AI-Powered Traffic Optimization
            </div>
            <h1 className="heading-xl">
              Reimagining Urban <br className="hidden sm:block" /> 
              Traffic Flow
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              Our AI-driven traffic simulation optimizes intersection management, 
              reducing congestion and driving economic growth through smarter infrastructure.
            </p>
            <div className="flex gap-4 pt-4">
              <Button className="rounded-full text-white bg-accent hover:bg-accent/90 px-8 h-12">
                Explore Demo
              </Button>
              <Button variant="outline" className="rounded-full border-border px-8 h-12">
                Learn More
              </Button>
            </div>
          </div>
          
          <div 
            ref={animationContainer}
            className="relative h-[400px] animate-fade-in"
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="relative w-full h-full">
                {/* Road layout */}
                <div className="absolute top-1/2 left-0 right-0 h-14 bg-gray-700 transform -translate-y-1/2"></div>
                <div className="absolute top-0 bottom-0 left-1/2 w-14 bg-gray-700 transform -translate-x-1/2"></div>
                
                {/* Road markings */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400 transform -translate-y-1/2 dashed-line"></div>
                <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-yellow-400 transform -translate-x-1/2 dashed-line"></div>
                
                {/* Traffic lights */}
                <div className="traffic-light" data-color="red">
                  <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 w-6 h-14 rounded-md flex flex-col justify-around items-center p-1">
                    <div className="circle w-4 h-4 rounded-full bg-red-500 opacity-100"></div>
                    <div className="circle w-4 h-4 rounded-full bg-yellow-500 opacity-30"></div>
                    <div className="circle w-4 h-4 rounded-full bg-green-500 opacity-30"></div>
                  </div>
                </div>
                
                <div className="traffic-light" data-color="green">
                  <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 bg-black/80 w-6 h-14 rounded-md flex flex-col justify-around items-center p-1">
                    <div className="circle w-4 h-4 rounded-full bg-red-500 opacity-30"></div>
                    <div className="circle w-4 h-4 rounded-full bg-yellow-500 opacity-30"></div>
                    <div className="circle w-4 h-4 rounded-full bg-green-500 opacity-100"></div>
                  </div>
                </div>
                
                {/* Cars */}
                <div className="absolute w-8 h-5 bg-blue-500 rounded-sm left-8 top-[calc(50%-10px)] animate-[car-move-right_5s_linear_infinite]"></div>
                <div className="absolute w-8 h-5 bg-red-500 rounded-sm right-8 top-[calc(50%+5px)] animate-[car-move-left_6s_linear_infinite]"></div>
                <div className="absolute w-5 h-8 bg-green-500 rounded-sm top-8 left-[calc(50%-10px)] animate-[car-move-down_7s_linear_infinite]"></div>
                <div className="absolute w-5 h-8 bg-yellow-500 rounded-sm bottom-8 left-[calc(50%+5px)] animate-[car-move-up_5.5s_linear_infinite]"></div>
                
                {/* Data visualization */}
                <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                  Optimizing...
                </div>
              </div>
            </div>
            
            {/* Floating elements for visual interest */}
            <div className="absolute top-1/4 right-1/4 w-16 h-16 rounded-full bg-accent/10 backdrop-blur-md animate-float delay-200"></div>
            <div className="absolute bottom-1/3 left-1/3 w-20 h-20 rounded-full bg-primary/5 backdrop-blur-md animate-float delay-500"></div>
            <div className="absolute top-1/2 left-1/5 w-12 h-12 rounded-lg bg-accent/5 backdrop-blur-md animate-float"></div>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <path d="M12 5v14"></path>
          <path d="m19 12-7 7-7-7"></path>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
