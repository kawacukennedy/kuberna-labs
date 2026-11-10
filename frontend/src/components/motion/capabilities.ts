import React from "react";

/**
 * How much motion this device can be trusted with.
 *
 * The site's immersive layers are WebGL shaders, and WebGL is not a given: GPU
 * blocklists, "use hardware acceleration when available" turned off, remote
 * desktops and locked-down browsers all report no context at all. Rather than
 * paint an empty hero on those machines (which is what used to happen), the
 * motion layer asks this module first and falls back to the CSS rendition.
 *
 * `static` is also the right answer on old or constrained hardware: the tiers
 * below keep three.js and Remotion out of the request and out of the frame loop
 * entirely, which is the difference between a usable page and a slideshow on a
 * ten-year-old laptop or a budget Android phone.
 */
export type MotionTier = "full" | "static";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const SMALL_SCREEN = "(max-width: 767px)";

type NetworkInformation = {
  saveData?: boolean;
  effectiveType?: string;
};

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: NetworkInformation;
};

/**
 * One context is probed and immediately released: drivers cap live contexts,
 * and creating one is not free, so the answer is cached for the page's life
 * (a device's WebGL support does not change mid-session).
 */
let webGLSupport: boolean | null = null;

const hasWebGL = (): boolean => {
  if (webGLSupport !== null) {
    return webGLSupport;
  }

  try {
    const canvas = document.createElement("canvas");
    const context = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!context) {
      webGLSupport = false;
      return false;
    }
    context.getExtension("WEBGL_lose_context")?.loseContext();
    webGLSupport = true;
    return true;
  } catch {
    webGLSupport = false;
    return false;
  }
};

export const detectMotionTier = (): MotionTier => {
  if (typeof window === "undefined") {
    return "static";
  }

  if (window.matchMedia(REDUCED_MOTION).matches) {
    return "static";
  }

  // Phones get the CSS rendition: the aurora is a full-viewport fragment shader
  // per page, which is the single most expensive thing on mobile.
  if (window.matchMedia(SMALL_SCREEN).matches) {
    return "static";
  }

  const navigatorWithHints = navigator as NavigatorWithHints;
  const connection = navigatorWithHints.connection;

  // Explicit user intent only. `connection.effectiveType` is a coarse estimate
  // that reports "3g" in environments with no network data at all (headless
  // browsers, some desktop builds), so trusting it would switch the shader off
  // for plenty of perfectly capable machines.
  if (connection?.saveData) {
    return "static";
  }
  // 2GB is the point where a full-viewport shader starts costing frames.
  // Core count is deliberately not a signal: browsers report 2 cores in plenty
  // of healthy environments (headless runs, some VMs), and the shader is bound
  // by fragment work rather than JavaScript execution.
  if ((navigatorWithHints.deviceMemory ?? 8) <= 2) {
    return "static";
  }

  return hasWebGL() ? "full" : "static";
};

/**
 * SSR renders `static` so the server markup and the first client paint agree;
 * the effect upgrades to `full` once the device has been measured, which keeps
 * hydration warning-free and means a slow device never briefly starts the
 * expensive path.
 */
export const useMotionTier = (): MotionTier => {
  const [tier, setTier] = React.useState<MotionTier>("static");

  React.useEffect(() => {
    const update = () => setTier(detectMotionTier());
    update();

    const queries = [window.matchMedia(REDUCED_MOTION), window.matchMedia(SMALL_SCREEN)];
    queries.forEach((query) => query.addEventListener("change", update));
    return () => queries.forEach((query) => query.removeEventListener("change", update));
  }, []);

  return tier;
};
