import React from "react";
import dynamic from "next/dynamic";

const AmbientFieldStage = dynamic(() => import("./AmbientFieldStage"), { ssr: false });

/**
 * A decorative layer on every route, so a failure here must never take a page
 * down with it: if the client chunk 404s (a stale dev build is the usual cause)
 * the boundary drops the overlay and the page renders normally.
 */
class AmbientErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Immersive light-wash that runs above page backgrounds on every route.
 *
 * It is an additive overlay rather than a background because individual pages
 * paint their own opaque sections; blending on top means the motion reads on
 * all of them without rewriting each page's surface colors.
 */
export const AmbientField: React.FC = () => {
  return (
    <div
      aria-hidden
      className="motion-ambient pointer-events-none fixed inset-0 z-[5] overflow-hidden"
      style={{
        mixBlendMode: "soft-light",
        opacity: 0.45,
        maskImage: "linear-gradient(to bottom, #000 0%, #000 34%, transparent 72%)",
        WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 34%, transparent 72%)",
      }}
    >
      <AmbientErrorBoundary>
        <AmbientFieldStage />
      </AmbientErrorBoundary>
    </div>
  );
};
