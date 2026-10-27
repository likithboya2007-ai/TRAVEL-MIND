import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowDown, Sparkles, MapPin, Compass, ArrowRight, Globe, Camera, Navigation2 } from 'lucide-react';
import { DESTINATIONS } from '../data/destinations';

interface HeroGlobeProps {
  onPlanClick: () => void;
  onExploreClick: () => void;
  onSelectDestination: (destId: string) => void;
}

export const HeroGlobe: React.FC<HeroGlobeProps> = ({
  onPlanClick,
  onExploreClick,
  onSelectDestination,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);
  const [hoveredDestination, setHoveredDestination] = useState<string | null>(null);
  const [flyingTo, setFlyingTo] = useState<string | null>(null);

  // Create destination marker data with photos
  const destinationMarkers = DESTINATIONS.filter(d => 
    ['goa', 'hampi', 'jaipur', 'kerala', 'meghalaya', 'ladakh'].includes(d.id)
  ).map(d => ({
    id: d.id,
    name: d.name,
    lat: d.lat,
    lng: d.lng,
    description: d.description,
    photoUrl: '', // Photos handled by destination showcase
  }));

  // Floating destination highlights (restrained, 3 destinations)
  const floatingCards = [
    {
      id: 'hampi',
      name: 'Hampi',
      region: 'Karnataka',
      coords: '15.335°N · 76.460°E',
      highlight: 'Ancient granite boulder landscapes & sacred ruins',
      vibe: 'Culture & Heritage',
      delayClass: 'animate-float',
      topPos: 'top-24 sm:top-28 right-6 lg:right-12',
    },
    {
      id: 'ladakh',
      name: 'Ladakh',
      region: 'Himalayas',
      coords: '34.152°N · 77.577°E',
      highlight: 'Glacial valleys, high passes & monastery dawns',
      vibe: 'Alpine Wonder',
      delayClass: 'animate-float-delayed',
      topPos: 'top-[48%] right-4 lg:right-16',
    },
    {
      id: 'goa',
      name: 'Goa',
      region: 'Arabian Sea',
      coords: '15.299°N · 74.124°E',
      highlight: 'Crescent estuaries, palm groves & sunset serenades',
      vibe: 'Coastal Serenity',
      delayClass: 'animate-float-slow',
      topPos: 'bottom-20 sm:bottom-24 right-8 lg:right-20',
    },
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL safely
    const isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebGlSupported(false);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050811, 0.045);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    // Slightly offset camera for wide desktop layout
    camera.position.set(1.0, 0, 7.3);

    // --- PROCEDURAL GLOBE TEXTURE (Midnight Navy & Teal Grid) ---
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Deep midnight ocean background
    ctx.fillStyle = '#060c1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle lat/long coordinates grid with cyan hue
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Equator highlight
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 256);
    ctx.lineTo(canvas.width, 256);
    ctx.stroke();

    // Procedural continents with midnight charcoal & navy depth
    const landmasses = [
      // Eurasia & India
      { x: 550, y: 140, r: 125 },
      { x: 620, y: 220, r: 85 }, // India subcontinent
      { x: 680, y: 190, r: 110 }, // East Asia
      { x: 480, y: 140, r: 90 }, // Europe
      // Africa
      { x: 490, y: 260, r: 105 },
      // Americas
      { x: 220, y: 150, r: 115 },
      { x: 290, y: 310, r: 98 },
      // Australia
      { x: 790, y: 340, r: 70 },
    ];

    landmasses.forEach(({ x, y, r }) => {
      const grad = ctx.createRadialGradient(x, y, r * 0.15, x, y, r);
      grad.addColorStop(0, '#13233f');
      grad.addColorStop(0.7, '#0d192f');
      grad.addColorStop(1, '#070e1c');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Glowing city clusters
    const cityCoords = [
      { x: 620, y: 225 }, // Delhi/Mumbai/Bengaluru
      { x: 635, y: 215 },
      { x: 615, y: 240 },
      { x: 490, y: 150 }, // London/Paris
      { x: 520, y: 145 },
      { x: 690, y: 200 }, // Tokyo
      { x: 230, y: 160 }, // New York
      { x: 190, y: 170 }, // San Francisco
      { x: 670, y: 210 }, // Shanghai
      { x: 570, y: 220 }, // Dubai
      { x: 505, y: 310 }, // Nairobi
      { x: 790, y: 345 }, // Sydney
    ];

    cityCoords.forEach(({ x, y }) => {
      // Core light
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric cyan glow
      const glowGrad = ctx.createRadialGradient(x, y, 1, x, y, 8);
      glowGrad.addColorStop(0, 'rgba(45, 212, 191, 0.7)');
      glowGrad.addColorStop(1, 'rgba(45, 212, 191, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    const globeTexture = new THREE.CanvasTexture(canvas);
    globeTexture.colorSpace = THREE.SRGBColorSpace;

    // --- GLOBE MESH ---
    const globeGroup = new THREE.Group();
    // Offset globe towards the right on wide displays to leave room for editorial copy
    globeGroup.position.set(1.3, -0.1, 0);
    scene.add(globeGroup);

    const globeGeo = new THREE.SphereGeometry(2.35, isSoftwareGl ? 32 : 64, isSoftwareGl ? 32 : 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: globeTexture,
      roughness: 0.6,
      metalness: 0.25,
      emissive: new THREE.Color(0x040914),
      emissiveIntensity: 0.6,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Atmospheric halo
    const atmosGeo = new THREE.SphereGeometry(2.48, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // Inner subtle glow
    const innerGlowGeo = new THREE.SphereGeometry(2.38, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({
      color: 0x14b8a6,
      transparent: true,
      opacity: 0.08,
      wireframe: true,
    });
    const innerGlowMesh = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    globeGroup.add(innerGlowMesh);

    // --- 3D CURVED FLIGHT ROUTE ARCS ---
    function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    }

    const routePairs = [
      { from: { lat: 28.6139, lng: 77.209 }, to: { lat: 15.2993, lng: 74.124 } }, // Delhi -> Goa
      { from: { lat: 19.076, lng: 72.8777 }, to: { lat: 15.335, lng: 76.46 } }, // Mumbai -> Hampi
      { from: { lat: 12.9716, lng: 77.5946 }, to: { lat: 9.9312, lng: 76.2673 } }, // Bengaluru -> Kerala
      { from: { lat: 28.6139, lng: 77.209 }, to: { lat: 26.9124, lng: 75.7873 } }, // Delhi -> Jaipur
      { from: { lat: 28.6139, lng: 77.209 }, to: { lat: 34.1526, lng: 77.5771 } }, // Delhi -> Ladakh
      { from: { lat: 22.5726, lng: 88.3639 }, to: { lat: 25.5788, lng: 91.8933 } }, // Kolkata -> Meghalaya
      { from: { lat: 19.076, lng: 72.8777 }, to: { lat: 48.8566, lng: 2.3522 } }, // Mumbai -> Paris
      { from: { lat: 28.6139, lng: 77.209 }, to: { lat: 35.0116, lng: 135.7681 } }, // Delhi -> Kyoto
    ];

    const arcLines: THREE.Line[] = [];
    routePairs.forEach((pair, idx) => {
      const vFrom = latLngToVector3(pair.from.lat, pair.from.lng, 2.37);
      const vTo = latLngToVector3(pair.to.lat, pair.to.lng, 2.37);

      const mid = new THREE.Vector3().addVectors(vFrom, vTo).multiplyScalar(0.5);
      const dist = vFrom.distanceTo(vTo);
      mid.normalize().multiplyScalar(2.37 + Math.min(dist * 0.35, 1.2));

      const curve = new THREE.QuadraticBezierCurve3(vFrom, mid, vTo);
      const points = curve.getPoints(isSoftwareGl ? 20 : 36);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: idx % 2 === 0 ? 0x2dd4bf : 0x38bdf8,
        transparent: true,
        opacity: 0.8,
        linewidth: 2,
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      globeGroup.add(arcLine);
      arcLines.push(arcLine);

      // Pulse destination markers
      const markerGeo = new THREE.SphereGeometry(0.048, 12, 12);
      const markerMat = new THREE.MeshBasicMaterial({
        color: idx % 2 === 0 ? 0x2dd4bf : 0x38bdf8,
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(vTo);
      globeGroup.add(marker);
    });

    // --- ENHANCED 3D DESTINATION MARKERS WITH SPRITES ---
    const markerSprites: Array<{ mesh: THREE.Mesh; sprite: THREE.Sprite; id: string; lat: number; lng: number }> = [];
    
    destinationMarkers.forEach((dest) => {
      const pos = latLngToVector3(dest.lat, dest.lng, 2.37);
      
      // 3D marker pin (larger, more prominent)
      const pinGeo = new THREE.ConeGeometry(0.06, 0.15, 16);
      const pinMat = new THREE.MeshStandardMaterial({
        color: 0x2dd4bf,
        emissive: 0x2dd4bf,
        emissiveIntensity: 0.5,
        metalness: 0.3,
        roughness: 0.4,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.lookAt(0, 0, 0);
      pinMesh.rotateX(Math.PI);
      globeGroup.add(pinMesh);
      
      // Pulsing ring at base
      const ringGeo = new THREE.RingGeometry(0.05, 0.08, 16);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x2dd4bf,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);
      globeGroup.add(ring);
      
      // Label sprite
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = 256;
      spriteCanvas.height = 64;
      const spriteCtx = spriteCanvas.getContext('2d')!;
      
      // Background
      spriteCtx.fillStyle = 'rgba(10, 18, 38, 0.95)';
      spriteCtx.roundRect(8, 8, 240, 48, 8);
      spriteCtx.fill();
      
      // Border
      spriteCtx.strokeStyle = 'rgba(45, 212, 191, 0.8)';
      spriteCtx.lineWidth = 2;
      spriteCtx.roundRect(8, 8, 240, 48, 8);
      spriteCtx.stroke();
      
      // Text
      spriteCtx.fillStyle = '#ffffff';
      spriteCtx.font = 'bold 24px sans-serif';
      spriteCtx.textAlign = 'center';
      spriteCtx.textBaseline = 'middle';
      spriteCtx.fillText(dest.name, 128, 32);
      
      const spriteTexture = new THREE.CanvasTexture(spriteCanvas);
      const spriteMat = new THREE.SpriteMaterial({
        map: spriteTexture,
        transparent: true,
        opacity: 0.9,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.8, 0.2, 1);
      sprite.position.copy(pos).multiplyScalar(1.15);
      globeGroup.add(sprite);
      
      markerSprites.push({ mesh: pinMesh, sprite, id: dest.id, lat: dest.lat, lng: dest.lng });
    });

    // --- BACKGROUND STAR PARTICLES ---
    const starCount = isSoftwareGl ? 80 : 250;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 20;
      starPositions[i + 1] = (Math.random() - 0.5) * 16;
      starPositions[i + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.045,
      transparent: true,
      opacity: 0.5,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // --- LIGHTING ---
    const keyLight = new THREE.DirectionalLight(0xf0fdfa, 2.4);
    keyLight.position.set(5, 3, 5);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x0a192f, 0x050811, 1.4);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.8);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    // Initial globe angle framing India prominently
    globeGroup.rotation.y = 4.4;
    globeGroup.rotation.x = 0.35;

    // Mouse tracking for subtle tilt
    let targetRotX = 0.35;
    let targetRotY = 4.4;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (isDragging) {
        const deltaX = (e.clientX - prevMouseX) * 0.005;
        const deltaY = (e.clientY - prevMouseY) * 0.005;
        targetRotY += deltaX;
        targetRotX = Math.max(-1.0, Math.min(1.0, targetRotX + deltaY));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Animation Loop
    let animId = 0;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      if (!isDragging) {
        targetRotY += dt * 0.07; // Slow cinematic rotation
      }

      globeGroup.rotation.y += (targetRotY - globeGroup.rotation.y) * 0.06;
      globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.06;

      starField.rotation.y += dt * 0.008;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        setTimeout(() => {
          animId = requestAnimationFrame(animate);
        }, 60);
      } else {
        animId = requestAnimationFrame(animate);
      }
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      // Adjust globe offset for smaller screens
      if (w < 1024) {
        globeGroup.position.set(0, 0.3, 0);
      } else {
        globeGroup.position.set(1.3, -0.1, 0);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      globeTexture.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      arcLines.forEach((l) => {
        l.geometry.dispose();
        (l.material as THREE.Material).dispose();
      });
      if (domElement.parentElement) {
        domElement.parentElement.removeChild(domElement);
      }
    };
  }, []);

  return (
    <section
      id="discover"
      className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#050811] via-[#070d1c] to-[#050811] pt-28 pb-10"
      aria-label="Cinematic 3D Hero Experience"
    >
      {/* 3D WebGL Canvas or SVG Fallback */}
      {webGlSupported ? (
        <div
          ref={mountRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0"
          data-testid="hero-globe-canvas"
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <div className="relative w-[480px] h-[480px] rounded-full border border-teal-500/30 bg-gradient-to-tr from-[#0b162c] to-[#040813] flex items-center justify-center shadow-2xl shadow-teal-500/10">
            <div className="absolute inset-8 rounded-full border border-teal-400/20 border-dashed animate-spin" style={{ animationDuration: '40s' }} />
            <div className="absolute inset-20 rounded-full border border-cyan-400/30" />
            <Globe className="w-24 h-24 text-teal-400/40" />
          </div>
        </div>
      )}

      {/* Atmospheric depth vignette & gradients */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_35%_50%,rgba(5,8,17,0.1)_0%,rgba(5,8,17,0.75)_65%,rgba(5,8,17,0.98)_100%)] z-1" />

      {/* Main Hero Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex-1 flex flex-col justify-center pointer-events-none">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 pointer-events-auto">
            {/* Subtle editorial kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-xs font-mono uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>AI Predictive Travel Intelligence</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-6 text-balance">
              Discover the world.{' '}
              <span className="bg-gradient-to-r from-teal-200 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Your way.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 font-normal leading-relaxed mb-8 max-w-xl text-balance">
              Extraordinary destinations. Intelligent itineraries. Journeys designed around you.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onPlanClick}
                className="px-7 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-teal-400 via-teal-300 to-cyan-400 rounded-xl hover:from-teal-300 hover:to-cyan-300 hover:shadow-xl hover:shadow-teal-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 flex items-center gap-2"
              >
                <span>Plan Your Journey</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onExploreClick}
                className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-200 border border-slate-700/80 bg-slate-900/40 backdrop-blur-sm rounded-xl hover:border-teal-400/60 hover:text-white hover:bg-slate-800/60 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-teal-400" />
                <span>Explore Destinations</span>
              </button>
            </div>

            {/* Micro stats banner */}
            <div className="grid grid-cols-3 gap-6 max-w-md mt-10 pt-8 border-t border-slate-800/80">
              <div>
                <p className="font-display text-2xl font-bold text-white tracking-tight">100%</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Global Geocoding</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-teal-300 tracking-tight">Live</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Wikimedia Visuals</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-cyan-300 tracking-tight">INR</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Transparent Budgets</p>
              </div>
            </div>
          </div>

          {/* Right Column: 2-3 Restrained Floating Destination Elements */}
          <div className="lg:col-span-5 hidden lg:flex flex-col gap-4 pointer-events-auto items-end pr-2">
            {floatingCards.map((card) => (
              <div
                key={card.id}
                onClick={() => onSelectDestination(card.id)}
                className={`w-80 p-4 rounded-2xl bg-[#0a1226]/80 backdrop-blur-md border border-slate-700/60 hover:border-teal-400/50 hover:bg-[#0d1833]/90 transition-all duration-300 shadow-xl cursor-pointer group ${card.delayClass}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectDestination(card.id);
                }}
                aria-label={`Featured destination: ${card.name}, ${card.region}. Click to plan journey.`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span className="font-mono text-[11px] text-teal-300 uppercase tracking-wider">
                      {card.coords}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-950/70 border border-teal-800/40 text-teal-300">
                    {card.vibe}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="font-display text-lg font-bold text-white group-hover:text-teal-200 transition-colors">
                    {card.name}
                  </h3>
                  <span className="text-xs text-slate-400">{card.region}</span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                  {card.highlight}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <span className="text-slate-400 text-[11px]">Personalized itinerary</span>
                  <span className="text-teal-300 group-hover:text-teal-200 flex items-center gap-1 font-medium text-[11px]">
                    Plan this <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Discreet bottom scroll indicator */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex items-center justify-between text-xs text-slate-400 pointer-events-auto pt-6">
        <a
          href="#scenic-transition"
          className="flex items-center gap-2 hover:text-teal-300 transition-colors py-1 focus:outline-none focus-visible:underline"
          aria-label="Scroll to discover destinations"
        >
          <ArrowDown className="w-3.5 h-3.5 text-teal-400 animate-bounce" />
          <span className="font-mono tracking-wider text-[11px] uppercase">Scroll to descend from orbit</span>
        </a>
        <span className="hidden sm:inline font-mono text-[11px] text-slate-500">
          Curated destinations &amp; global open search
        </span>
      </div>
    </section>
  );
};
