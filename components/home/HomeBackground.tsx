"use client";

import { InteractiveNebulaShader } from "@/components/ui/liquid-shader";

export default function HomeBackground() {
  return (
    <div 
      className="absolute left-0 right-0 -z-10 pointer-events-none" 
      style={{ 
        top: '-150px',
        height: 'calc(100% + 150px)'
      }}
    >
      <InteractiveNebulaShader 
        disableCenterDimming={true}
        className="h-full"
        fullPage={true}
        speed={0.3}
        spread={true}
      />
    </div>
  );
}
