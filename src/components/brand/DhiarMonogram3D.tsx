"use client";

import { useEffect, useRef, useState } from "react";
import { MONOGRAM_PATH, MONOGRAM_VIEWBOX } from "@/data/brandPaths";
import { gsap } from "@/lib/motion";

/**
 * Monograma "DA" da DHIAR em 3D (three.js puro, carregado sob demanda).
 *
 * O vetor do monograma (`MONOGRAM_PATH`) é extrudado em cobre metálico,
 * iluminado por um ambiente de estúdio (RoomEnvironment) + luz quente
 * principal + contraluz. Na entrada ele gira e cresce até a posição final
 * com um feixe de luz passando pela face; depois "respira" devagar,
 * inclina seguindo o mouse e pode ser girado arrastando (com inércia).
 *
 * Desempenho: o three.js só baixa quando o componente monta; o render
 * pausa fora da tela e com a aba em segundo plano; DPR limitado (1,5 no
 * celular); geometria mais simples em telas pequenas.
 * Sem WebGL (ou se falhar), mostra o SVG estático.
 */

const MATERIAL = {
  face: { color: "#d08a52", roughness: 0.24, clearcoat: 0.6 },
  side: { color: "#8e4c22", roughness: 0.42, clearcoat: 0.2 },
};

/** Profundidade do relevo em unidades do SVG (viewBox ~886 x 966). */
const EXTRUDE_DEPTH = 46;

interface DhiarMonogram3DProps {
  /** Dispara a animação de entrada (o hero controla o tempo). */
  playIntro: boolean;
  /** Sem animações (prefers-reduced-motion). */
  reducedMotion?: boolean;
  /** Pausa o render (ex.: escondido atrás do portal de entrada). */
  paused?: boolean;
  className?: string;
}

