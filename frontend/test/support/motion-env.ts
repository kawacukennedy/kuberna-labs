/**
 * Browser APIs the motion layer touches that jsdom does not implement.
 *
 * jsdom has no `matchMedia`, no `ResizeObserver`, no `IntersectionObserver` and
 * no WebGL context; without these stubs every motion test would assert against
 * jsdom's "not implemented" path instead of ours.
 */

export type MatchMap = Record<string, boolean>;

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
export const SMALL_SCREEN = '(max-width: 767px)';
export const ALL_MOTION = 'no-preference';

export const createMatchMedia = (matches: MatchMap) =>
  jest.fn((query: string) => ({
    matches: matches[query] ?? false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

export const installMatchMedia = (matches: MatchMap = {}) => {
  const matchMedia = createMatchMedia(matches);
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia;
  return matchMedia;
};

export type FakeGL = {
  drawArrays: jest.Mock;
  uniform1f: jest.Mock;
  uniform2f: jest.Mock;
  uniform3f: jest.Mock;
  getUniformLocation: jest.Mock;
  getExtension: jest.Mock;
  getContextAttributes: () => { powerPreference?: string };
  __attributes: WebGLContextAttributes | undefined;
  [call: string]: unknown;
};

/**
 * A WebGL context stub that reports successful compilation and linking, so
 * `createRenderer` takes the same branch a real GPU would.
 */
export const createFakeGL = (): FakeGL => {
  const gl = {
    // constants
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    FLOAT: 5126,
    TRIANGLE_STRIP: 5,
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    // calls the shader makes
    createShader: jest.fn(() => ({})),
    shaderSource: jest.fn(),
    compileShader: jest.fn(),
    getShaderParameter: jest.fn(() => true),
    getShaderInfoLog: jest.fn(() => null),
    createProgram: jest.fn(() => ({})),
    attachShader: jest.fn(),
    linkProgram: jest.fn(),
    getProgramParameter: jest.fn(() => true),
    createBuffer: jest.fn(() => ({})),
    bindBuffer: jest.fn(),
    bufferData: jest.fn(),
    getAttribLocation: jest.fn(() => 0),
    enableVertexAttribArray: jest.fn(),
    vertexAttribPointer: jest.fn(),
    useProgram: jest.fn(),
    // Location objects carry their uniform's name, so a test can check which
    // value was written where.
    getUniformLocation: jest.fn((_program: unknown, name: string) => ({ name })),
    uniform1f: jest.fn(),
    uniform2f: jest.fn(),
    uniform3f: jest.fn(),
    viewport: jest.fn(),
    drawArrays: jest.fn(),
    getExtension: jest.fn(() => ({ loseContext: jest.fn() })),
    getContextAttributes: jest.fn(() => ({ powerPreference: 'low-power' })),
  } as unknown as FakeGL;

  return gl;
};

/**
 * Replaces `HTMLCanvasElement.prototype.getContext`. Returns the mock so a test
 * can assert how often the device was probed.
 */
export const stubGetContext = (context: FakeGL | null) => {
  const getContext = jest.fn((..._args: unknown[]) => context);
  Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    writable: true,
    value: getContext,
  });
  return getContext;
};

export type ObserverStub = {
  callback: (entries: Array<Partial<IntersectionObserverEntry>>) => void;
  observe: jest.Mock;
  disconnect: jest.Mock;
};

/**
 * jsdom has no observers; this records the callbacks so a test can drive
 * visibility by hand.
 */
export const stubObservers = () => {
  const intersection: ObserverStub[] = [];
  const resize: Array<{ observe: jest.Mock; disconnect: jest.Mock }> = [];

  class MockIntersectionObserver {
    callback: ObserverStub['callback'];
    observe = jest.fn();
    disconnect = jest.fn();
    unobserve = jest.fn();

    constructor(callback: ObserverStub['callback']) {
      this.callback = callback;
      intersection.push({ callback, observe: this.observe, disconnect: this.disconnect });
    }
  }

  class MockResizeObserver {
    observe = jest.fn();
    disconnect = jest.fn();
    unobserve = jest.fn();
  }

  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

  return { intersection, resize };
};

export const stubAnimationFrame = () => {
  let nextId = 1;
  const callbacks = new Map<number, FrameRequestCallback>();

  const request = jest.fn((callback: FrameRequestCallback) => {
    const id = nextId++;
    callbacks.set(id, callback);
    return id;
  });
  const cancel = jest.fn((id: number) => {
    callbacks.delete(id);
  });

  window.requestAnimationFrame = request as unknown as typeof window.requestAnimationFrame;
  window.cancelAnimationFrame = cancel as unknown as typeof window.cancelAnimationFrame;

  return {
    request,
    cancel,
    pending: () => callbacks.size,
    /** Runs the currently scheduled frame, as a real display would. */
    tick: (time: number) => {
      const scheduled = [...callbacks.entries()];
      callbacks.clear();
      scheduled.forEach(([, callback]) => callback(time));
    },
  };
};

/**
 * jsdom reports a 0x0 box for every element, which would pin the drawing buffer
 * to 1x1 and hide the sizing logic behind it.
 */
export const stubElementSize = (size: { width: number; height: number }) => {
  Object.defineProperty(window.HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    writable: true,
    value: () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: size.width,
      bottom: size.height,
      width: size.width,
      height: size.height,
      toJSON: () => ({}),
    }),
  });
};
