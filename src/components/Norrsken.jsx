import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Norrsken = () => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const requestRef = useRef(null);

  // Norrsken preset params
  const viscosity = 0.21;
  const force = 0;
  const speed = 0.20;
  const quality = 1;
  const hoverSize = 0.05;
  const shimmerIntensity = 0.10;
  const sharpness = 0.10;
  const complexity = 0.20;
  const noise = 0;
  const fadeSize = 0;

  // Dark colors
  const colorA = '#000000';
  const primaryColor = '#2effa6';
  const secondaryColor = '#a65cff';

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0, 0);
    rendererRef.current = renderer;

    const canvas = renderer.domElement;
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.touchAction = 'none';
    canvas.style.zIndex = '0';
    container.appendChild(canvas);

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const plane = new THREE.PlaneGeometry(2, 2);
    const simScene = new THREE.Scene();
    const displayScene = new THREE.Scene();

    // Mouse tracking
    const mouse = new THREE.Vector2(0.5, 0.5);
    const lastMouse = new THREE.Vector2(0.5, 0.5);
    const click = new THREE.Vector2(-10, -10);
    let clickTime = 1e3;
    let isDragging = false;
    let isHovering = false;
    const virtualMouse = new THREE.Vector2(0.5, 0.5);
    let wasUsingVirtual = true;

    const handlePointerEnter = (e) => {
      isHovering = true;
      const p = new THREE.Vector2(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
      mouse.copy(p); lastMouse.copy(p); virtualMouse.copy(p);
      wasUsingVirtual = false;
    };

    const handlePointerMove = (e) => {
      isHovering = true;
      const p = new THREE.Vector2(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
      mouse.copy(p);
      if (isDragging) { click.copy(mouse); clickTime = 0; }
      wasUsingVirtual = false;
    };

    const handlePointerLeave = () => {
      isHovering = false;
      isDragging = false;
      virtualMouse.copy(mouse);
      lastMouse.copy(mouse);
      wasUsingVirtual = true;
    };

    const handlePointerDown = (e) => {
      const p = new THREE.Vector2(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
      click.copy(p);
      clickTime = 0;
      isDragging = true;
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    document.addEventListener('pointerenter', handlePointerEnter);
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerleave', handlePointerLeave);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handlePointerUp);

    // Render targets
    const resolution = new THREE.Vector2(1, 1);
    let rtA = null;
    let rtB = null;

    const createRT = () =>
      new THREE.WebGLRenderTarget(resolution.x, resolution.y, {
        type: THREE.HalfFloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
      });

    const disposeRT = (rt) => {
      if (!rt) return;
      rt.texture.dispose();
      rt.dispose();
    };

    // Simulation shader
    const simMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPrev: { value: null },
        uMouse: { value: mouse },
        uLastMouse: { value: lastMouse },
        uClick: { value: click },
        uClickTime: { value: 1e3 },
        uTime: { value: 0 },
        uViscosity: { value: viscosity },
        uForce: { value: force },
        uHoverSize: { value: hoverSize },
        uResolution: { value: resolution },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = vec4(position,1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D uPrev;
        uniform vec2 uMouse;
        uniform vec2 uLastMouse;
        uniform vec2 uClick;
        uniform float uClickTime;
        uniform float uTime;
        uniform float uViscosity;
        uniform float uForce;
        uniform float uHoverSize;
        uniform vec2 uResolution;

        void main(){
          vec2 uv = vUv;
          vec2 px = 1.0 / uResolution;
          vec4 prev = texture2D(uPrev, uv);
          vec4 sum = vec4(0.0);
          sum += texture2D(uPrev, uv + vec2(px.x,0.0));
          sum += texture2D(uPrev, uv - vec2(px.x,0.0));
          sum += texture2D(uPrev, uv + vec2(0.0,px.y));
          sum += texture2D(uPrev, uv - vec2(0.0,px.y));
          vec4 diffused = mix(prev, sum*0.25, uViscosity);

          float it = uTime * 0.35;
          vec2 p = uv - 0.5;
          vec2 field = vec2(
            sin((p.y * 2.0 + it) * 6.0) + 0.5 * sin((p.y * 3.0 - it * 1.3) * 3.5),
            cos((p.x * 2.0 - it) * 6.0) + 0.5 * cos((p.x * 3.0 + it * 1.1) * 3.5)
          );
          diffused.xy += field * (0.0018 * uForce);

          vec2 delta = uMouse - uLastMouse;
          vec2 vel = -delta * uForce;
          vec2 swirl = vec2(-delta.y, delta.x) * 0.5 * uForce;
          float d = distance(uv, uMouse);
          float influence = smoothstep(uHoverSize, 0.0, d);
          diffused.xy += (vel + swirl) * influence;

          if (uClickTime < 2.0) {
            float cd = distance(uv, uClick);
            vec2 dir = normalize(uv - uClick);
            float t = uClickTime;
            float radius = t * 0.8;
            float thickness = 0.3;
            float ringShape = smoothstep(thickness, 0.0, abs(cd - radius));
            float centerFade = smoothstep(0.0, 0.2, cd);
            float alpha = exp(-t * 2.0);
            vec2 displacement = dir * ringShape * alpha * 0.02 * uForce * centerFade;
            diffused.xy += displacement;
          }

          diffused.xy *= 0.985;
          gl_FragColor = diffused;
        }
      `,
    });
    simScene.add(new THREE.Mesh(plane, simMaterial));

    // Display shader
    const colA = new THREE.Color(colorA);
    const colB = new THREE.Color(primaryColor);
    const colC = new THREE.Color(secondaryColor);

    const displayMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uTime: { value: 0 },
        uColorA: { value: new THREE.Vector3(colA.r, colA.g, colA.b) },
        uColorB: { value: new THREE.Vector3(colB.r, colB.g, colB.b) },
        uColorC: { value: new THREE.Vector3(colC.r, colC.g, colC.b) },
        uColorC1: { value: new THREE.Vector3(0, 1, 0.6) },
        uColorC2: { value: new THREE.Vector3(0.3, 0, 1) },
        uColorC3: { value: new THREE.Vector3(0.616, 0, 1) },
        uColorC4: { value: new THREE.Vector3(0, 0.5, 1) },
        uShimmerIntensity: { value: shimmerIntensity },
        uSharpness: { value: sharpness },
        uComplexity: { value: complexity },
        uNoise: { value: noise },
        uFadeSize: { value: fadeSize },
        uEnableColorCycle: { value: 0 },
        uColorCycleSpeed: { value: 1 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = vec4(position,1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D uTexture;
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        uniform vec3 uColorC1;
        uniform vec3 uColorC2;
        uniform vec3 uColorC3;
        uniform vec3 uColorC4;
        uniform float uShimmerIntensity;
        uniform float uSharpness;
        uniform float uComplexity;
        uniform float uNoise;
        uniform float uFadeSize;
        uniform float uEnableColorCycle;
        uniform float uColorCycleSpeed;

        vec3 cycleColors(float t) {
          float cycle = mod(t * uColorCycleSpeed, 4.0);
          if (cycle < 1.0) return mix(uColorC1, uColorC2, cycle);
          if (cycle < 2.0) return mix(uColorC2, uColorC3, cycle - 1.0);
          if (cycle < 3.0) return mix(uColorC3, uColorC4, cycle - 2.0);
          return mix(uColorC4, uColorC1, cycle - 3.0);
        }

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        void main(){
          vec2 flow = texture2D(uTexture, vUv).xy;
          vec2 uv = vUv + flow * 0.2;
          float t = uTime * 0.8;
          float c = mix(0.2, 1.8, uComplexity);

          vec3 baseColorA = uColorA;
          vec3 baseColorB = uColorB;
          vec3 baseColorC = uColorC;

          if (uEnableColorCycle > 0.5) {
            baseColorB = cycleColors(uTime + 1.3);
            baseColorC = cycleColors(uTime + 2.6);
          }

          float verticalFlow = sin(uv.y * 8.0 * c - t * 2.0) * 0.3;
          float ribbon1 = sin((uv.x + verticalFlow) * 12.0 * c + t * 0.5);
          float ribbon2 = sin((uv.x + verticalFlow * 0.7) * 8.0 * c - t * 0.3);
          float ribbon3 = sin((uv.x + verticalFlow * 1.3) * 15.0 * c + t * 0.7);
          float ribbons = (ribbon1 * 0.5 + ribbon2 * 0.3 + ribbon3 * 0.2);
          ribbons = ribbons * 0.5 + 0.5;

          float dynamicSharpness = sin(t * 0.1 + uv.y * 0.5) * 0.5 + 0.5;
          float sharpSpike = smoothstep(0.8, 1.0, sin(t * 0.5 + uv.y * 3.0) * sin(uv.x * 5.0 + t * 0.2));
          float minWidth = mix(0.5, 0.001, uSharpness);
          float width = mix(0.5, minWidth, mix(dynamicSharpness, 1.0, sharpSpike * 0.5));
          ribbons = smoothstep(0.5 - width, 0.5 + width, ribbons);

          float curtain = sin(uv.y * 5.0 * c + t) * sin(uv.x * 10.0 * c + sin(uv.y * 3.0 * c - t * 0.5));
          curtain = curtain * 0.5 + 0.5;
          float wave = mix(ribbons, curtain, 0.4);
          float vertical = smoothstep(0.0, 0.5, uv.y) * smoothstep(1.0, 0.5, uv.y);
          float auroraMask = wave * vertical;

          vec3 col = mix(baseColorA, baseColorB, auroraMask);
          float h = smoothstep(0.6, 0.9, wave);
          col = mix(col, baseColorC, h * vertical);

          float shimmerFreq = mix(10.0, 40.0, uShimmerIntensity);
          float shimmer1 = sin(uv.x * shimmerFreq + t * 3.0) * sin(uv.y * shimmerFreq * 0.7 - t * 2.0);
          float shimmer2 = sin(uv.x * shimmerFreq * 1.3 - t * 2.5) * sin(uv.y * shimmerFreq * 0.9 + t * 1.8);
          float shimmer3 = sin(uv.x * shimmerFreq * 0.6 + t * 4.0) * sin(uv.y * shimmerFreq * 1.2 - t * 3.2);
          float shimmer = (shimmer1 + shimmer2 + shimmer3) / 3.0;
          shimmer = smoothstep(0.3, 1.0, shimmer * 0.5 + 0.5);
          col += shimmer * baseColorC * uShimmerIntensity * 0.3;

          col += clamp(length(flow), 0.0, 1.0) * baseColorC * 0.25;

          float noiseVal = random(vUv + uTime * 0.1);
          col += (noiseVal - 0.5) * uNoise;

          float fadeMask = smoothstep(0.0, uFadeSize, vUv.y);
          col = mix(baseColorA, col, fadeMask);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    displayScene.add(new THREE.Mesh(plane, displayMaterial));

    const resize = () => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      renderer.setSize(w, h, false);
      const q = Math.max(0.25, Math.min(1, quality));
      resolution.set(Math.floor(w * q), Math.floor(h * q));
      disposeRT(rtA);
      disposeRT(rtB);
      rtA = createRT();
      rtB = createRT();
      simMaterial.uniforms.uPrev.value = rtA.texture;
      displayMaterial.uniforms.uTexture.value = rtA.texture;
    };

    resize();
    window.addEventListener('resize', resize);

    const tick = (t) => {
      displayMaterial.uniforms.uTime.value = t * 0.001 * speed;
      simMaterial.uniforms.uTime.value = t * 0.001 * speed;

      if (!isHovering) {
        const tt = t * 32e-5;
        const targetX = 0.5 + 0.46 * Math.sin(tt * 1.7) + 0.14 * Math.sin(tt * 3.1 + 1.2);
        const targetY = 0.5 + 0.44 * Math.cos(tt * 1.3) + 0.16 * Math.sin(tt * 2.3 + 0.4);
        virtualMouse.lerp({ x: targetX, y: targetY }, 0.02);
        mouse.copy(virtualMouse);
        if (wasUsingVirtual) {
          lastMouse.copy(mouse);
          wasUsingVirtual = false;
        }
      } else {
        wasUsingVirtual = true;
      }

      if (rtA && rtB) {
        simMaterial.uniforms.uLastMouse.value.copy(lastMouse);
        simMaterial.uniforms.uPrev.value = rtA.texture;
        simMaterial.uniforms.uClickTime.value = clickTime;
        clickTime += 0.016;
        renderer.setRenderTarget(rtB);
        renderer.render(simScene, camera);
        renderer.setRenderTarget(null);
        const tmp = rtA;
        rtA = rtB;
        rtB = tmp;
        displayMaterial.uniforms.uTexture.value = rtA.texture;
        renderer.render(displayScene, camera);
      }
      lastMouse.copy(mouse);
      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('pointerenter', handlePointerEnter);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
      cancelAnimationFrame(requestRef.current);
      disposeRT(rtA);
      disposeRT(rtB);
      renderer.dispose();
      simMaterial.dispose();
      displayMaterial.dispose();
      plane.dispose();
    };
  }, []);

  return <div ref={containerRef} id="container" style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} />;
};

export default Norrsken;
