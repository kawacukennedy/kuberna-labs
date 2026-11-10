import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "./theme";

/**
 * Immersive aurora field.
 *
 * The whole image is produced by a single fragment shader whose only time
 * source is `frame / fps` from Remotion, so every frame is deterministic and
 * renders identically in Studio, the <Player>, and a video render.
 *
 * Two tones share one shader: `dark` adds light on top of ink (cinematic
 * renders), `light` alpha-composites the same field over paper so it can sit
 * under the light-theme site without washing out text.
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
    float drift = fbm(p * vec2(1.4, 2.2) + vec2(t * 0.09, -t * 0.05 + fi * 4.0)) - 0.5;
    float band = p.y - offset - wobble - drift * 0.42;
    float width = 0.085 + fi * 0.015;

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
    float alpha = clamp(glowAmount * 0.55, 0.0, 0.62);
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

export type ShaderFieldProps = {
  intensity?: number;
  /** `dark` for cinematic renders, `light` for the light-theme site. */
  tone?: "dark" | "light";
};

type ShaderState = {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uniforms: {
    uTime: WebGLUniformLocation | null;
    uResolution: WebGLUniformLocation | null;
    uIntensity: WebGLUniformLocation | null;
    uLight: WebGLUniformLocation | null;
  };
  tone: "dark" | "light";
};

export const ShaderField: React.FC<ShaderFieldProps> = ({ intensity = 1, tone = "dark" }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ShaderState | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    if (stateRef.current && stateRef.current.tone !== tone) {
      // The background tone is baked into a uniform at setup time.
      stateRef.current = null;
      delete canvas.dataset.tone;
    }

    if (!stateRef.current) {
      const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
      if (!gl) {
        return;
      }

      const program = gl.createProgram();
      if (!program) {
        return;
      }

      gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Shader program failed to link: ${gl.getProgramInfoLog(program) ?? "unknown error"}`);
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

      stateRef.current = {
        gl,
        program,
        tone,
        uniforms: {
          uTime: gl.getUniformLocation(program, "uTime"),
          uResolution: gl.getUniformLocation(program, "uResolution"),
          uIntensity: gl.getUniformLocation(program, "uIntensity"),
          uLight: gl.getUniformLocation(program, "uLight"),
        },
      };
    }

    const state = stateRef.current;
    if (!state) {
      return;
    }

    const { gl, program, uniforms } = state;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    gl.viewport(0, 0, width, height);
    gl.useProgram(program);
    gl.uniform1f(uniforms.uTime, frame / fps);
    gl.uniform2f(uniforms.uResolution, width, height);
    gl.uniform1f(uniforms.uIntensity, intensity);
    gl.uniform1f(uniforms.uLight, tone === "light" ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }, [frame, fps, width, height, intensity, tone]);

  return (
    <AbsoluteFill>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </AbsoluteFill>
  );
};
