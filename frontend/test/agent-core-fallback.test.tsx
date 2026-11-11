import '@testing-library/jest-dom';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import * as THREE from 'three';
import { AgentCore3D } from '../src/components/motion/AgentCore3D';
import { createFakeGL, installMatchMedia, stubGetContext, stubObservers } from './support/motion-env';

/**
 * The 3D core used to hand three.js a canvas with no context. On a machine with
 * WebGL unavailable, `new THREE.WebGLRenderer(...)` logged three console errors
 * and a stack before throwing, and the catch then rendered the SVG stand-in - so
 * the hero looked right while the console blamed our code.
 *
 * These tests pin the fix: the context is created here, three is never asked to
 * create one, and a device without WebGL gets no renderer at all.
 */
jest.mock('three', () => {
  const actual = jest.requireActual('three');
  return { ...actual, WebGLRenderer: jest.fn() };
});

const createRendererStub = () => ({
  setClearAlpha: jest.fn(),
  setPixelRatio: jest.fn(),
  setSize: jest.fn(),
  render: jest.fn(),
  dispose: jest.fn(),
  domElement: document.createElement('canvas'),
});

describe('AgentCore3D', () => {
  const renderer = THREE.WebGLRenderer as unknown as jest.Mock;

  beforeEach(() => {
    stubObservers();
    installMatchMedia();
    renderer.mockReset();
    renderer.mockImplementation(() => createRendererStub());
  });

  it('creates the context itself and hands it to three', async () => {
    stubGetContext(createFakeGL());
    const onLiveChange = jest.fn();

    render(<AgentCore3D onLiveChange={onLiveChange} />);

    await waitFor(() => expect(renderer).toHaveBeenCalledTimes(1));
    const passed = renderer.mock.calls[0][0] as Record<string, unknown>;

    expect(passed.canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(passed.context).toBeDefined();
    await waitFor(() => expect(onLiveChange).toHaveBeenCalledWith(true));
  });

  it('keeps the SVG core when the device has no WebGL', async () => {
    stubGetContext(null);
    const onLiveChange = jest.fn();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(<AgentCore3D onLiveChange={onLiveChange} />);

    await waitFor(() => expect(onLiveChange).toHaveBeenCalledWith(false));
    // Nothing was handed to three, so nothing could log about it.
    expect(renderer).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(container.querySelector('canvas')).toBeNull();
    consoleError.mockRestore();
  });
});
