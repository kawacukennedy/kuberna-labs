import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { BRAND } from "../../../motion/theme";

/**
 * The Kuberna "agentic core" for the live site.
 *
 * This is the same scene as the `Hero3D` Remotion composition, but rendered by
 * a plain three.js renderer instead of `<ThreeCanvas>` inside the Remotion
 * `<Player>`. The player scales its children with a CSS transform, which makes
 * the react-three-fiber canvas measure itself at 0x0 and draw nothing — the
 * hero looked empty on every desktop viewport because of it.
 *
 * Rendering imperatively also keeps three.js out of the Remotion timeline, so
 * the site never waits on a player chunk to paint the hero.
 */
export const AgentCore3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // No WebGL (old browser, blocked GPU): the shader background still shows.
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    renderer.setClearAlpha(0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 6.4);

    const root = new THREE.Group();
    scene.add(root);

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));

    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(4, 6, 6);
    scene.add(key);

    const emerald = new THREE.PointLight(BRAND.emeraldLight, 22, 0, 2);
    emerald.position.set(-4, -3, 3);
    scene.add(emerald);

    const indigo = new THREE.PointLight(BRAND.indigoLight, 24, 0, 2);
    indigo.position.set(3, 4, -2);
    scene.add(indigo);

    // Rim light from behind so the core reads as a lit volume, not a flat disc.
    const rim = new THREE.PointLight(0xffffff, 14, 0, 2);
    rim.position.set(0, 1.5, -5);
    scene.add(rim);

    const disposables: Array<{ dispose: () => void }> = [];

    // Wireframe containment shell.
    const shellGeometry = new THREE.IcosahedronGeometry(1.62, 1);
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: BRAND.indigoLight,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    root.add(shell);
    disposables.push(shellGeometry, shellMaterial);

    // Glowing core.
    const coreGeometry = new THREE.IcosahedronGeometry(0.72, 3);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: BRAND.indigo,
      emissive: new THREE.Color(BRAND.indigoDeep),
      emissiveIntensity: 0.55,
      metalness: 0.68,
      roughness: 0.22,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    root.add(core);
    disposables.push(coreGeometry, coreMaterial);

    // Additive halo so the core glows against the pale page instead of reading
    // as a solid ball.
    const haloGeometry = new THREE.SphereGeometry(1.05, 48, 48);
    const haloMaterial = new THREE.MeshBasicMaterial({
      color: BRAND.emeraldLight,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    root.add(halo);
    disposables.push(haloGeometry, haloMaterial);

    // Orbit rings.
    const rings: THREE.Mesh[] = [];
    const ringSpecs: Array<{ radius: number; thickness: number; color: string; opacity: number }> = [
      { radius: 2.28, thickness: 0.008, color: BRAND.indigoLight, opacity: 0.55 },
      { radius: 2.72, thickness: 0.006, color: BRAND.emeraldLight, opacity: 0.45 },
    ];
    for (const spec of ringSpecs) {
      const geometry = new THREE.TorusGeometry(spec.radius, spec.thickness, 12, 180);
      const material = new THREE.MeshBasicMaterial({
        color: spec.color,
        transparent: true,
        opacity: spec.opacity,
      });
      const ring = new THREE.Mesh(geometry, material);
      root.add(ring);
      rings.push(ring);
      disposables.push(geometry, material);
    }

    // Satellites on individual orbits.
    const satellites: THREE.Mesh[] = [];
    for (let index = 0; index < 6; index += 1) {
      const geometry = new THREE.OctahedronGeometry(1, 0);
      const color = index % 3 === 0 ? BRAND.amber : BRAND.indigoLight;
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.28,
        metalness: 0.7,
        roughness: 0.25,
      });
      const satellite = new THREE.Mesh(geometry, material);
      const scale = 0.075 + (index % 3) * 0.025;
      satellite.scale.setScalar(scale);
      root.add(satellite);
      satellites.push(satellite);
      disposables.push(geometry, material);
    }

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));
      if (nextWidth === width && nextHeight === height) {
        return;
      }
      width = nextWidth;
      height = nextHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const renderAt = (seconds: number) => {
      const spin = 1;

      shell.rotation.set(
        Math.sin(seconds * 0.42) * 0.24,
        seconds * 0.34 * spin,
        0
      );

      const corePulse = 1 + Math.sin(seconds * 1.8) * 0.035;
      core.scale.setScalar(corePulse);
      halo.scale.setScalar(corePulse * 1.04);
      core.rotation.y = seconds * 0.12;

      rings[0].rotation.set(Math.PI / 2.35, seconds * 0.6 * spin, 0.32);
      rings[1].rotation.set(Math.PI / 1.75, -seconds * 0.6 * spin * 1.3, -0.45);

      satellites.forEach((satellite, index) => {
        const orbit = 1.95 + (index % 3) * 0.34;
        const speed = 0.28 + index * 0.045;
        const angle = seconds * speed * spin + (index * Math.PI * 2) / satellites.length;
        const tilt = (index % 2 === 0 ? 1 : -1) * (0.35 + index * 0.06);

        satellite.position.set(
          Math.cos(angle) * orbit,
          Math.sin(angle) * tilt,
          Math.sin(angle) * orbit
        );
        satellite.rotation.set(seconds * 0.9, seconds * 0.7, 0);
      });

      // Matching entrance: the core settles into place over the first 3s.
      const settle = THREE.MathUtils.clamp(seconds / 3, 0, 1);
      const eased = 1 - Math.pow(1 - settle, 3);
      root.scale.setScalar(0.82 + 0.18 * eased);
      root.position.y = 0.35 * (1 - eased);

      renderer.render(scene, camera);
    };

    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    let frameId = 0;
    let visible = true;
    let start = performance.now();

    const loop = () => {
      const seconds = (performance.now() - start) / 1000;
      renderAt(seconds);
      frameId = requestAnimationFrame(loop);
    };

    if (reducedMotion) {
      renderAt(0);
    } else {
      frameId = requestAnimationFrame(loop);
    }

    // Stop burning GPU time when the hero is scrolled out of view.
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        if (entry.isIntersecting && !visible) {
          visible = true;
          if (!reducedMotion) {
            start = performance.now() - 1000;
            frameId = requestAnimationFrame(loop);
          }
        } else if (!entry.isIntersecting && visible) {
          visible = false;
          cancelAnimationFrame(frameId);
        }
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  // The parent `<Player>` used to own the sizing; this wrapper keeps the
  // canvas square and centred the same way the composition does.
  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="absolute inset-0" />
    </div>
  );
};

export default AgentCore3D;
