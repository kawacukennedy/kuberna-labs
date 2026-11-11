import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import React from 'react';
import { AnimatedShaderSurface, ShaderSurface } from '../motion/ShaderSurface';
import {
  FakeGL,
  REDUCED_MOTION,
  createFakeGL,
  installMatchMedia,
  stubAnimationFrame,
  stubElementSize,
  stubGetContext,
  stubObservers,
} from './support/motion-env';

/**
 * `motion/ShaderSurface.tsx` is what replaced Remotion's `<Player>` on the live
 * site, so these tests cover the promises that swap made: no Remotion, no
 * thrown errors on a device without WebGL, one frame under reduced motion, a
 * drawing buffer that matches the element, and nothing drawn off-screen.
 */

const uniformValue = (gl: FakeGL, name: string, setter: string) => {
  const mock = gl[setter] as jest.Mock;
  const call = mock.mock.calls.find((args: unknown[]) => {
    const location = args[0] as { name?: string } | null;
    return location?.name === name;
  });
  return call?.[1];
};

describe('ShaderSurface', () => {
  let gl: FakeGL;

  beforeEach(() => {
    gl = createFakeGL();
    stubGetContext(gl);
  });

  it('renders one frame at the size the caller asked for', () => {
    const { container } = render(<ShaderSurface time={0} width={640} height={360} tone="light" />);

    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas).not.toBeNull();
    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(360);
    expect(gl.drawArrays).toHaveBeenCalled();
    expect(uniformValue(gl, 'uLight', 'uniform1f')).toBe(1);
  });

  it('is a pure function of `time`, so video renders stay deterministic', () => {
    const { rerender } = render(<ShaderSurface time={1.5} width={320} height={200} />);
    expect(uniformValue(gl, 'uTime', 'uniform1f')).toBe(1.5);

    gl.uniform1f.mockClear();
    rerender(<ShaderSurface time={2.5} width={320} height={200} />);
    expect(uniformValue(gl, 'uTime', 'uniform1f')).toBe(2.5);
  });

  it('renders a blank canvas rather than throwing when WebGL is missing', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    stubGetContext(null);

    const { container } = render(<ShaderSurface time={0} width={320} height={200} />);

    expect(container.querySelector('canvas')).not.toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('imports nothing from Remotion', () => {
    // A static import of `@remotion/player` here is what used to pull an 82 kB
    // gzip chunk, a licence nag and an AudioContext warning into every page.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const source: string = require('fs').readFileSync(
      require('path').join(__dirname, '../motion/ShaderSurface.tsx'),
      'utf8'
    );

    expect(source).not.toMatch(/(from|require\()\s*["']@?remotion/i);
  });
});

describe('AnimatedShaderSurface', () => {
  let gl: FakeGL;

  beforeEach(() => {
    gl = createFakeGL();
    stubGetContext(gl);
    stubObservers();
    installMatchMedia();
    stubAnimationFrame();
    stubElementSize({ width: 400, height: 300 });
  });

  const renderSurface = () => render(<AnimatedShaderSurface tone="light" intensity={0.9} />);

  it('asks for a low-power, opaque, non-antialiased context', () => {
    renderSurface();

    // Decoration, not a game: the shader should not wake a discrete GPU or pay
    // for blending it never uses.
    const getContext = window.HTMLCanvasElement.prototype.getContext as unknown as jest.Mock;
    expect(getContext).toHaveBeenCalledWith(
      'webgl',
      expect.objectContaining({ antialias: false, alpha: false, powerPreference: 'low-power' })
    );
  });

  it('sizes the drawing buffer to the element, capped at 2x', () => {
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, value: 3 });

    const { container } = renderSurface();
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    // 400x300 at a 3x device pixel ratio, capped at 2x.
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });

  it('animates continuously when motion is allowed', () => {
    const raf = stubAnimationFrame();
    renderSurface();

    expect(raf.request).toHaveBeenCalled();
    expect(gl.drawArrays).toHaveBeenCalled();

    gl.drawArrays.mockClear();
    raf.tick(16);
    expect(gl.drawArrays).toHaveBeenCalled();
  });

  it('paints a single frame and never animates under reduced motion', () => {
    installMatchMedia({ [REDUCED_MOTION]: true });
    const raf = stubAnimationFrame();

    renderSurface();

    expect(gl.drawArrays).toHaveBeenCalled();
    expect(raf.request).not.toHaveBeenCalled();
  });

  it('stops drawing when it scrolls out of view and resumes when it returns', () => {
    const raf = stubAnimationFrame();
    const { intersection } = stubObservers();
    renderSurface();

    expect(intersection).toHaveLength(1);
    const observer = intersection[0];

    observer.callback([{ isIntersecting: false }]);
    gl.drawArrays.mockClear();

    // The loop was cancelled, so no further frame is queued or drawn.
    expect(raf.pending()).toBe(0);
    raf.tick(32);
    expect(gl.drawArrays).not.toHaveBeenCalled();

    observer.callback([{ isIntersecting: true }]);
    raf.tick(48);
    expect(gl.drawArrays).toHaveBeenCalled();
  });

  it('renders nothing when the device cannot give it a context', () => {
    stubGetContext(null);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = renderSurface();

    expect(container.querySelector('canvas')).not.toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
