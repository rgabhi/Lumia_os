import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Zap, Sliders, CheckCircle } from 'lucide-react';
import { Photo } from '../../types';

interface CameraAppProps {
  onClose: () => void;
  accentClass: string;
  onCapturePhoto: (photo: Photo) => void;
  soundEnabled: boolean;
}

type FilterType = 'normal' | 'magenta' | 'slate' | 'cyan' | 'sepia';

export default function CameraApp({ onClose, accentClass, onCapturePhoto, soundEnabled }: CameraAppProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mockCanvasRef = useRef<HTMLCanvasElement>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [filter, setFilter] = useState<FilterType>('normal');
  const [flashOn, setFlashOn] = useState(false);
  const [flashOverlay, setFlashOverlay] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isUsingMock, setIsUsingMock] = useState(false);

  // Initialize camera
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          activeStream = stream;
          setStreamActive(true);
          setIsUsingMock(false);
        }
      } catch (err) {
        console.warn('Webcam not available, booting mock holographic sandbox viewport', err);
        setStreamActive(false);
        setIsUsingMock(true);
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Animating mock cyberpunk scene on canvas
  useEffect(() => {
    let animId: number;
    if (isUsingMock && mockCanvasRef.current) {
      const canvas = mockCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let offset = 0;
        const render = () => {
          ctx.fillStyle = '#0a0d0d';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw neon Grid perspective lines
          ctx.strokeStyle = '#00abec33';
          ctx.lineWidth = 1;
          const cols = 20;
          const rows = 15;
          
          // Horizontal lines
          for (let i = 0; i < rows; i++) {
            const y = (canvas.height / rows) * i + (offset % (canvas.height / rows));
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
          // Vertical lines
          for (let i = 0; i < cols; i++) {
            const x = (canvas.width / cols) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }

          // Draw simple neon buildings / mountains
          ctx.fillStyle = '#1e0224';
          ctx.fillRect(50, 100, 80, 200);
          ctx.strokeStyle = '#d90274bb';
          ctx.lineWidth = 2;
          ctx.strokeRect(50, 100, 80, 200);

          ctx.fillStyle = '#01152d';
          ctx.fillRect(180, 150, 100, 150);
          ctx.strokeStyle = '#00abecbb';
          ctx.strokeRect(180, 150, 100, 150);

          ctx.fillStyle = '#161d00';
          ctx.fillRect(320, 80, 90, 220);
          ctx.strokeStyle = '#b3d349bb';
          ctx.strokeRect(320, 80, 90, 220);

          // Glowing Sun / Sphere
          ctx.beginPath();
          ctx.arc(canvas.width / 2, 70, 30, 0, Math.PI * 2);
          ctx.fillStyle = '#ff7b0022';
          ctx.fill();
          ctx.strokeStyle = '#ff7b00';
          ctx.stroke();

          // Reticle Crosshair
          ctx.strokeStyle = '#ffffff88';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.height / 2, 12, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 - 20, canvas.height / 2);
          ctx.lineTo(canvas.width / 2 + 20, canvas.height / 2);
          ctx.moveTo(canvas.width / 2, canvas.height / 2 - 20);
          ctx.lineTo(canvas.width / 2, canvas.height / 2 + 20);
          ctx.stroke();

          // Moving grid speed
          offset += 0.5;
          animId = requestAnimationFrame(render);
        };
        render();
      }
    }
    return () => cancelAnimationFrame(animId);
  }, [isUsingMock]);

  // Audio synthesize click beep
  const playShutterSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // High pitch click
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.15); // Drop down

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch (e) {
      console.warn('AudioContext failed to initialize', e);
    }
  };

  const handleCapture = () => {
    playShutterSound();
    
    // Trigger screen flash
    setFlashOverlay(true);
    setTimeout(() => {
      setFlashOverlay(false);
    }, 150);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (streamActive && videoRef.current) {
      // Draw frame from real video camera
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else if (isUsingMock && mockCanvasRef.current) {
      // Draw frame from mock cyberpunk grid canvas
      ctx.drawImage(mockCanvasRef.current, 0, 0, canvas.width, canvas.height);
    }

    // Apply Filter overlays onto captured photo canvas
    if (filter === 'magenta') {
      ctx.fillStyle = 'rgba(217, 2, 116, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (filter === 'cyan') {
      ctx.fillStyle = 'rgba(0, 171, 236, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (filter === 'slate') {
      // Grayscale conversion
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const bright = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
        data[i] = bright;
        data[i + 1] = bright;
        data[i + 2] = bright;
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (filter === 'sepia') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        data[i] = (r * 0.393) + (g * 0.769) + (b * 0.189);
        data[i+1] = (r * 0.349) + (g * 0.686) + (b * 0.168);
        data[i+2] = (r * 0.272) + (g * 0.534) + (b * 0.131);
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Save Captured Photo
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const newPhoto: Photo = {
        id: 'user-photo-' + Date.now(),
        url: dataUrl,
        date: 'Today',
        isUserCaptured: true
      };
      onCapturePhoto(newPhoto);

      // Notification feedback
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to capture frame as Base64 url', err);
    }
  };

  const getFilterStyle = (): React.CSSProperties => {
    if (filter === 'magenta') return { filter: 'hue-rotate(280deg) saturate(1.5)' };
    if (filter === 'cyan') return { filter: 'hue-rotate(180deg) saturate(1.5)' };
    if (filter === 'slate') return { filter: 'grayscale(100%) contrast(1.1)' };
    if (filter === 'sepia') return { filter: 'sepia(100%)' };
    return {};
  };

  return (
    <div className="h-full flex flex-col bg-black text-white p-6 select-none font-sans relative overflow-hidden">
      {/* Screen flash flashOverlay */}
      {flashOverlay && (
        <div className="absolute inset-0 bg-white z-[100] animate-fadeOut opacity-100 transition-opacity" />
      )}

      {/* App Header */}
      <div className="flex items-center justify-between mb-8 z-10">
        <div>
          <h1 className="font-light text-3xl tracking-tight uppercase">CAMERA</h1>
          <p className="text-xs text-gray-400 font-mono tracking-wider">
            {isUsingMock ? 'HOLOGRAPHIC SANDBOX ACTIVE' : 'USER MEDIA VIEWPORT'}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="px-3 py-1 border border-white hover:bg-white hover:text-black transition-colors text-xs font-mono"
        >
          BACK
        </button>
      </div>

      {/* Snapshot feedback bar */}
      {showNotification && (
        <div className="absolute top-20 inset-x-6 bg-cyan-600 text-white font-mono font-bold text-xs py-2 px-4 flex items-center justify-center gap-2 tracking-wider uppercase z-50 shadow-lg animate-[fadeIn_0.15s_ease-out]">
          <CheckCircle className="w-4 h-4" />
          Photo Captured & Saved to Photos roll
        </div>
      )}

      {/* Camera Viewfinder Box */}
      <div className="flex-1 flex flex-col justify-center mb-6 relative">
        <div className="aspect-[4/3] w-full border border-zinc-900 bg-zinc-950 relative overflow-hidden flex items-center justify-center shadow-inner">
          {/* Real video if stream active */}
          {streamActive && (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
              style={getFilterStyle()}
            />
          )}

          {/* Fallback Animated Grid Canvas */}
          {isUsingMock && (
            <canvas
              ref={mockCanvasRef}
              width={400}
              height={300}
              className="w-full h-full object-cover"
              style={getFilterStyle()}
            />
          )}

          {/* Flash indicator */}
          {flashOn && (
            <div className="absolute top-4 right-4 text-yellow-400 flex items-center gap-1 bg-black/60 px-2 py-1 text-[10px] font-mono">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>FLASH ON</span>
            </div>
          )}

          {/* Reticle guide markings */}
          <div className="absolute inset-6 border border-white/5 pointer-events-none flex flex-col justify-between p-2">
            <div className="flex justify-between text-[10px] font-mono text-white/30">
              <span>F/2.0</span>
              <span>1080P</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono text-white/30">
              <span>ISO 100</span>
              <span>AUTO</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden storage canvases used to crop/save screenshot */}
      <canvas ref={canvasRef} width={640} height={480} className="hidden" />

      {/* Filter Selector Flat Hub */}
      <div className="grid grid-cols-5 gap-1.5 mb-6">
        {(['normal', 'magenta', 'slate', 'cyan', 'sepia'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`py-1.5 border text-[9px] font-mono uppercase tracking-wider text-center transition-all ${
              filter === f 
                ? 'border-cyan-400 bg-cyan-950/20 text-cyan-400 font-bold' 
                : 'border-zinc-850 text-gray-500 hover:border-zinc-600 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tactile Flat Camera Shutter Bar */}
      <div className="flex items-center justify-between gap-4 z-10">
        <button
          onClick={() => setFlashOn(p => !p)}
          className={`p-3.5 border transition-all ${
            flashOn ? 'border-yellow-400 bg-yellow-950/10 text-yellow-400' : 'border-zinc-800 text-gray-500 hover:border-white'
          }`}
          title="Toggle Flash"
        >
          <Zap className="w-5 h-5" />
        </button>

        {/* Shutter Button */}
        <button
          onClick={handleCapture}
          className="flex-1 py-4 bg-white hover:bg-cyan-400 hover:text-black font-mono font-bold text-sm tracking-widest text-black uppercase active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5 fill-current" />
          Capture Shutter
        </button>

        <button
          onClick={() => {
            setIsUsingMock(p => !p);
            setStreamActive(p => !p);
          }}
          className="p-3.5 border border-zinc-855 text-gray-400 hover:border-white active:scale-95 transition-all"
          title="Switch Lens Mode"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
