"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/* ============================================================================
   AJUSTE DA FUMAÇA - mexa só aqui.
   ============================================================================ */
export const SMOKE = {
  /** Velocidade geral do movimento (1 = padrão). */
  speed: 1,
  /** Quanto a fumaça da foto ondula (deslocamento em % da imagem). */
  flow: 0.016,
  /** Intensidade dos fios de fumaça gerados por cima da foto (0 = desliga). */
  wisps: 0.55,
  /** Pulsação da brasa na madeira (0 = desliga). */
  ember: 0.07,
  /** Quanto a fumaça "foge" do cursor/dedo. */
  mouse: 0.035,
  /** Resolução do canvas em relação à tela (fumaça é suave; 0,75 economiza GPU). */
  resolution: 0.85,
  /**
   * Linha que separa a madeira (embaixo à esquerda, fica parada) da fumaça.
   * Coordenadas da IMAGEM, de 0 a 1, com y para baixo.
   */
  woodLine: { from: [0, 0.53], to: [0.47, 1] },
} as const;

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Simplex 3D (Ashima Arts / Stefan Gustavson, licença MIT) + fbm.
const FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uImgAspect;
uniform vec2 uFocus;
uniform float uTime;
uniform vec2 uMouse;
uniform float uMouseActive;
uniform float uFlow;
uniform float uWisps;
uniform float uEmber;
uniform float uMouseForce;
uniform vec4 uWood;

vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<4;i++){ v+=a*snoise(p); p*=2.03; a*=0.5; }
  return v;
}

