import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import React from 'react';
import { useMotionTier } from '../src/components/motion/capabilities';
import {
  REDUCED_MOTION,
  SMALL_SCREEN,
  createFakeGL,
  installMatchMedia,
  stubGetContext,
} from './support/motion-env';

/**
 * `detectMotionTier` decides whether a device gets the WebGL shader or the CSS
 * rendition. Getting it wrong is expensive in both directions: a false `full`
 * on a machine without WebGL empties the hero, and a false `static` on a
 * capable machine throws away the whole motion layer.
 *
 * The module caches its WebGL probe at module scope, so every test loads a
 * fresh copy and asserts against a fresh cache.
 */
type Capabilities = typeof import('../src/components/motion/capabilities');

const load = (): Capabilities => {
  let capabilities: Capabilities | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    capabilities = require('../src/components/motion/capabilities');
  });
  return capabilities as Capabilities;
};

const setNavigatorHints = (hints: { deviceMemory?: number; saveData?: boolean }) => {
  Object.defineProperty(window.navigator, 'deviceMemory', {
    configurable: true,
    value: hints.deviceMemory,
  });
  Object.defineProperty(window.navigator, 'connection', {
    configurable: true,
    value: hints.saveData === undefined ? undefined : { saveData: hints.saveData },
  });
};

describe('detectMotionTier', () => {
  beforeEach(() => {
    jest.resetModules();
    installMatchMedia();
    stubGetContext(createFakeGL());
    setNavigatorHints({ deviceMemory: 8, saveData: false });
  });

  it('gives a capable desktop the full motion tier', () => {
    expect(load().detectMotionTier()).toBe('full');
  });

  it('falls back to static when the visitor asked for reduced motion', () => {
    installMatchMedia({ [REDUCED_MOTION]: true });
    expect(load().detectMotionTier()).toBe('static');
  });

  it('falls back to static on phone-width screens', () => {
    installMatchMedia({ [SMALL_SCREEN]: true });
    expect(load().detectMotionTier()).toBe('static');
  });

  it('honours Save-Data', () => {
    setNavigatorHints({ deviceMemory: 8, saveData: true });
    expect(load().detectMotionTier()).toBe('static');
  });

  it('falls back to static on a device reporting 2GB or less', () => {
    setNavigatorHints({ deviceMemory: 2, saveData: false });
    expect(load().detectMotionTier()).toBe('static');
  });

  it('does not treat unknown device memory as a low-end device', () => {
    setNavigatorHints({ deviceMemory: undefined, saveData: false });
    expect(load().detectMotionTier()).toBe('full');
  });

  it('falls back to static when the device has no WebGL at all', () => {
    stubGetContext(null);
    expect(load().detectMotionTier()).toBe('static');
  });

  it('falls back to static when asking for a context throws', () => {
    Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      writable: true,
      value: () => {
        throw new Error('WebGL is blocked');
      },
    });
    expect(load().detectMotionTier()).toBe('static');
  });

  it('probes WebGL once and caches the answer', () => {
    const getContext = stubGetContext(createFakeGL());
    const { detectMotionTier } = load();

    detectMotionTier();
    detectMotionTier();
    detectMotionTier();

    // One probe per page load: drivers cap the number of live contexts, and
    // creating one is not free.
    expect(getContext).toHaveBeenCalledTimes(1);
  });

  it('releases the probe context instead of holding it', () => {
    const gl = createFakeGL();
    stubGetContext(gl);

    expect(load().detectMotionTier()).toBe('full');
    expect(gl.getExtension).toHaveBeenCalledWith('WEBGL_lose_context');
  });

  it('starts a page on the static tier, so server markup and hydration agree', () => {
    // The statically imported hook shares this file's React instance; a module
    // loaded through `jest.isolateModules` gets its own copy and cannot be
    // rendered by React Testing Library.
    const seen: string[] = [];

    const Probe = () => {
      seen.push(useMotionTier());
      return React.createElement('span');
    };

    render(React.createElement(Probe));

    // First paint is always the CSS rendition; the effect upgrades it once the
    // device has actually been measured.
    expect(seen[0]).toBe('static');
    expect(seen[seen.length - 1]).toBe('full');
  });
});