export function DhiarMonogram3D({ playIntro, reducedMotion = false, paused = false, className = "" }: DhiarMonogram3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  const introRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const [THREE, { SVGLoader }, { RoomEnvironment }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/SVGLoader.js"),
          import("three/examples/jsm/environments/RoomEnvironment.js"),
        ]);
        if (disposed) return;

        const isSmall = window.matchMedia("(max-width: 639px)").matches;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.5 : 2));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.domElement.style.touchAction = "pan-y";
        renderer.domElement.setAttribute("aria-hidden", "true");
        container.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = envTexture;

        const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
        camera.position.set(0, 0, 9);

        // Luzes: principal quente, contraluz cobre e um "feixe" que passa na entrada.
        scene.add(new THREE.AmbientLight("#3a2418", 0.6));
        const key = new THREE.DirectionalLight("#ffd9b5", 2.4);
        key.position.set(-3, 4, 6);
        scene.add(key);
        const rim = new THREE.DirectionalLight("#ff9d5c", 2.2);
        rim.position.set(4, -1, -5);
        scene.add(rim);
        const sweep = new THREE.PointLight("#fff1dc", 0, 14, 1.6);
        sweep.position.set(-4, 1.5, 3);
        scene.add(sweep);

        // Geometria a partir do vetor do logo.
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MONOGRAM_VIEWBOX}"><path fill-rule="evenodd" d="${MONOGRAM_PATH}"/></svg>`;
        const parsed = new SVGLoader().parse(svg);
        const shapes = parsed.paths.flatMap((path) => SVGLoader.createShapes(path));
        const geometry = new THREE.ExtrudeGeometry(shapes, {
          depth: EXTRUDE_DEPTH,
          bevelEnabled: true,
          bevelThickness: 7,
          bevelSize: 3.2,
          bevelSegments: isSmall ? 2 : 5,
          curveSegments: isSmall ? 6 : 14,
        });
        geometry.center();
        // SVG tem Y para baixo; espelha no eixo Y e corrige as normais.
        geometry.scale(1, -1, 1);
        const index = geometry.getIndex();
        if (index) {
          const array = index.array as Uint16Array | Uint32Array;
          for (let i = 0; i < array.length; i += 3) {
            const tmp = array[i];
            array[i] = array[i + 2];
            array[i + 2] = tmp;
          }
          index.needsUpdate = true;
        } else {
          const position = geometry.getAttribute("position");
          for (let i = 0; i < position.count; i += 3) {
            const a = [position.getX(i), position.getY(i), position.getZ(i)];
            position.setXYZ(i, position.getX(i + 2), position.getY(i + 2), position.getZ(i + 2));
            position.setXYZ(i + 2, a[0], a[1], a[2]);
          }
          position.needsUpdate = true;
        }
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        const size = new THREE.Vector3();
        geometry.boundingBox!.getSize(size);
        const unit = 3.0 / size.y; // monograma com 3 unidades de altura (~67% do canvas)

        const faceMaterial = new THREE.MeshPhysicalMaterial({
          ...MATERIAL.face,
          metalness: 1,
          clearcoatRoughness: 0.18,
          envMapIntensity: 1.25,
        });
        const sideMaterial = new THREE.MeshPhysicalMaterial({
          ...MATERIAL.side,
          metalness: 1,
          envMapIntensity: 0.9,
        });
        const mesh = new THREE.Mesh(geometry, [faceMaterial, sideMaterial]);
        mesh.scale.setScalar(unit);

        const tiltGroup = new THREE.Group(); // mouse + arrasto
        const introGroup = new THREE.Group(); // entrada
        tiltGroup.add(mesh);
        introGroup.add(tiltGroup);
        scene.add(introGroup);

        // Tamanho do canvas acompanha o container.
        const resize = () => {
          const { clientWidth: width, clientHeight: height } = container;
          if (!width || !height) return;
          renderer.setSize(width, height, false);
          renderer.domElement.style.width = "100%";
          renderer.domElement.style.height = "100%";
          camera.aspect = width / height;
          // Afasta a câmera em telas estreitas para o giro não cortar o arco.
          camera.position.z = camera.aspect < 0.9 ? 9 / camera.aspect * 0.9 : 9;
          camera.updateProjectionMatrix();
        };
        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);

        // Interação: inclinação pelo mouse + arrastar para girar com inércia.
        const state = { targetX: 0, targetY: 0, dragY: 0, velocity: 0, dragging: false, lastX: 0 };
        const onPointerMove = (event: PointerEvent) => {
          if (state.dragging) {
            const delta = event.clientX - state.lastX;
            state.dragY += delta * 0.012;
            state.velocity = delta * 0.012;
            state.lastX = event.clientX;
            return;
          }
          if (event.pointerType !== "mouse") return;
          const rect = container.getBoundingClientRect();
          state.targetY = ((event.clientX - rect.left) / rect.width - 0.5) * 0.5;
          state.targetX = ((event.clientY - rect.top) / rect.height - 0.5) * 0.3;
        };
        const onPointerDown = (event: PointerEvent) => {
          state.dragging = true;
          state.lastX = event.clientX;
          state.velocity = 0;
          renderer.domElement.style.cursor = "grabbing";
        };
        const onPointerUp = () => {
          state.dragging = false;
          renderer.domElement.style.cursor = "grab";
        };
        renderer.domElement.style.cursor = "grab";
        renderer.domElement.addEventListener("pointerdown", onPointerDown);
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        window.addEventListener("pointerup", onPointerUp);
        window.addEventListener("pointercancel", onPointerUp);

        // Entrada: gira 1,25 volta, cresce e um feixe de luz cruza a face.
        if (reducedMotion) {
          introGroup.rotation.set(0, 0, 0);
        } else {
          introGroup.rotation.set(0.35, -Math.PI * 2.5, 0);
          introGroup.scale.setScalar(0.35);
          introGroup.position.y = -0.6;
        }
        const startIntro = () => {
          if (reducedMotion) return;
          const timeline = gsap.timeline();
          timeline
            .to(introGroup.rotation, { x: 0, y: 0, duration: 2.6, ease: "expo.out" }, 0)
            .to(introGroup.scale, { x: 1, y: 1, z: 1, duration: 2.2, ease: "expo.out" }, 0)
            .to(introGroup.position, { y: 0, duration: 2.2, ease: "expo.out" }, 0)
            .to(sweep, { intensity: 60, duration: 0.5, ease: "power2.out" }, 1.0)
            .to(sweep.position, { x: 4, duration: 1.6, ease: "power2.inOut" }, 1.0)
            .to(sweep, { intensity: 0, duration: 0.6, ease: "power2.in" }, 2.1);
          // Brilho recorrente a cada 7 s.
          gsap.timeline({ repeat: -1, repeatDelay: 7, delay: 4 })
            .set(sweep.position, { x: -4 })
            .to(sweep, { intensity: 40, duration: 0.4 })
            .to(sweep.position, { x: 4, duration: 1.4, ease: "power2.inOut" }, 0)
            .to(sweep, { intensity: 0, duration: 0.5 }, 0.9);
        };
        introRef.current = startIntro;

        // Loop de render (pausa fora da tela / aba oculta).
        const clock = new THREE.Clock();
        let visible = true;
        let frame = 0;
        const render = () => {
          frame = requestAnimationFrame(render);
          if (!visible || document.hidden || pausedRef.current) return;
          const elapsed = clock.getElapsedTime();
          if (!state.dragging) {
            state.dragY += state.velocity;
            state.velocity *= 0.94;
            // Volta devagar ao centro depois de um arrasto.
            state.dragY *= 0.985;
          }
          const idle = reducedMotion ? 0 : Math.sin(elapsed * 0.5) * 0.12;
          const idleX = reducedMotion ? 0 : Math.sin(elapsed * 0.7) * 0.04;
          tiltGroup.rotation.y += (state.targetY + idle + state.dragY - tiltGroup.rotation.y) * 0.06;
          tiltGroup.rotation.x += (state.targetX + idleX - tiltGroup.rotation.x) * 0.06;
          renderer.render(scene, camera);
        };
        render();
        const visibility = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        visibility.observe(container);

        setStatus("ready");

        cleanup = () => {
          cancelAnimationFrame(frame);
          visibility.disconnect();
          resizeObserver.disconnect();
          renderer.domElement.removeEventListener("pointerdown", onPointerDown);
          window.removeEventListener("pointermove", onPointerMove);
          window.removeEventListener("pointerup", onPointerUp);
          window.removeEventListener("pointercancel", onPointerUp);
          gsap.killTweensOf([introGroup.rotation, introGroup.scale, introGroup.position, sweep, sweep.position]);
          geometry.dispose();
          faceMaterial.dispose();
          sideMaterial.dispose();
          envTexture.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        if (!disposed) setStatus("fallback");
      }
    })();

    return () => {
      disposed = true;
      introRef.current = null;
      cleanup?.();
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (playIntro && status === "ready") introRef.current?.();
  }, [playIntro, status]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {status !== "ready" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/branding-logo.svg"
          alt=""
          aria-hidden
          className={`absolute inset-0 m-auto h-[78%] w-auto transition-opacity duration-500 ${
            status === "fallback" || reducedMotion ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
