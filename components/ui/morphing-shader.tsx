"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export interface MorphingShaderProps {
  className?: string;
  speed?: number;
}

/**
 * Morphing liquid shader that changes shape over time.
 * Designed for homepage background - scrolls with content.
 */
export function MorphingShader({
  className = "",
  speed = 0.3,
}: MorphingShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    // Morphing shapes shader - organic, flowing forms that change over time
    const fragmentShader = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float iScroll;
      varying vec2 vUv;

      // Simplex noise
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
        
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
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

      // SDF functions for morphing shapes
      float sdEllipse(vec2 p, vec2 ab) {
        p = abs(p);
        if (p.x > p.y) { p = p.yx; ab = ab.yx; }
        float l = ab.y*ab.y - ab.x*ab.x;
        float m = ab.x*p.x/l;
        float n = ab.y*p.y/l;
        float m2 = m*m;
        float n2 = n*n;
        float c = (m2 + n2 - 1.0)/3.0;
        float c3 = c*c*c;
        float q = c3 + m2*n2*2.0;
        float d = c3 + m2*n2;
        float g = m + m*n2;
        float co;
        if (d < 0.0) {
          float h = acos(q/c3)/3.0;
          float s = cos(h);
          float t = sin(h)*sqrt(3.0);
          float rx = sqrt(-c*(s + t + 2.0) + m2);
          float ry = sqrt(-c*(s - t + 2.0) + m2);
          co = (ry + sign(l)*rx + abs(g)/(rx*ry) - m)/2.0;
        } else {
          float h = 2.0*m*n*sqrt(d);
          float s = sign(q + h)*pow(abs(q + h), 1.0/3.0);
          float u = sign(q - h)*pow(abs(q - h), 1.0/3.0);
          float rx = -s - u - c*4.0 + 2.0*m2;
          float ry = (s - u)*sqrt(3.0);
          float rm = sqrt(rx*rx + ry*ry);
          co = (ry/sqrt(rm - rx) + 2.0*g/rm - m)/2.0;
        }
        vec2 r = ab * vec2(co, sqrt(1.0 - co*co));
        return length(r - p) * sign(p.y - r.y);
      }

      float sdStar(vec2 p, float r, int n, float m) {
        float an = 3.141593 / float(n);
        float en = 3.141593 / m;
        vec2 acs = vec2(cos(an), sin(an));
        vec2 ecs = vec2(cos(en), sin(en));
        float bn = mod(atan(p.x, p.y), 2.0*an) - an;
        p = length(p) * vec2(cos(bn), abs(sin(bn)));
        p -= r * acs;
        p += ecs * clamp(-dot(p, ecs), 0.0, r * acs.y / ecs.y);
        return length(p) * sign(p.x);
      }

      void main() {
        vec2 uv = vUv;
        float t = iTime;
        
        // Scroll offset
        float scrollOffset = iScroll * 0.0003;
        uv.y += scrollOffset;
        
        // Multiple morphing blob centers that move over time
        vec2 center1 = vec2(
          0.3 + 0.2 * sin(t * 0.5) + 0.1 * cos(t * 0.7),
          0.4 + 0.2 * cos(t * 0.4) + 0.1 * sin(t * 0.6)
        );
        vec2 center2 = vec2(
          0.7 + 0.15 * cos(t * 0.6) + 0.1 * sin(t * 0.8),
          0.6 + 0.2 * sin(t * 0.5) + 0.1 * cos(t * 0.7)
        );
        vec2 center3 = vec2(
          0.5 + 0.25 * sin(t * 0.3),
          0.3 + 0.15 * cos(t * 0.4)
        );
        
        // Morphing shape parameters - change over time
        float morph = sin(t * 0.2) * 0.5 + 0.5; // 0 to 1 morphing factor
        float morph2 = cos(t * 0.15) * 0.5 + 0.5;
        float morph3 = sin(t * 0.25 + 1.0) * 0.5 + 0.5;
        
        // Dynamic sizes
        float size1 = 0.15 + 0.08 * sin(t * 0.3);
        float size2 = 0.12 + 0.06 * cos(t * 0.4);
        float size3 = 0.18 + 0.1 * sin(t * 0.2);
        
        // Calculate distances with morphing shapes
        vec2 p1 = uv - center1;
        vec2 p2 = uv - center2;
        vec2 p3 = uv - center3;
        
        // Rotate shapes over time
        float angle1 = t * 0.2;
        float angle2 = -t * 0.15;
        float angle3 = t * 0.1;
        
        mat2 rot1 = mat2(cos(angle1), -sin(angle1), sin(angle1), cos(angle1));
        mat2 rot2 = mat2(cos(angle2), -sin(angle2), sin(angle2), cos(angle2));
        mat2 rot3 = mat2(cos(angle3), -sin(angle3), sin(angle3), cos(angle3));
        
        p1 = rot1 * p1;
        p2 = rot2 * p2;
        p3 = rot3 * p3;
        
        // Morph between circle and ellipse
        float d1 = mix(
          length(p1) - size1,
          sdEllipse(p1, vec2(size1 * 1.5, size1 * 0.7)),
          morph
        );
        
        float d2 = mix(
          length(p2) - size2,
          sdEllipse(p2, vec2(size2 * 0.6, size2 * 1.4)),
          morph2
        );
        
        // Third shape morphs more dramatically
        float d3 = mix(
          length(p3) - size3,
          sdEllipse(p3, vec2(size3 * (1.0 + 0.5 * sin(t * 0.3)), size3 * (1.0 + 0.5 * cos(t * 0.4)))),
          morph3
        );
        
        // Add noise distortion to edges
        float noise1 = snoise(vec3(uv * 3.0, t * 0.3)) * 0.05;
        float noise2 = snoise(vec3(uv * 4.0 + 100.0, t * 0.25)) * 0.04;
        float noise3 = snoise(vec3(uv * 2.5 + 200.0, t * 0.35)) * 0.06;
        
        d1 += noise1;
        d2 += noise2;
        d3 += noise3;
        
        // Smooth union of shapes
        float k = 0.15;
        float h1 = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
        float d12 = mix(d2, d1, h1) - k * h1 * (1.0 - h1);
        
        float h2 = clamp(0.5 + 0.5 * (d3 - d12) / k, 0.0, 1.0);
        float finalD = mix(d3, d12, h2) - k * h2 * (1.0 - h2);
        
        // Colors - emerald palette
        vec3 darkGreen = vec3(0.008, 0.07, 0.05);
        vec3 emeraldDark = vec3(0.02, 0.12, 0.08);
        vec3 emeraldMid = vec3(0.04, 0.28, 0.18);
        vec3 emeraldBright = vec3(0.063, 0.725, 0.506);
        vec3 emeraldGlow = vec3(0.204, 0.827, 0.6);
        
        // Create gradient based on distance
        vec3 color = darkGreen;
        
        float edge = smoothstep(0.1, -0.05, finalD);
        float core = smoothstep(0.0, -0.15, finalD);
        float innerGlow = smoothstep(-0.05, -0.2, finalD);
        
        color = mix(color, emeraldDark, edge * 0.8);
        color = mix(color, emeraldMid, core * 0.7);
        color = mix(color, emeraldBright, innerGlow * 0.4);
        
        // Add subtle glow around shapes
        float glow = exp(-finalD * 8.0) * 0.3;
        color += emeraldGlow * glow * (0.5 + 0.5 * sin(t * 0.5));
        
        // Add flowing background noise
        float bgNoise = snoise(vec3(uv * 1.5, t * 0.1)) * 0.5 + 0.5;
        color += emeraldDark * bgNoise * 0.15;
        
        // Subtle pulsing
        float pulse = sin(t * 0.8) * 0.5 + 0.5;
        color *= 0.9 + pulse * 0.1;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new THREE.Vector2() },
      iScroll: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
    };

    const onScroll = () => {
      uniforms.iScroll.value = window.scrollY;
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    onResize();
    onScroll();

    renderer.setAnimationLoop(() => {
      uniforms.iTime.value = clock.getElapsedTime() * speedRef.current;
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
      className={`absolute inset-0 w-full h-full -z-10 ${className}`}
      style={{ backgroundColor: "#021C14" }}
      aria-label="Morphing shader background"
    />
  );
}
