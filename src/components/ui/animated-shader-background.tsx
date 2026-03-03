import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const AnoAI = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(window.innerWidth * pixelRatio, window.innerHeight * pixelRatio) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float iTime;
        uniform vec2 iResolution;
        varying vec2 vUv;

        float rand(vec2 n) {
          return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 u = fract(p);
          u = u*u*(3.0-2.0*u);
          return mix(
            mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
            mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
        }

        float fbm(vec2 x) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 2; ++i) {
            v += a * noise(x);
            x = x * 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 p = (gl_FragCoord.xy - iResolution.xy * 0.5) / iResolution.y;
          vec4 o = vec4(0.0);
          float baseNoise = fbm(p * 2.0 + iTime * 0.1);

          for (float i = 0.0; i < 12.0; i++) {
            float t = iTime * 0.2 + i * 0.1;
            vec2 v = p + vec2(sin(t), cos(t * 0.8)) * 0.5;
            float dist = length(v);
            float intensity = 0.01 / (dist + 0.01);
            vec3 color = vec3(
              0.1 + 0.2 * sin(i * 0.5 + iTime),
              0.4 + 0.3 * cos(i * 0.3 + iTime * 0.5),
              0.6 + 0.4 * sin(i * 0.2 + iTime * 0.8)
            );
            o.rgb += color * intensity * (0.5 + baseNoise * 0.5);
          }
          o.rgb = o.rgb / (1.0 + o.rgb);
          gl_FragColor = vec4(o.rgb, 1.0);
        }
      `
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const clock = new THREE.Clock();
    let frameId: number;
    const animate = () => {
      material.uniforms.iTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pr = Math.min(window.devicePixelRatio, 1.5);
      
      renderer.setPixelRatio(pr);
      renderer.setSize(width, height);
      material.uniforms.iResolution.value.set(width * pr, height * pr);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-black">
      <div className="relative z-10 divider" />
    </div>
  );
};

export default AnoAI;
