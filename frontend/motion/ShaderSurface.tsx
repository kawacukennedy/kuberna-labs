import React, { useEffect, useLayoutEffect, useRef } from "react";
import { BRAND } from "./theme";

/**
 * The aurora shader, with no Remotion in it.
 *
 * This module is deliberately Remotion-free: it is what the live site mounts.
 * `ShaderField` wraps it for Studio and video renders, but importing Remotion
 * just to animate a canvas cost an 82 kB gzip chunk, printed a licence nag into
 * the console, and made the player create an AudioContext it was never allowed
 * to start (which reproduced a warning on every mount and refresh).
 *
 * Two components share one implementation:
 *
 * - `ShaderSurface` is the deterministic frame renderer, driven by a `time`
 *   prop. Remotion uses it so every frame renders identically in Studio, in a
 *   video render and on the site.
 * - `AnimatedShaderSurface` drives its own clock with `requestAnimationFrame`,
 *   sizes its drawing buffer to the space it actually occupies, and stops when
 *   it scrolls out of view.
 */

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform float uIntensity;
uniform float uLight;
uniform vec3 uIndigo;
uniform vec3 uEmerald;
uniform vec3 uAmber;
uniform vec3 uBackground;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float t = uTime;

  vec3 color = uBackground;

  // Weighted aurora accumulation, so the same field can be added (dark) or
  // alpha-composited (light) without blowing out to white.
  vec3 glowColor = vec3(0.0);
  float glowAmount = 0.0;

  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float offset = (fi - 1.0) * 0.26;
    float wobble = sin(p.x * (1.6 + fi * 0.7) + t * (0.35 + fi * 0.11) + fi * 2.1) * 0.16;
    float drift = fbm(p * vec2(2.4, 3.8) + vec2(t * 0.09, -t * 0.05 + fi * 4.0)) - 0.5;
    float band = p.y - offset - wobble - drift * 0.34;
    float width = 0.06 + fi * 0.012;

    float glow = smoothstep(width, 0.0, abs(band));
    glow = pow(glow, 2.4);

    vec3 tint = i == 0 ? uIndigo : (i == 1 ? uEmerald : uAmber);
    float weight = glow * (0.55 - fi * 0.1);

    glowColor += tint * weight;
    glowAmount += weight;
  }

  // Slow breathing orbs that give the field depth.
  float orbA = 1.0 - smoothstep(0.0, 0.95, length(p - vec2(-0.52, 0.32) + vec2(sin(t * 0.21), cos(t * 0.17)) * 0.07));
  float orbB = 1.0 - smoothstep(0.0, 1.05, length(p - vec2(0.55, -0.28) + vec2(cos(t * 0.19), sin(t * 0.23)) * 0.08));
  float orbC = 1.0 - smoothstep(0.0, 0.7, length(p - vec2(0.18, 0.52) + vec2(sin(t * 0.13), cos(t * 0.15)) * 0.05));

  glowColor += uIndigo * orbA * 0.34 + uEmerald * orbB * 0.28 + uAmber * orbC * 0.18;
  glowAmount += orbA * 0.34 + orbB * 0.28 + orbC * 0.18;

  if (uLight > 0.5) {
    vec3 average = glowColor / max(glowAmount, 0.0001);
    // Push saturation so the field reads as brand colour rather than grey wash.
    float luma = dot(average, vec3(0.299, 0.587, 0.114));
    average = clamp(mix(vec3(luma), average, 1.7), 0.0, 1.0);
    float alpha = clamp(glowAmount * 0.72, 0.0, 0.70);
    color = mix(color, average, alpha * uIntensity);
    // Faint grain in the same direction as the paper tone.
    color += (hash(vUv * uResolution + t) - 0.5) * 0.012;
  } else {
    color += glowColor * uIntensity;
    color += (hash(vUv * uResolution + t) - 0.5) * 0.022;
  }

  // Soft vignette.
  float vignette = smoothstep(1.25, 0.25, length(p));
  color *= mix(0.82, 1.0, vignette);

  gl_FragColor = vec4(color, 1.0);
}
`;

export type ShaderTone = "dark" | "light";

type ShaderRenderer = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: {
    uTime: WebGLUniformLocation | null;
    uResolution: WebGLUniformLocation | null;
    uIntensity: WebGLUniformLocation | null;
    uLight: WebGLUniformLocation | null;
  };
};

const compileShader = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) {
    throw new Error("Could not allocate a shader.");
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Shader failed to compile: ${gl.getShaderInfoLog(shader) ?? "unknown error"}`);
  }
  return shader;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const value = parseInt(hex.replace("#", ""), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
};

