"use client";

import { useEffect, useRef, useState } from "react";

interface WorldAssets {
  splats: {
    spz_urls: {
      "100k": string;
      "500k": string;
      full_res: string;
    };
  };
  thumbnail_url: string;
  caption: string;
}

interface World {
  id: string;
  display_name: string;
  assets: WorldAssets;
  world_marble_url: string;
}

interface SplatViewerProps {
  world: World | null;
  onClose: () => void;
}

export default function SplatViewer({ world, onClose }: SplatViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!world || !iframeRef.current) return;

    const splatUrl = world.assets.splats.spz_urls.full_res;
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; }
    canvas { display: block; width: 100vw; height: 100vh; }
    #loading {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-family: system-ui, sans-serif;
      text-align: center;
    }
    #progress {
      width: 200px;
      height: 4px;
      background: #333;
      border-radius: 2px;
      margin-top: 10px;
      overflow: hidden;
    }
    #progress-bar {
      height: 100%;
      background: #3b82f6;
      width: 0%;
      transition: width 0.3s;
    }
  </style>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.178.0/three.module.js",
      "@sparkjsdev/spark": "https://sparkjs.dev/releases/spark/0.1.10/spark.module.js"
    }
  }
  </script>
</head>
<body>
  <div id="loading">
    <div>Loading 3D scene...</div>
    <div id="progress"><div id="progress-bar"></div></div>
    <div id="percent">0%</div>
  </div>
  <script type="module">
    import * as THREE from "three";
    import { SparkRenderer, SplatMesh, SplatLoader, SparkControls } from "@sparkjsdev/spark";

    const loadingEl = document.getElementById('loading');
    const progressBar = document.getElementById('progress-bar');
    const percentEl = document.getElementById('percent');

    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.01, 1000);
      scene.add(camera);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      document.body.appendChild(renderer.domElement);

      const spark = new SparkRenderer({ renderer, view: { sort32: true } });
      scene.add(spark);

      const controls = new SparkControls({ canvas: renderer.domElement });

      const loader = new SplatLoader();
      const packedSplats = await loader.loadAsync("${splatUrl}", (e) => {
        const pct = Math.round((e.loaded / e.total) * 100);
        progressBar.style.width = pct + '%';
        percentEl.textContent = pct + '%';
        window.parent.postMessage({ type: 'progress', percent: pct }, '*');
      });

      const splatMesh = new SplatMesh({ packedSplats });
      splatMesh.quaternion.set(1, 0, 0, 0);
      scene.add(splatMesh);

      loadingEl.style.display = 'none';
      window.parent.postMessage({ type: 'loaded' }, '*');

      function animate() {
        requestAnimationFrame(animate);
        controls.update(camera);
        renderer.render(scene, camera);
      }
      animate();

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });

    } catch (err) {
      console.error('Failed to load:', err);
      loadingEl.innerHTML = '<div style="color: #f87171;">Failed to load 3D scene</div><div style="color: #888; font-size: 12px; margin-top: 8px;">' + err.message + '</div>';
      window.parent.postMessage({ type: 'error', message: err.message }, '*');
    }
  </script>
</body>
</html>`;

    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'loaded') {
        setLoading(false);
      } else if (event.data.type === 'error') {
        setError(event.data.message);
        setLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [world]);

  if (!world) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white text-xl font-semibold">
              {world.display_name || "Generated World"}
            </h2>
            <p className="text-gray-300 text-sm mt-1 max-w-2xl line-clamp-2">
              {world.assets.caption}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80">
          <div className="text-center text-red-400 p-8">
            <p className="text-lg">Failed to load 3D scene</p>
            <p className="text-sm text-gray-400 mt-2">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Iframe for 3D viewer */}
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title="3D Viewer"
        sandbox="allow-scripts allow-same-origin"
      />

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-white/60 text-sm">
        <p>🖱️ Drag to rotate • Scroll to zoom • Right-click to pan</p>
      </div>

      {/* Open in Marble link */}
      <a
        href={world.world_marble_url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
      >
        Open in Marble ↗
      </a>
    </div>
  );
}
