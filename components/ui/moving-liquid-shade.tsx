"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface MovingLiquidShadeProps {
  className?: string;
}

/**
 * Full-page moving liquid shade effect that flows across the entire page.
 * Uses WebGL for smooth animated gradients with emerald theme.
 */
export function MovingLiquidShade({ className = "" }: MovingLiquidShadeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    // Vertex shader
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // Fragment shader - creates flowing liquid shade effect
    const fragmentShader = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform vec2 iScroll;
      varying vec2 vUv;

      // Simplex noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        vec2 uv = vUv;
        
        // Account for page scroll - moves the pattern
        vec2 scrollOffset = iScroll / iResolution;
        uv += scrollOffset * 0.5;
        
        // Time-based movement
        float t = iTime * 0.15;
        
        // Create flowing liquid effect with multiple noise layers
        float scale1 = 1.5;
        float scale2 = 2.5;
        float scale3 = 4.0;
        
        // Layer 1 - large flowing shapes
        float noise1 = snoise(vec3(uv * scale1 + t * 0.3, t * 0.2)) * 0.5 + 0.5;
        
        // Layer 2 - medium detail
        float noise2 = snoise(vec3(uv * scale2 - t * 0.2, t * 0.3 + 100.0)) * 0.5 + 0.5;
        
        // Layer 3 - fine detail
        float noise3 = snoise(vec3(uv * scale3 + t * 0.1, t * 0.15 + 200.0)) * 0.5 + 0.5;
        
        // Combine layers with different weights
        float combinedNoise = noise1 * 0.5 + noise2 * 0.35 + noise3 * 0.15;
        
        // Create flowing movement pattern
        float flowX = sin(uv.y * 3.0 + t * 2.0) * 0.1;
        float flowY = cos(uv.x * 2.5 + t * 1.5) * 0.1;
        vec2 flowUv = uv + vec2(flowX, flowY);
        
        float flowNoise = snoise(vec3(flowUv * 2.0, t * 0.25)) * 0.5 + 0.5;
        
        // Blend flow with combined noise
        float finalNoise = mix(combinedNoise, flowNoise, 0.4);
        
        // Create color gradient based on noise
        // Emerald color palette
        vec3 darkGreen = vec3(0.008, 0.07, 0.05);      // Very dark green base
        vec3 emeraldDark = vec3(0.02, 0.15, 0.1);      // Dark emerald
        vec3 emeraldMid = vec3(0.04, 0.35, 0.25);      // Mid emerald
        vec3 emeraldBright = vec3(0.063, 0.725, 0.506); // Bright emerald #10B981
        vec3 emeraldGlow = vec3(0.204, 0.827, 0.6);    // Glow emerald #34D399
        
        // Create gradient based on noise value
        vec3 color;
        if (finalNoise < 0.3) {
          color = mix(darkGreen, emeraldDark, finalNoise / 0.3);
        } else if (finalNoise < 0.5) {
          color = mix(emeraldDark, emeraldMid, (finalNoise - 0.3) / 0.2);
        } else if (finalNoise < 0.7) {
          color = mix(emeraldMid, emeraldBright, (finalNoise - 0.5) / 0.2);
        } else {
          color = mix(emeraldBright, emeraldGlow, (finalNoise - 0.7) / 0.3);
        }
        
        // Add subtle pulsing glow
        float pulse = sin(t * 3.0) * 0.5 + 0.5;
        float glowIntensity = smoothstep(0.6, 0.9, finalNoise) * pulse * 0.15;
        color += emeraldGlow * glowIntensity;
        
        // Add vignette effect (darker at edges)
        vec2 vignetteUv = vUv * 2.0 - 1.0;
        float vignette = 1.0 - dot(vignetteUv, vignetteUv) * 0.2;
        color *= vignette;
        
        // Output with slight transparency for layering
        float alpha = 0.85 + finalNoise * 0.15;
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    // Uniforms
    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iScroll: { value: new THREE.Vector2(0, 0) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    // Resize handler
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
    };

    // Scroll handler - updates the shade position based on scroll
    const onScroll = () => {
      uniforms.iScroll.value.set(window.scrollX, window.scrollY);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    onResize();
    onScroll();

    // Animation loop
    renderer.setAnimationLoop(() => {
      uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      renderer.setAnimationLoop(null);
      container.removeChild(renderer.domElement);
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{ 
        backgroundColor: "#021C14",
        zIndex: 0,
      }}
      aria-label="Moving liquid shade background"
    />
  );
}