/**
 * Builds the program on the canvas's own context. Returns `null` instead of
 * throwing when the device has no WebGL, so a decoration never surfaces as an
 * error in the console.
 */
const createRenderer = (canvas: HTMLCanvasElement, tone: ShaderTone): ShaderRenderer | null => {
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      // Decoration, not a game: keep laptops on their integrated GPU rather
      // than waking the discrete one for a background.
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    }) as WebGLRenderingContext | null;
  } catch {
    gl = null;
  }
  if (!gl) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    return null;
  }

  try {
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return null;
    }
  } catch {
    return null;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const [ir, ig, ib] = hexToRgb(BRAND.indigo);
  const [er, eg, eb] = hexToRgb(BRAND.emerald);
  const [ar, ag, ab] = hexToRgb(BRAND.amber);
  const [br, bg, bb] = hexToRgb(tone === "light" ? BRAND.paper : BRAND.ink);

  gl.useProgram(program);
  gl.uniform3f(gl.getUniformLocation(program, "uIndigo"), ir, ig, ib);
  gl.uniform3f(gl.getUniformLocation(program, "uEmerald"), er, eg, eb);
  gl.uniform3f(gl.getUniformLocation(program, "uAmber"), ar, ag, ab);
  gl.uniform3f(gl.getUniformLocation(program, "uBackground"), br, bg, bb);

  return {
    gl,
    program,
    uniforms: {
      uTime: gl.getUniformLocation(program, "uTime"),
      uResolution: gl.getUniformLocation(program, "uResolution"),
      uIntensity: gl.getUniformLocation(program, "uIntensity"),
      uLight: gl.getUniformLocation(program, "uLight"),
    },
  };
};

const paint = (renderer: ShaderRenderer, tone: ShaderTone, intensity: number, time: number) => {
  const { gl, program, uniforms } = renderer;
  gl.useProgram(program);
  gl.uniform1f(uniforms.uTime, time);
  gl.uniform2f(uniforms.uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.uniform1f(uniforms.uIntensity, intensity);
  gl.uniform1f(uniforms.uLight, tone === "light" ? 1 : 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

export type ShaderSurfaceProps = {
  /** Time in seconds; the frame is a pure function of it. */
  time: number;
  /** Drawing-buffer size in device pixels. */
  width: number;
  height: number;
  tone?: ShaderTone;
  intensity?: number;
};

/** One deterministic shader frame, sized by the caller (Remotion). */
export const ShaderSurface: React.FC<ShaderSurfaceProps> = ({
  time,
  width,
  height,
  tone = "dark",
  intensity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ShaderRenderer | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    if (!rendererRef.current) {
      rendererRef.current = createRenderer(canvas, tone);
    }
    const renderer = rendererRef.current;
    if (!renderer) {
      return;
    }
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    renderer.gl.viewport(0, 0, width, height);
    paint(renderer, tone, intensity, time);
  }, [time, width, height, tone, intensity]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
};

export type AnimatedShaderSurfaceProps = {
  tone?: ShaderTone;
  intensity?: number;
  className?: string;
};

/**
 * The shader on a self-driven clock.
 *
 * The drawing buffer follows the element's real size (capped at 2x for
 * crispness) instead of a fixed 1920x1080 composition: the lifecycle panel is
 * about 400px wide, and rendering four megapixels into it was pure waste on the
 * machines this most needs to be smooth on.
 */
export const AnimatedShaderSurface: React.FC<AnimatedShaderSurfaceProps> = ({
  tone = "dark",
  intensity = 1,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ShaderRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    rendererRef.current = createRenderer(canvas, tone);
    const renderer = rendererRef.current;
    if (!renderer) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const host = canvas.parentElement ?? canvas;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width === width && canvas.height === height) {
        return;
      }
      canvas.width = width;
      canvas.height = height;
      renderer.gl.viewport(0, 0, width, height);
      paint(renderer, tone, intensity, elapsed());
    };

    let start = performance.now();
    const elapsed = () => (performance.now() - start) / 1000;

    resize();
    paint(renderer, tone, intensity, 0);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    let frameId = 0;
    let visible = true;

    const loop = () => {
      paint(renderer, tone, intensity, elapsed());
      frameId = requestAnimationFrame(loop);
    };

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        if (entry.isIntersecting && !visible) {
          visible = true;
          start = performance.now() - 1000;
          frameId = requestAnimationFrame(loop);
        } else if (!entry.isIntersecting && visible) {
          visible = false;
          cancelAnimationFrame(frameId);
        }
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(host);

    if (!reducedMotion) {
      frameId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      rendererRef.current = null;
    };
  }, [tone, intensity]);

  return <canvas ref={canvasRef} className={className} style={{ display: "block", width: "100%", height: "100%" }} />;
};