void main(){
  // object-cover com ponto focal (igual ao CSS object-position).
  float screenAspect=uRes.x/uRes.y;
  vec2 scale = screenAspect>uImgAspect ? vec2(1.0, uImgAspect/screenAspect) : vec2(screenAspect/uImgAspect, 1.0);
  vec2 uv = vUv*scale + (1.0-scale)*uFocus;
  vec2 imgPos = vec2(uv.x, 1.0-uv.y); // coordenadas da imagem, y para baixo

  // Madeira (abaixo da linha) fica parada; fumaça (acima) se move.
  vec2 a=uWood.xy; vec2 b=uWood.zw;
  float side = (b.x-a.x)*(imgPos.y-a.y) - (b.y-a.y)*(imgPos.x-a.x);
  float smokeZone = 1.0 - smoothstep(-0.015, 0.03, side);
  float woodZone = 1.0 - smokeZone;

  float t = uTime;
  // Campo de fluxo subindo: duas camadas de ruído deslocadas no tempo.
  vec3 q = vec3(imgPos*vec2(2.2,1.6) + vec2(0.0, t*0.05), t*0.045);
  vec2 flow = vec2(fbm(q), fbm(q + vec3(4.3, 1.7, 2.1)));
  vec2 disp = flow * uFlow * smokeZone;
  disp.y -= abs(flow.x) * uFlow * 0.6 * smokeZone; // viés para cima

  // A fumaça foge do cursor/dedo.
  vec2 toMouse = vUv - uMouse;
  float md = length(toMouse*vec2(screenAspect,1.0));
  disp += normalize(toMouse+1e-5) * exp(-md*md*14.0) * uMouseForce * uMouseActive * smokeZone;

  vec3 color = texture2D(uTex, uv + vec2(disp.x, -disp.y)).rgb;

  // Fios de fumaça procedurais, subindo e se enrolando.
  vec3 wq = vec3(imgPos.x*2.6 + sin(imgPos.y*4.0 + t*0.25)*0.35, imgPos.y*1.7 + t*0.09, t*0.035);
  float w = fbm(wq) * 0.5 + 0.5;
  float wisp = smoothstep(0.52, 0.86, w);
  float fade = smoothstep(1.05, 0.15, imgPos.x) * smoothstep(-0.05, 0.35, 1.0-imgPos.y+0.2);
  wisp *= fade * smokeZone * uWisps;
  color += vec3(0.62, 0.40, 0.25) * wisp * 0.32 + vec3(0.55, 0.50, 0.46) * wisp * 0.08;

  // Brasa pulsando devagar na madeira.
  float ember = 1.0 + uEmber * (sin(t*1.1 + snoise(vec3(imgPos*6.0, t*0.3))*1.5) * 0.5 + 0.5);
  color *= mix(1.0, ember, woodZone);

  gl_FragColor = vec4(color, 1.0);
}
`;

interface LivingSmokeProps {
  /** Ponto focal da imagem no enquadramento (0-1), igual ao object-position. */
  focus?: [number, number];
  /** Pausa a animação (ex.: hero escondido atrás do portal de entrada). */
  paused?: boolean;
  /** Imagem estática exibida antes do WebGL carregar e como fallback. */
  priority?: boolean;
  className?: string;
}

/**
 * Fundo de fumaça "viva": a própria foto `bg-texture-smoke.webp` passa por
 * um shader que faz a fumaça ondular e subir (a madeira fica parada, com uma
 * brasa pulsando), mais fios de fumaça gerados em tempo real por cima - nunca
 * se repete e não precisa de vídeo.
 *
 * A foto estática fica SEMPRE por baixo (LCP rápido, sem tela preta); o
 * canvas aparece por cima com fade quando estiver pronto. Sem WebGL, ou com
 * `prefers-reduced-motion`, fica só a foto.
 */
export function LivingSmoke({ focus = [0.18, 0.5], paused = false, priority = false, className = "" }: LivingSmokeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const THREE = await import("three");
        if (disposed) return;
        const isSmall = window.matchMedia("(max-width: 1023px)").matches;
        const textureUrl = isSmall ? "/images/bg-texture-smoke-1280.webp" : "/images/bg-texture-smoke.webp";

        const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5) * SMOKE.resolution);
        renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
        const canvas = renderer.domElement;
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 1.2s ease";
        container.appendChild(canvas);

        const texture = await new THREE.TextureLoader().loadAsync(textureUrl);
        if (disposed) {
          texture.dispose();
          renderer.dispose();
          return;
        }
        // Lê os valores sRGB crus e devolve crus: sem conversão para linear
        // (senão a foto sai mais escura que o original).
        texture.colorSpace = THREE.NoColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        const image = texture.image as { width: number; height: number };

        const uniforms = {
          uTex: { value: texture },
          uRes: { value: new THREE.Vector2(1, 1) },
          uImgAspect: { value: image.width / image.height },
          uFocus: { value: new THREE.Vector2(focus[0], 1 - focus[1]) },
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(-1, -1) },
          uMouseActive: { value: 0 },
          uFlow: { value: SMOKE.flow },
          uWisps: { value: SMOKE.wisps },
          uEmber: { value: SMOKE.ember },
          uMouseForce: { value: SMOKE.mouse },
          uWood: { value: new THREE.Vector4(...SMOKE.woodLine.from, ...SMOKE.woodLine.to) },
        };
        const material = new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms, depthTest: false });
        const geometry = new THREE.PlaneGeometry(2, 2);
        const scene = new THREE.Scene();
        scene.add(new THREE.Mesh(geometry, material));
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        // A textura vem em sRGB e o shader devolve sRGB: sem conversão extra.
        material.toneMapped = false;

        const resize = () => {
          const { clientWidth: width, clientHeight: height } = container;
          if (!width || !height) return;
          renderer.setSize(width, height, false);
          uniforms.uRes.value.set(width, height);
        };
        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);

        // Cursor/dedo (com suavização) - a fumaça abre caminho.
        const mouseTarget = new THREE.Vector2(-1, -1);
        let mouseTargetActive = 0;
        const onPointerMove = (event: PointerEvent) => {
          const rect = container.getBoundingClientRect();
          mouseTarget.set((event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height);
          mouseTargetActive = 1;
        };
        const onPointerLeave = () => {
          mouseTargetActive = 0;
        };
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        document.addEventListener("pointerleave", onPointerLeave);

        let visible = true;
        const visibility = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        visibility.observe(container);

        let frame = 0;
        let last = performance.now();
        let time = Math.random() * 100;
        let shown = false;
        const loop = (now: number) => {
          frame = requestAnimationFrame(loop);
          const delta = Math.min((now - last) / 1000, 0.05);
          last = now;
          if (!visible || document.hidden || (pausedRef.current && shown)) return;
          time += delta * SMOKE.speed;
          uniforms.uTime.value = time;
          uniforms.uMouse.value.lerp(mouseTarget, 0.08);
          uniforms.uMouseActive.value += (mouseTargetActive - uniforms.uMouseActive.value) * 0.05;
          renderer.render(scene, camera);
          if (!shown) {
            shown = true;
            canvas.style.opacity = "1";
            setReady(true);
          }
        };
        frame = requestAnimationFrame(loop);

        cleanup = () => {
          cancelAnimationFrame(frame);
          resizeObserver.disconnect();
          visibility.disconnect();
          window.removeEventListener("pointermove", onPointerMove);
          document.removeEventListener("pointerleave", onPointerLeave);
          geometry.dispose();
          material.dispose();
          texture.dispose();
          renderer.dispose();
          canvas.remove();
        };
      } catch {
        // Sem WebGL: fica a foto estática.
      }
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
    // `focus` só é lido na criação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden bg-[#0b0b0c] ${className}`} data-smoke-ready={ready || undefined}>
      <Image
        src="/images/bg-texture-smoke.webp"
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition: `${focus[0] * 100}% ${focus[1] * 100}%` }}
      />
    </div>
  );
}
