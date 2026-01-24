import { useEffect, useRef, memo } from 'react';
import { Renderer, Program, Mesh, Color, Triangle } from 'ogl';

/**
 * GlobalBackground - Full viewport Galaxy background
 * Fixed position, covers entire screen, responds to cursor
 * Optimized for performance with transparent overlay
 */

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uMouseActive;

varying vec2 vUv;

#define NUM_LAYERS 4.0
#define PI 3.14159265359

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float star(vec2 uv, float flare) {
  float d = length(uv);
  float m = 0.02 / d;
  
  float rays = max(0.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare;
  
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 starLayer(vec2 uv, float time) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  
  for(int y = -1; y <= 1; y++) {
    for(int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      float n = hash21(id + offset);
      float size = fract(n * 345.32);
      
      // Twinkle effect
      float twinkle = sin(time * (n * 2.0 + 1.0) + n * 6.28) * 0.5 + 0.5;
      twinkle = mix(0.5, 1.0, twinkle);
      
      // Color variation - blues and purples
      float hue = 0.6 + n * 0.2;
      vec3 starColor = hsv2rgb(vec3(hue, 0.3, 1.0));
      
      vec2 p = gv - offset - vec2(n, fract(n * 34.0)) + 0.5;
      float s = star(p, smoothstep(0.8, 1.0, size) * twinkle);
      
      col += s * size * starColor * twinkle;
    }
  }
  return col;
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  
  // Mouse parallax effect
  vec2 mouseOffset = (uMouse - 0.5) * 0.1 * uMouseActive;
  uv += mouseOffset;
  
  // Mouse repulsion
  vec2 mouseUV = (uMouse - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float mouseDist = length(uv - mouseUV);
  vec2 repulsion = normalize(uv - mouseUV) * (0.3 / (mouseDist + 0.3)) * uMouseActive;
  uv += repulsion * 0.02;
  
  // Slow rotation
  float angle = uTime * 0.02;
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  uv = rot * uv;
  
  vec3 col = vec3(0.0);
  
  // Multiple star layers with depth
  for(float i = 0.0; i < 1.0; i += 1.0/NUM_LAYERS) {
    float depth = fract(i + uTime * 0.02);
    float scale = mix(15.0, 2.0, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    col += starLayer(uv * scale + i * 453.32, uTime) * fade;
  }
  
  // Subtle nebula glow
  float nebula = smoothstep(0.5, 0.0, length(uv + mouseOffset * 0.5));
  col += vec3(0.1, 0.05, 0.2) * nebula * 0.3;
  
  // Vignette
  float vignette = 1.0 - smoothstep(0.4, 1.2, length(vUv - 0.5) * 1.5);
  col *= vignette;
  
  gl_FragColor = vec4(col, 1.0);
}
`;

const GlobalBackground = memo(function GlobalBackground() {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const mouseActiveRef = useRef(0);
  const smoothMouseActiveRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const renderer = new Renderer({ alpha: false, antialias: false });
    const gl = renderer.gl;
    gl.clearColor(0.01, 0.02, 0.05, 1);
    
    let program;
    
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (program) {
        program.uniforms.uResolution.value = new Color(
          gl.canvas.width,
          gl.canvas.height,
          gl.canvas.width / gl.canvas.height
        );
      }
    };
    
    window.addEventListener('resize', resize);
    resize();
    
    const geometry = new Triangle(gl);
    program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseActive: { value: 0 }
      }
    });
    
    const mesh = new Mesh(gl, { geometry, program });
    container.appendChild(gl.canvas);
    
    let animationId;
    const animate = (time) => {
      animationId = requestAnimationFrame(animate);
      
      // Smooth mouse interpolation
      const lerp = 0.05;
      smoothMouseRef.current.x += (mouseRef.current.x - smoothMouseRef.current.x) * lerp;
      smoothMouseRef.current.y += (mouseRef.current.y - smoothMouseRef.current.y) * lerp;
      smoothMouseActiveRef.current += (mouseActiveRef.current - smoothMouseActiveRef.current) * lerp;
      
      program.uniforms.uTime.value = time * 0.001;
      program.uniforms.uMouse.value[0] = smoothMouseRef.current.x;
      program.uniforms.uMouse.value[1] = smoothMouseRef.current.y;
      program.uniforms.uMouseActive.value = smoothMouseActiveRef.current;
      
      renderer.render({ scene: mesh });
    };
    animationId = requestAnimationFrame(animate);
    
    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1 - e.clientY / window.innerHeight;
      mouseActiveRef.current = 1;
    };
    
    const handleMouseLeave = () => {
      mouseActiveRef.current = 0;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="global-background"
      aria-hidden="true"
    />
  );
});

export default GlobalBackground;
