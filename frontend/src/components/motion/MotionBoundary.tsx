import React from "react";

type MotionBoundaryState = {
  failed: boolean;
};

/**
 * Keeps a decorative motion layer from taking a page down with it.
 *
 * The shader and 3D chunks are lazy, and a lazy chunk can fail to load (a stale
 * dev build is the usual cause, a flaky connection the other). When the layer is
 * only decoration, the right response is to drop it silently: the CSS rendition
 * underneath is already painted, so the page simply stays still.
 */
export class MotionBoundary extends React.Component<
  { children: React.ReactNode },
  MotionBoundaryState
> {
  override state: MotionBoundaryState = { failed: false };

  static getDerivedStateFromError(): MotionBoundaryState {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default MotionBoundary;
