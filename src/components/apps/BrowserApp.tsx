import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Globe, ArrowLeft, ArrowRight, RotateCw, Play, Volume2, 
  ShoppingBag, Star, Download, Trash2, Pin, PinOff, CheckCircle2, 
  Palette, MapPin, Navigation, Info, HelpCircle, RefreshCw, 
  Undo, Save, Plus, AlertTriangle, MessageSquare, Terminal, ChevronRight, X,
  Calculator, Compass
} from 'lucide-react';
import { Intent, SystemSettings, TileConfig, Photo } from '../../types';

interface BrowserAppProps {
  onClose: () => void;
  accentClass: string;
  activeIntent?: Intent | null;
  onClearActiveIntent?: () => void;
  onSendIntent?: (intent: Omit<Intent, 'id' | 'timestamp'>) => void;
  tiles: TileConfig[];
  onUpdateTiles: (tiles: TileConfig[]) => void;
  playHapticSound?: (freq?: number, dur?: number, type?: OscillatorType) => void;
  settings: SystemSettings;
  onCapturePhoto?: (photo: Photo) => void;
}

interface StoreApp {
  id: string;
  name: string;
  appId: string;
  category: 'Creativity' | 'Games' | 'Travel' | 'Utilities' | 'Music';
  developer: string;
  rating: number;
  reviewsCount: number;
  size: string;
  description: string;
  features: string[];
  url: string;
  accentColor: string;
  screenshots: string[];
  reviews: { author: string; text: string; rating: number; date: string }[];
}

export default function BrowserApp({ 
  onClose, 
  accentClass,
  activeIntent,
  onClearActiveIntent,
  onSendIntent,
  tiles,
  onUpdateTiles,
  playHapticSound,
  settings,
  onCapturePhoto
}: BrowserAppProps) {
  
  // Start with Lumina Play App Store as the home page!
  const [url, setUrl] = useState('metro://play');
  const [inputUrl, setInputUrl] = useState('metro://play');
  const [history, setHistory] = useState<string[]>(['metro://play']);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Active Store Tab: 'featured' | 'apps' | 'games' | 'library'
  const [storeTab, setStoreTab] = useState<'featured' | 'apps' | 'games' | 'library'>('featured');
  // Store search query
  const [storeSearch, setStoreSearch] = useState('');
  
  // Selected Store App for detail view
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Download simulation progress state (appId -> percentage 0-100)
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    playHapticSound?.(900, 0.15, 'sine');
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3500);
  };

  // Apps registry for Lumina Play
  const STORE_APPS: StoreApp[] = [
    {
      id: 'paint',
      name: 'Metro Paint Studio',
      appId: 'paint',
      category: 'Creativity',
      developer: 'Lumia Arts & Co.',
      rating: 4.8,
      reviewsCount: 124,
      size: '1.4 MB',
      description: 'The premier minimalist drawing suite for the Lumia ecosystem. Features sleek neon stylus brushes, precision thickness sliders, instant drawing save-to-gallery mechanics, and physical click feedback. Experience fluid pixel layouts crafted purely with content-first aesthetics.',
      features: [
        'High-fidelity touch/drag canvas engine',
        'Five iconic Lumina neon ink color palettes',
        'Tactile fluid thickness slider (Pen, Brush, Marker, Stylus Glow)',
        'Direct integration with standard system Photos Roll',
        'Instant multi-step undo buffer & clear capabilities'
      ],
      url: 'metro://paint',
      accentColor: '#d90274', // Magenta
      screenshots: [
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&auto=format&fit=crop&q=60'
      ],
      reviews: [
        { author: 'Marcus Brody', text: 'Stunning interface! The neon glow pen looks beautiful on my ClearBlack display.', rating: 5, date: '2 days ago' },
        { author: 'Elena R.', text: 'Super responsive stylus drawing! Saving directly to the Photos app is a killer feature.', rating: 5, date: '1 week ago' },
        { author: 'Dave K.', text: 'Pure Windows Phone nostalgia with practical drawing tools.', rating: 4, date: '2 weeks ago' }
      ]
    },
    {
      id: 'calculator',
      name: 'Tile Calculator Pro',
      appId: 'calculator',
      category: 'Utilities',
      developer: 'Metro Utilities Ltd.',
      rating: 4.7,
      reviewsCount: 98,
      size: '0.8 MB',
      description: 'An elegant, fluid mathematics grid optimized for rapid calculation. Employs Nokia’s signature high-contrast display blocks, instant mathematical evaluation, full click-tilt animations, and custom haptic sound layers for tactile numeric calculations.',
      features: [
        'High-density grid layout prioritizing numeric entry',
        'Sleek floating operator animations',
        'Real-time formula preview banner',
        'Fully responsive layout adaptable to all device forms',
        'Haptic audio feedback on every button tap'
      ],
      url: 'metro://calculator',
      accentColor: '#b3d349', // Lime
      screenshots: [
        'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=500&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1611125260769-9c59ec4071da?w=500&auto=format&fit=crop&q=60'
      ],
      reviews: [
        { author: 'Sarah Connor', text: 'Incredibly quick. I love the tap feedback tones!', rating: 5, date: '3 days ago' },
        { author: 'Neil H.', text: 'Minimalist calculator that does exactly what it needs without clutter.', rating: 5, date: '1 month ago' }
      ]
    },
    {
      id: 'maps',
      name: 'Lumia Vector Maps',
      appId: 'maps',
      category: 'Travel',
      developer: 'Lumia Navigation Labs',
      rating: 4.6,
      reviewsCount: 142,
      size: '2.5 MB',
      description: 'Explore Seattle and Redmond through a custom-rendered retro-future high-contrast wireframe vector map. Set navigation nodes, search historical points of interest, watch glowing routing paths calculate live, and view simulated ETA, speed, and turn-by-turn routes.',
      features: [
        'Signature wireframe glowing blueprint grid maps',
        'Interactive location index with searchable hotspots',
        'Live routing generator calculates paths with neon trail overlays',
        'Real-time simulated speedometer, compass & travel logging',
        'Offline-ready vector caching simulator'
      ],
      url: 'metro://maps',
      accentColor: '#00abec', // Cyan
      screenshots: [
        'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=500&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=500&auto=format&fit=crop&q=60'
      ],
      reviews: [
        { author: 'Agent Smith', text: 'This glowing neon vector map is gorgeous. Extremely fast offline routing.', rating: 5, date: '5 days ago' },
        { author: 'Jenna L.', text: 'Makes Seattle look like a Tron city grid. I love it!', rating: 5, date: '3 weeks ago' }
      ]
    },
    {
      id: 'retro-games',
      name: 'Snake Arcade HD',
      appId: 'retro-games',
      category: 'Games',
      developer: 'Nokia Arcade Hub',
      rating: 4.9,
      reviewsCount: 310,
      size: '1.1 MB',
      description: 'The absolute legendary arcade classic, rebuilt for modern tiles. Features customizable game canvas speed settings, responsive virtual direction pad nodes, pixel grids, real-time scoreboard persistence, and classic arcade sound chimes.',
      features: [
        'Flawless responsive grid layout',
        'Virtual multi-directional D-pad mechanics',
        'Persistent score, high score tracking',
        'Configurable game speed modes',
        'Polished magenta and cyan retro palette styling'
      ],
      url: 'metro://retro-games',
      accentColor: '#f05a28', // Orange
      screenshots: [
        'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?w=500&auto=format&fit=crop&q=60',
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=60'
      ],
      reviews: [
        { author: 'RetroGamer99', text: 'Brings back 1999 immediately. The virtual pad controls perfectly.', rating: 5, date: 'Yesterday' },
        { author: 'LumiaFan', text: 'A masterpiece of classic software design.', rating: 5, date: '2 weeks ago' }
      ]
    }
  ];

  // Map settings accent colors
  const getAccentBg = () => {
    if (settings.accentColor === 'cyan') return 'bg-[#00abec] text-white';
    if (settings.accentColor === 'magenta') return 'bg-[#d90274] text-white';
    if (settings.accentColor === 'lime') return 'bg-[#b3d349] text-black';
    if (settings.accentColor === 'orange') return 'bg-[#f05a28] text-white';
    return 'bg-[#a252fc] text-white';
  };

  const getAccentText = () => {
    if (settings.accentColor === 'cyan') return 'text-[#00abec]';
    if (settings.accentColor === 'magenta') return 'text-[#d90274]';
    if (settings.accentColor === 'lime') return 'text-[#b3d349]';
    if (settings.accentColor === 'orange') return 'text-[#f05a28]';
    return 'text-[#a252fc]';
  };

  const getAccentBorder = () => {
    if (settings.accentColor === 'cyan') return 'border-[#00abec]';
    if (settings.accentColor === 'magenta') return 'border-[#d90274]';
    if (settings.accentColor === 'lime') return 'border-[#b3d349]';
    if (settings.accentColor === 'orange') return 'border-[#f05a28]';
    return 'border-[#a252fc]';
  };

  // Handle incoming intents
  useEffect(() => {
    if (activeIntent) {
      if (activeIntent.action === 'android.intent.action.VIEW') {
        const targetUrl = activeIntent.data || '';
        if (targetUrl) {
          navigateTo(targetUrl);
        }
      }
      onClearActiveIntent?.();
    }
  }, [activeIntent, onClearActiveIntent]);

  // --- Browser navigation engine ---
  const navigateTo = (newUrl: string) => {
    const nextHistory = history.slice(0, historyIdx + 1);
    nextHistory.push(newUrl);
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1);
    setUrl(newUrl);
    setInputUrl(newUrl);

    // If navigating to detail URL
    if (newUrl.startsWith('metro://play/detail?id=')) {
      const id = newUrl.split('id=')[1];
      setSelectedAppId(id || null);
    } else {
      setSelectedAppId(null);
    }
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      const prevUrl = history[historyIdx - 1];
      setHistoryIdx(prev => prev - 1);
      setUrl(prevUrl);
      setInputUrl(prevUrl);

      if (prevUrl.startsWith('metro://play/detail?id=')) {
        const id = prevUrl.split('id=')[1];
        setSelectedAppId(id || null);
      } else {
        setSelectedAppId(null);
      }
      playHapticSound?.(600, 0.05);
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      const nextUrl = history[historyIdx + 1];
      setHistoryIdx(prev => prev + 1);
      setUrl(nextUrl);
      setInputUrl(nextUrl);

      if (nextUrl.startsWith('metro://play/detail?id=')) {
        const id = nextUrl.split('id=')[1];
        setSelectedAppId(id || null);
      } else {
        setSelectedAppId(null);
      }
      playHapticSound?.(600, 0.05);
    }
  };

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    let target = inputUrl.trim();
    if (!target) return;
    if (!target.startsWith('metro://') && !target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'metro://search?q=' + encodeURIComponent(target);
    }
    navigateTo(target);
  };

  // --- Store Installation Simulation Engine ---
  const handleInstallApp = (app: StoreApp) => {
    if (isDownloading[app.id]) return;

    playHapticSound?.(600, 0.1, 'sine');
    setIsDownloading(prev => ({ ...prev, [app.id]: true }));
    setDownloadProgress(prev => ({ ...prev, [app.id]: 0 }));

    let currentProg = 0;
    const interval = setInterval(() => {
      currentProg += Math.floor(Math.random() * 15) + 5;
      if (currentProg >= 100) {
        currentProg = 100;
        clearInterval(interval);
        
        // Finalize installation
        setIsDownloading(prev => ({ ...prev, [app.id]: false }));
        
        // Pin app directly as a live tile to start screen
        const isAlreadyPinned = tiles.some(t => t.id === app.id);
        if (!isAlreadyPinned) {
          const newTile: TileConfig = {
            id: app.id,
            name: app.name,
            appId: app.appId,
            size: app.id === 'maps' ? 'wide' : 'medium',
            order: tiles.length + 1,
            visible: true
          };
          onUpdateTiles([...tiles, newTile]);
        }
        
        showToast(`"${app.name}" Installed Successfully!`);
        playHapticSound?.(1000, 0.25, 'triangle');
      }
      setDownloadProgress(prev => ({ ...prev, [app.id]: currentProg }));
    }, 400);
  };

  const handleUninstallApp = (appId: string) => {
    const updated = tiles.filter(t => t.id !== appId);
    onUpdateTiles(updated);
    playHapticSound?.(400, 0.15, 'sawtooth');
    showToast(`Uninstalled "${STORE_APPS.find(a => a.id === appId)?.name || appId}"`);
  };

  const handleTogglePinState = (tileId: string) => {
    const updated = tiles.map(t => {
      if (t.id === tileId) {
        const nextVisible = !t.visible;
        showToast(nextVisible ? `Pinned tile to Start screen` : `Unpinned tile from Start screen`);
        return { ...t, visible: nextVisible };
      }
      return t;
    });
    onUpdateTiles(updated);
    playHapticSound?.(650, 0.08);
  };

  // --- SUB-APP 1: SNAKE RETRO GAME STATE & LOGIC ---
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<{ x: number; y: number }>({ x: 5, y: 5 });
  const [dir, setDir] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const snakeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Playable Snake Game loop
  useEffect(() => {
    if (url !== 'metro://retro-games' || !gameActive) return;

    const gameLoop = setInterval(() => {
      setSnake((prev) => {
        const head = { ...prev[0] };
        if (dir === 'UP') head.y -= 1;
        if (dir === 'DOWN') head.y += 1;
        if (dir === 'LEFT') head.x -= 1;
        if (dir === 'RIGHT') head.x += 1;

        // Wall collisions
        if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 20) {
          setGameActive(false);
          showToast('Game Over! Score: ' + score);
          return [{ x: 10, y: 10 }];
        }

        // Self collision
        for (const seg of prev) {
          if (seg.x === head.x && seg.y === head.y) {
            setGameActive(false);
            showToast('Game Over! Score: ' + score);
            return [{ x: 10, y: 10 }];
          }
        }

        const nextSnake = [head, ...prev];

        // Eat food
        if (head.x === food.x && head.y === food.y) {
          playHapticSound?.(880, 0.05, 'triangle');
          setScore(s => {
            const nextScore = s + 10;
            if (nextScore > highScore) setHighScore(nextScore);
            return nextScore;
          });
          setFood({
            x: Math.floor(Math.random() * 20),
            y: Math.floor(Math.random() * 20)
          });
        } else {
          nextSnake.pop();
        }

        return nextSnake;
      });
    }, 150);

    return () => clearInterval(gameLoop);
  }, [url, gameActive, dir, food, score, highScore]);

  // Render Snake canvas
  useEffect(() => {
    if (url !== 'metro://retro-games' || !snakeCanvasRef.current) return;
    const canvas = snakeCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0f0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid bounds
    ctx.strokeStyle = '#1a2426';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo((canvas.width / 20) * i, 0);
      ctx.lineTo((canvas.width / 20) * i, canvas.height);
      ctx.moveTo(0, (canvas.height / 20) * i);
      ctx.lineTo(canvas.width, (canvas.height / 20) * i);
      ctx.stroke();
    }

    // Draw food
    ctx.fillStyle = '#d90274'; // Magenta food
    ctx.fillRect(
      (canvas.width / 20) * food.x + 2,
      (canvas.height / 20) * food.y + 2,
      (canvas.width / 20) - 4,
      (canvas.height / 20) - 4
    );

    // Draw snake
    snake.forEach((seg, idx) => {
      ctx.fillStyle = idx === 0 ? '#00abec' : '#007eb0'; // Cyan snake
      ctx.fillRect(
        (canvas.width / 20) * seg.x + 1,
        (canvas.height / 20) * seg.y + 1,
        (canvas.width / 20) - 2,
        (canvas.height / 20) - 2
      );
    });
  }, [url, snake, food]);


  // --- SUB-APP 2: METRO PAINT STUDIO STATE & LOGIC ---
  const paintCanvasRef = useRef<HTMLCanvasElement>(null);
  const [paintColor, setPaintColor] = useState('#d90274'); // default Magenta
  const [paintBrushWidth, setPaintBrushWidth] = useState(4);
  const [isDrawingPaint, setIsDrawingPaint] = useState(false);
  const [paintUndoStack, setPaintUndoStack] = useState<string[]>([]);

  // Initialize Canvas with proper dimensions and backfill white or dark
  useEffect(() => {
    if (url !== 'metro://paint' || !paintCanvasRef.current) return;
    const canvas = paintCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white canvas background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [url]);

  const saveCanvasState = () => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return;
    setPaintUndoStack(prev => [...prev, canvas.toDataURL()]);
  };

  const handlePaintUndo = () => {
    const canvas = paintCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || paintUndoStack.length === 0) return;

    playHapticSound?.(500, 0.05);
    const prevStates = [...paintUndoStack];
    const prevState = prevStates.pop();
    setPaintUndoStack(prevStates);

    if (prevState) {
      const img = new Image();
      img.src = prevState;
      img.onload = () => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: ((e.touches[0].clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.touches[0].clientY - rect.top) / rect.height) * canvas.height
      };
    } else {
      return {
        x: ((e.clientX - rect.left) / rect.width) * canvas.width,
        y: ((e.clientY - rect.top) / rect.height) * canvas.height
      };
    }
  };

  const startPaintDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = paintCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    saveCanvasState();
    setIsDrawingPaint(true);
    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = paintColor;
    ctx.lineWidth = paintBrushWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const drawPaintStroke = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingPaint) return;
    const canvas = paintCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopPaintDrawing = () => {
    setIsDrawingPaint(false);
  };

  const clearPaintCanvas = () => {
    const canvas = paintCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    saveCanvasState();
    playHapticSound?.(400, 0.15, 'sawtooth');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const savePaintToGallery = () => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const newPhoto: Photo = {
      id: 'paint_' + Date.now(),
      url: dataUrl,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      isUserCaptured: true
    };
    onCapturePhoto?.(newPhoto);
    showToast('Drawing saved to Lumia Camera Roll!');
  };


  // --- SUB-APP 3: TILE CALCULATOR PRO STATE & LOGIC ---
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcMemory, setCalcMemory] = useState<number | null>(null);
  const [calcOp, setCalcOp] = useState<string | null>(null);
  const [calcFormula, setCalcFormula] = useState('');
  const [isNewCalcValue, setIsNewCalcValue] = useState(true);

  const handleCalcPress = (val: string) => {
    playHapticSound?.(800, 0.04, 'triangle');
    
    if (val >= '0' && val <= '9') {
      if (isNewCalcValue || calcDisplay === '0') {
        setCalcDisplay(val);
        setIsNewCalcValue(false);
      } else {
        setCalcDisplay(calcDisplay + val);
      }
      setCalcFormula(prev => prev + val);
    } else if (val === '.') {
      if (isNewCalcValue) {
        setCalcDisplay('0.');
        setIsNewCalcValue(false);
      } else if (!calcDisplay.includes('.')) {
        setCalcDisplay(calcDisplay + '.');
      }
      setCalcFormula(prev => prev + '.');
    } else if (val === 'C') {
      setCalcDisplay('0');
      setCalcMemory(null);
      setCalcOp(null);
      setCalcFormula('');
      setIsNewCalcValue(true);
    } else if (['+', '-', '*', '/'].includes(val)) {
      const current = parseFloat(calcDisplay);
      setCalcMemory(current);
      setCalcOp(val);
      setIsNewCalcValue(true);
      setCalcFormula(calcDisplay + ' ' + val + ' ');
    } else if (val === '=') {
      if (calcMemory !== null && calcOp !== null) {
        const current = parseFloat(calcDisplay);
        let result = 0;
        switch (calcOp) {
          case '+': result = calcMemory + current; break;
          case '-': result = calcMemory - current; break;
          case '*': result = calcMemory * current; break;
          case '/': result = calcMemory / current; break;
        }
        setCalcDisplay(result.toString());
        setCalcFormula(calcFormula + ' = ' + result);
        setCalcMemory(null);
        setCalcOp(null);
        setIsNewCalcValue(true);
      }
    }
  };


  // --- SUB-APP 4: LUMIA VECTOR MAPS STATE & LOGIC ---
  const [mapDestination, setMapDestination] = useState<string | null>(null);
  const [mapIsRouting, setMapIsRouting] = useState(false);
  const [mapProgress, setMapProgress] = useState(0);

  const SEATTLE_DESTINATIONS = [
    { name: 'Nokia/Microsoft Redmond HQ', eta: '12 mins', distance: '5.2 miles', route: 'WA-520 E' },
    { name: 'Seattle Space Needle Observers', eta: '22 mins', distance: '14.8 miles', route: 'I-5 S to WA-520 W' },
    { name: 'Bellevue Square Mall Hub', eta: '8 mins', distance: '3.1 miles', route: 'Bel-Red Rd' },
    { name: 'Woodinville Wine Country Estate', eta: '18 mins', distance: '11.4 miles', route: 'I-405 N' }
  ];

  const triggerMapRoute = (destination: string) => {
    playHapticSound?.(700, 0.1, 'sine');
    setMapDestination(destination);
    setMapIsRouting(true);
    setMapProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setMapProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setMapIsRouting(false);
        showToast('Route calculation complete!');
        playHapticSound?.(900, 0.2, 'triangle');
      }
    }, 200);
  };


  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] text-white p-5 select-none font-sans relative overflow-hidden">
      
      {/* Toast Notification HUD */}
      {toast.visible && (
        <div className="absolute top-4 left-4 right-4 bg-zinc-900 border border-white/20 p-3.5 z-50 flex items-center gap-3 animate-[slideDown_0.2s_ease-out] shadow-2xl">
          <div className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 ${getAccentBg()}`}>
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50 block">System Hub</span>
            <p className="text-xs font-bold text-white truncate">{toast.message}</p>
          </div>
          <button onClick={() => setToast(prev => ({ ...prev, visible: false }))}>
            <X className="w-4 h-4 text-white/40 hover:text-white" />
          </button>
        </div>
      )}

      {/* Device / App Title Banner */}
      <div className="flex items-center justify-between mb-4 mt-1">
        <div>
          <h1 className="font-light text-2xl tracking-tight uppercase text-white flex items-center gap-1.5">
            <Globe className="w-5 h-5 text-cyan-400" />
            <span>Lumia Sandbox</span>
          </h1>
          <p className="text-[9px] text-white/40 tracking-widest font-black uppercase">MULTI-SERVICE WEB CONSOLE</p>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-1.5 border border-white/10 bg-white/5 rounded-none hover:border-white/35 hover:bg-white/10 text-[10px] font-sans flex items-center gap-1.5 active:scale-95 transition-all text-white/80 uppercase font-bold tracking-wider"
        >
          Close App
        </button>
      </div>

      {/* Browser Controls / Universal Web Router Address Bar */}
      <form onSubmit={handleGo} className="flex gap-2 items-center mb-4 text-xs">
        <button 
          type="button"
          onClick={handleBack} 
          disabled={historyIdx === 0}
          className={`p-2 border border-white/10 bg-white/5 rounded-none transition-all duration-150 ${historyIdx === 0 ? 'text-white/20 cursor-not-allowed' : 'text-white hover:bg-white/10 hover:border-white/30'}`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button 
          type="button"
          onClick={handleForward} 
          disabled={historyIdx === history.length - 1}
          className={`p-2 border border-white/10 bg-white/5 rounded-none transition-all duration-150 ${historyIdx === history.length - 1 ? 'text-white/20 cursor-not-allowed' : 'text-white hover:bg-white/10 hover:border-white/30'}`}
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-none focus-within:bg-white/10 focus-within:border-white/20 transition-all duration-200">
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-xs text-white placeholder-white/30 font-sans"
          />
        </div>

        <button type="submit" className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-none text-white/70 hover:text-white transition-all">
          <Search className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Viewport Content Canvas */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-none flex flex-col overflow-y-auto p-4 relative min-h-0 no-scrollbar">
        
        {/* VIEWPORT ROUTE 1: metro://play (Lumina Play App Store) */}
        {url === 'metro://play' && (
          <div className="flex-1 flex flex-col space-y-5 animate-[fadeIn_0.3s_ease-out]">
            {/* Store Hub header */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Lumina Play</span>
              <div className="flex gap-4 border-b border-white/10 overflow-x-auto no-scrollbar pb-1 text-xs">
                <button 
                  onClick={() => { setStoreTab('featured'); playHapticSound?.(750, 0.05); }}
                  className={`pb-2 uppercase font-bold tracking-wider transition-all border-b-2 shrink-0 ${storeTab === 'featured' ? 'border-[#00abec] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                >
                  Featured
                </button>
                <button 
                  onClick={() => { setStoreTab('apps'); playHapticSound?.(750, 0.05); }}
                  className={`pb-2 uppercase font-bold tracking-wider transition-all border-b-2 shrink-0 ${storeTab === 'apps' ? 'border-[#00abec] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                >
                  Apps
                </button>
                <button 
                  onClick={() => { setStoreTab('games'); playHapticSound?.(750, 0.05); }}
                  className={`pb-2 uppercase font-bold tracking-wider transition-all border-b-2 shrink-0 ${storeTab === 'games' ? 'border-[#00abec] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                >
                  Games
                </button>
                <button 
                  onClick={() => { setStoreTab('library'); playHapticSound?.(750, 0.05); }}
                  className={`pb-2 uppercase font-bold tracking-wider transition-all border-b-2 shrink-0 ${storeTab === 'library' ? 'border-[#00abec] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
                >
                  My Device
                </button>
              </div>
            </div>

            {/* Tab view controllers */}
            {storeTab === 'featured' && (
              <div className="space-y-4">
                {/* Hero App banner */}
                <div 
                  onClick={() => navigateTo('metro://play/detail?id=paint')}
                  className="relative h-32 w-full border border-white/10 bg-cover bg-center cursor-pointer group overflow-hidden"
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&auto=format&fit=crop&q=60')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-3 flex flex-col justify-end">
                    <span className="text-[8px] bg-pink-600 text-white w-fit px-1.5 py-0.5 uppercase font-bold tracking-widest mb-1">Featured App</span>
                    <h3 className="font-bold text-sm tracking-tight text-white group-hover:text-pink-400 transition-colors">Metro Paint Studio</h3>
                    <p className="text-[10px] text-white/75 line-clamp-1">Responsive stylus drawing with direct photo library saving.</p>
                  </div>
                </div>

                {/* Sub items grid */}
                <div className="grid grid-cols-2 gap-3">
                  {STORE_APPS.filter(app => app.id !== 'paint').map(app => (
                    <div 
                      key={app.id}
                      onClick={() => navigateTo(`metro://play/detail?id=${app.id}`)}
                      className="p-3 border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer flex flex-col justify-between h-28"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-8 h-8 flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: app.accentColor }}>
                          {app.id === 'calculator' && <Calculator className="w-4 h-4" />}
                          {app.id === 'maps' && <Navigation className="w-4 h-4" />}
                          {app.id === 'retro-games' && <Play className="w-4 h-4" />}
                        </div>
                        <span className="text-[9px] text-white/40 font-bold uppercase">{app.category}</span>
                      </div>
                      <div className="mt-2">
                        <h4 className="text-xs font-bold truncate">{app.name}</h4>
                        <span className="text-[9px] text-lime-400 font-bold">Free</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {storeTab === 'apps' && (
              <div className="space-y-2">
                {STORE_APPS.filter(a => a.category !== 'Games').map(app => (
                  <div 
                    key={app.id} 
                    onClick={() => navigateTo(`metro://play/detail?id=${app.id}`)}
                    className="flex items-center gap-3 p-2.5 border border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer"
                  >
                    <div className="w-9 h-9 flex items-center justify-center font-bold text-white shrink-0" style={{ backgroundColor: app.accentColor }}>
                      {app.id === 'paint' && <Palette className="w-5 h-5" />}
                      {app.id === 'calculator' && <Calculator className="w-5 h-5" />}
                      {app.id === 'maps' && <Navigation className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate">{app.name}</h4>
                      <p className="text-[10px] text-white/50 truncate">by {app.developer}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {storeTab === 'games' && (
              <div className="space-y-2">
                {STORE_APPS.filter(a => a.category === 'Games').map(app => (
                  <div 
                    key={app.id} 
                    onClick={() => navigateTo(`metro://play/detail?id=${app.id}`)}
                    className="flex items-center gap-3 p-2.5 border border-white/5 bg-white/5 hover:bg-white/10 cursor-pointer"
                  >
                    <div className="w-9 h-9 flex items-center justify-center font-bold text-white shrink-0" style={{ backgroundColor: app.accentColor }}>
                      <Play className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold truncate">{app.name}</h4>
                      <p className="text-[10px] text-white/50 truncate">by {app.developer}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {storeTab === 'library' && (
              <div className="space-y-3">
                <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest block">Active Dynamic Tiles</span>
                <div className="space-y-2">
                  {STORE_APPS.map(app => {
                    const isPinned = tiles.find(t => t.id === app.id);
                    return (
                      <div key={app.id} className="p-3 border border-white/5 bg-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 flex items-center justify-center shrink-0 text-white text-xs" style={{ backgroundColor: app.accentColor }}>
                            {app.id === 'paint' && <Palette className="w-4 h-4" />}
                            {app.id === 'calculator' && <Calculator className="w-4 h-4" />}
                            {app.id === 'maps' && <Navigation className="w-4 h-4" />}
                            {app.id === 'retro-games' && <Play className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold truncate">{app.name}</h4>
                            <span className="text-[9px] font-mono text-white/40 uppercase">App ID: {app.id}</span>
                          </div>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          {isPinned ? (
                            <>
                              <button 
                                onClick={() => handleTogglePinState(app.id)}
                                className="p-1.5 bg-zinc-800 text-white/80 hover:text-white border border-white/10"
                                title={isPinned.visible ? "Unpin tile from Start Screen" : "Pin tile to Start Screen"}
                              >
                                {isPinned.visible ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5 text-lime-400" />}
                              </button>
                              <button 
                                onClick={() => handleUninstallApp(app.id)}
                                className="p-1.5 bg-red-950/20 text-red-400 border border-red-900/40 hover:bg-red-950/40"
                                title="Uninstall application"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => handleInstallApp(app)}
                              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-wider"
                            >
                              Install
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEWPORT ROUTE 2: metro://play/detail?id=X (Lumina Play App Details) */}
        {url.startsWith('metro://play/detail') && selectedAppId && (
          (() => {
            const app = STORE_APPS.find(a => a.id === selectedAppId);
            if (!app) return <p className="text-center text-xs py-6">App profile not indexed in this sandbox.</p>;

            const isPinned = tiles.find(t => t.id === app.id);
            const isInstallInProgress = isDownloading[app.id];
            const installPercent = downloadProgress[app.id] || 0;

            return (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                {/* Back to store */}
                <button 
                  onClick={() => navigateTo('metro://play')}
                  className="text-xs font-semibold text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back to Store
                </button>

                {/* Cover profile header block */}
                <div className="flex gap-4">
                  <div className="w-16 h-16 flex items-center justify-center text-white shrink-0" style={{ backgroundColor: app.accentColor }}>
                    {app.id === 'paint' && <Palette className="w-8 h-8" />}
                    {app.id === 'calculator' && <Calculator className="w-8 h-8" />}
                    {app.id === 'maps' && <Navigation className="w-8 h-8" />}
                    {app.id === 'retro-games' && <Play className="w-8 h-8" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold leading-tight">{app.name}</h2>
                    <p className="text-xs text-white/60">{app.developer} • {app.category}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 stroke-yellow-400" />
                      <span className="text-xs font-bold text-yellow-400">{app.rating}</span>
                      <span className="text-[10px] text-white/35">({app.reviewsCount} reviews) • {app.size}</span>
                    </div>
                  </div>
                </div>

                {/* INSTALLATION ACTIONS PANEL */}
                <div className="p-4 border border-white/10 bg-white/5 rounded-none space-y-3">
                  {isInstallInProgress ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/50">
                        <span>Downloading Package...</span>
                        <span>{installPercent}%</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 relative overflow-hidden">
                        <div className="absolute h-full bg-[#00abec]" style={{ width: `${installPercent}%` }} />
                      </div>
                    </div>
                  ) : isPinned ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={() => navigateTo(app.url)}
                        className={`flex-1 py-2 ${getAccentBg()} font-bold text-xs uppercase tracking-wider text-center`}
                      >
                        Launch Application
                      </button>
                      <button 
                        onClick={() => handleTogglePinState(app.id)}
                        className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 font-bold text-xs uppercase tracking-wider"
                      >
                        {isPinned.visible ? 'Unpin From Start' : 'Pin To Start'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleInstallApp(app)}
                      className={`w-full py-2.5 ${getAccentBg()} font-black text-xs uppercase tracking-widest`}
                    >
                      Install / Pin (Free)
                    </button>
                  )}
                </div>

                {/* App Description */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Description</h3>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">{app.description}</p>
                </div>

                {/* Bullet key features */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Features</h3>
                  <ul className="text-xs text-white/70 space-y-1 list-disc pl-4 font-sans">
                    {app.features.map((feat, i) => <li key={i}>{feat}</li>)}
                  </ul>
                </div>

                {/* Screenshots Gallery layout */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Screenshots</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {app.screenshots.map((src, i) => (
                      <img 
                        key={i} 
                        src={src} 
                        alt="Screenshot preview" 
                        className="w-44 h-28 object-cover border border-white/10 shrink-0" 
                        referrerPolicy="no-referrer"
                      />
                    ))}
                  </div>
                </div>

                {/* User Reviews */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/50">Customer Reviews</h3>
                  <div className="space-y-2">
                    {app.reviews.map((r, i) => (
                      <div key={i} className="p-3 border border-white/5 bg-zinc-900/40 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white/90">{r.author}</span>
                          <span className="text-[10px] text-white/40">{r.date}</span>
                        </div>
                        <div className="flex gap-0.5 mb-1.5">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} className={`w-3 h-3 ${idx < r.rating ? 'fill-yellow-400 stroke-yellow-400' : 'text-white/20'}`} />
                          ))}
                        </div>
                        <p className="text-white/70 italic font-sans">"{r.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()
        )}

        {/* VIEWPORT ROUTE 3: metro://paint (Metro Paint Studio Canvas) */}
        {url === 'metro://paint' && (
          <div className="flex-1 flex flex-col justify-between space-y-4 animate-[fadeIn_0.3s_ease-out]">
            <div className="text-center">
              <h2 className="text-sm font-black uppercase tracking-widest text-pink-500">Metro Paint Studio</h2>
              <p className="text-[9px] text-white/40">Canvas stylus drawing panel. Drag/touch to draw.</p>
            </div>

            {/* Drawing Canvas Container */}
            <div className="flex justify-center">
              <canvas
                ref={paintCanvasRef}
                width={360}
                height={260}
                onMouseDown={startPaintDrawing}
                onMouseMove={drawPaintStroke}
                onMouseUp={stopPaintDrawing}
                onMouseLeave={stopPaintDrawing}
                onTouchStart={startPaintDrawing}
                onTouchMove={drawPaintStroke}
                onTouchEnd={stopPaintDrawing}
                className="border border-white/20 bg-white cursor-crosshair max-w-full touch-none shadow-inner"
              />
            </div>

            {/* Canvas controls */}
            <div className="space-y-3 bg-zinc-950 p-3 border border-white/10">
              {/* Stroke Size and Action Row */}
              <div className="flex justify-between items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[9px] font-mono text-white/40 uppercase font-black">Brush Tip</span>
                  <input 
                    type="range" 
                    min={2} 
                    max={20} 
                    value={paintBrushWidth}
                    onChange={e => setPaintBrushWidth(parseInt(e.target.value))}
                    className="flex-1 accent-pink-500 h-1 bg-white/10" 
                  />
                  <span className="text-[10px] font-mono text-white/60 font-bold w-6 text-right">{paintBrushWidth}px</span>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button 
                    onClick={handlePaintUndo} 
                    disabled={paintUndoStack.length === 0}
                    className="p-1.5 bg-zinc-900 border border-white/10 hover:border-white/30 text-white disabled:opacity-30 disabled:hover:border-white/10"
                    title="Undo stroke"
                  >
                    <Undo className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={clearPaintCanvas}
                    className="px-2.5 py-1 bg-red-950/20 text-red-400 border border-red-900/40 hover:bg-red-900/20 text-[10px] font-bold uppercase tracking-wider"
                  >
                    Clear
                  </button>
                  <button 
                    onClick={savePaintToGallery}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                </div>
              </div>

              {/* Color selections row */}
              <div className="flex justify-around items-center pt-2 border-t border-white/5">
                {[
                  { hex: '#d90274', label: 'Magenta' },
                  { hex: '#00abec', label: 'Cyan' },
                  { hex: '#b3d349', label: 'Lime' },
                  { hex: '#f05a28', label: 'Orange' },
                  { hex: '#a252fc', label: 'Violet' },
                  { hex: '#000000', label: 'Coal' }
                ].map(c => (
                  <button
                    key={c.hex}
                    onClick={() => { setPaintColor(c.hex); playHapticSound?.(900, 0.05); }}
                    className={`w-6 h-6 border transition-all ${paintColor === c.hex ? 'border-white scale-110 ring-2 ring-pink-500/30' : 'border-white/10 hover:border-white/30'}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEWPORT ROUTE 4: metro://calculator (Tile Calculator Pro) */}
        {url === 'metro://calculator' && (
          <div className="flex-1 flex flex-col justify-between bg-zinc-950 p-4 border border-white/10 animate-[fadeIn_0.3s_ease-out]">
            {/* Display banner block */}
            <div className="text-right p-3 border border-white/10 bg-black/40 font-mono mb-3 space-y-1">
              <div className="text-[10px] text-white/30 truncate h-4 tracking-wider">{calcFormula || '0'}</div>
              <div className="text-2xl font-bold tracking-tight text-white truncate">{calcDisplay}</div>
            </div>

            {/* Grid touch buttons */}
            <div className="grid grid-cols-4 gap-2 flex-1 text-sm font-bold font-mono">
              {['C', '(', ')', '/'].map(btn => (
                <button 
                  key={btn} 
                  onClick={() => handleCalcPress(btn)}
                  className="p-3 bg-zinc-900 border border-white/5 text-pink-500 active:scale-95 transition-transform"
                >
                  {btn}
                </button>
              ))}

              {['7', '8', '9', '*'].map(btn => (
                <button 
                  key={btn} 
                  onClick={() => handleCalcPress(btn)}
                  className={`p-3 border border-white/5 active:scale-95 transition-transform ${btn === '*' ? 'bg-zinc-900 text-pink-500' : 'bg-zinc-950 text-white'}`}
                >
                  {btn}
                </button>
              ))}

              {['4', '5', '6', '-'].map(btn => (
                <button 
                  key={btn} 
                  onClick={() => handleCalcPress(btn)}
                  className={`p-3 border border-white/5 active:scale-95 transition-transform ${btn === '-' ? 'bg-zinc-900 text-pink-500' : 'bg-zinc-950 text-white'}`}
                >
                  {btn}
                </button>
              ))}

              {['1', '2', '3', '+'].map(btn => (
                <button 
                  key={btn} 
                  onClick={() => handleCalcPress(btn)}
                  className={`p-3 border border-white/5 active:scale-95 transition-transform ${btn === '+' ? 'bg-zinc-900 text-pink-500' : 'bg-zinc-950 text-white'}`}
                >
                  {btn}
                </button>
              ))}

              {['0', '.', '=', ''].map((btn, idx) => {
                if (btn === '') return <div key={idx} />;
                return (
                  <button 
                    key={btn} 
                    onClick={() => handleCalcPress(btn)}
                    className={`p-3 border active:scale-95 transition-transform ${btn === '=' ? 'bg-lime-500 text-black border-lime-600' : 'bg-zinc-950 text-white border-white/5'}`}
                  >
                    {btn}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEWPORT ROUTE 5: metro://maps (Lumia Vector Maps Navigation) */}
        {url === 'metro://maps' && (
          <div className="flex-1 flex flex-col justify-between space-y-4 animate-[fadeIn_0.3s_ease-out]">
            <div className="text-center">
              <h2 className="text-sm font-black uppercase tracking-widest text-cyan-400">Lumia Vector Maps</h2>
              <p className="text-[9px] text-white/40 font-mono">SEATTLE-REDMOND BLUEPRINT VECTOR RADAR</p>
            </div>

            {/* Vector wireframe Map UI */}
            <div className="relative h-44 w-full bg-[#030708] border-2 border-cyan-900/30 overflow-hidden flex items-center justify-center font-mono">
              {/* Holographic glowing grids */}
              <div className="absolute inset-0 opacity-15" style={{ 
                backgroundImage: `radial-gradient(circle, #00abec 1px, transparent 1px)`, 
                backgroundSize: '20px 20px' 
              }} />

              {/* Fake coordinate lines */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px border-l border-dashed border-cyan-500/10" />
              <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-cyan-500/10" />

              {/* Map Nodes and Routes drawing */}
              <svg className="absolute inset-0 w-full h-full text-cyan-400">
                {/* Node Redmond */}
                <circle cx="80%" cy="40%" r="5" className="fill-cyan-500 animate-pulse" />
                <text x="80%" y="30%" className="text-[8px] fill-cyan-400/80 font-bold" textAnchor="middle">REDMOND</text>
                
                {/* Node Seattle */}
                <circle cx="20%" cy="70%" r="5" className="fill-cyan-500 animate-pulse" />
                <text x="20%" y="85%" className="text-[8px] fill-cyan-400/80 font-bold" textAnchor="middle">SEATTLE</text>

                {/* Node Bellevue */}
                <circle cx="60%" cy="60%" r="4" className="fill-cyan-500" />
                <text x="60%" y="50%" className="text-[8px] fill-cyan-400/60" textAnchor="middle">BELLEVUE</text>

                {/* Node Current Location */}
                <circle cx="50%" cy="50%" r="6" className="fill-rose-500 animate-ping" />
                <circle cx="50%" cy="50%" r="4" className="fill-rose-500" />
                <text x="50%" y="42%" className="text-[7px] fill-rose-400 font-bold" textAnchor="middle">YOU</text>

                {/* Animated calculating neon routing overlay */}
                {mapDestination && (
                  <>
                    <path 
                      d="M 150 110 Q 180 100, 240 88" 
                      fill="none" 
                      stroke="#f05a28" 
                      strokeWidth="2.5" 
                      strokeDasharray={mapIsRouting ? "10 10" : "none"}
                      className={mapIsRouting ? "animate-[dash_1s_linear_infinite]" : ""}
                    />
                    <circle cx="240" cy="88" r="4.5" className="fill-rose-500 animate-pulse" />
                  </>
                )}
              </svg>

              {/* Computing telemetry banner overlay */}
              {mapIsRouting && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 p-4 text-center">
                  <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent animate-spin rounded-full" />
                  <span className="text-[9px] uppercase font-black tracking-widest text-cyan-400">Calculating GPS Route...</span>
                  <div className="w-32 h-1 bg-white/10 relative overflow-hidden">
                    <div className="absolute h-full bg-cyan-400" style={{ width: `${mapProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Navigation Directions HUD */}
              {mapDestination && !mapIsRouting && (
                <div className="absolute bottom-2 left-2 bg-black/75 border border-cyan-500/20 p-2 text-[9px] text-white">
                  <span className="text-rose-400 font-bold uppercase">Active Target:</span>
                  <p className="font-bold text-white/90 truncate max-w-[150px]">{mapDestination}</p>
                  <p className="text-[8px] text-cyan-300 mt-0.5">ETA: 12 mins • WA-520 E Highway</p>
                </div>
              )}
            </div>

            {/* List of locations */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 no-scrollbar text-xs">
              <span className="text-[8px] font-black uppercase text-white/40 tracking-widest block font-mono">Hotspots Map Index</span>
              {SEATTLE_DESTINATIONS.map((dest, i) => (
                <button
                  key={i}
                  onClick={() => triggerMapRoute(dest.name)}
                  className="w-full p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/20 flex items-center justify-between text-left"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{dest.name}</p>
                    <span className="text-[9px] text-white/40">via {dest.route}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-cyan-400 block text-[10px]">{dest.eta}</span>
                    <span className="text-[8px] text-white/30">{dest.distance}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIEWPORT ROUTE 6: metro://news (Metro News Daily) */}
        {url === 'metro://news' && (
          <div className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
            <div className="border-b border-white/10 pb-3 flex justify-between items-end">
              <h2 className="text-base font-bold tracking-tight text-cyan-400 uppercase font-sans">Metro News Daily</h2>
              <span className="text-[9px] font-sans text-white/40">Vol. 12 • No. 4</span>
            </div>

            {/* Main story */}
            <div className="p-4 border border-white/10 bg-white/5 rounded-none space-y-2">
              <span className="text-[9px] bg-pink-600 text-white px-2 py-0.5 rounded-none font-semibold tracking-wider">HEADLINE</span>
              <h3 className="text-base font-semibold leading-snug">Antigravity OS Suite Goes Viral</h3>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                Antigravity has unveiled the Lumina Metro OS replica featuring high-fidelity live tiles, reactive widgets, and synthesized sounds. Users praise the complete content-first philosophy, geometric sharp borders, and responsive phone device shell.
              </p>
              <button 
                onClick={() => navigateTo('metro://retro-games')}
                className="mt-2 text-xs font-semibold font-sans text-cyan-400 hover:underline inline-flex items-center gap-1"
              >
                Launch Retro Games Hub <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Stories grid */}
            <div className="grid grid-cols-2 gap-3 font-sans text-xs text-white/70">
              <div className="p-3.5 border border-white/10 bg-white/5 rounded-none space-y-1">
                <span className="text-[8px] text-lime-400 font-bold uppercase tracking-wider">Hardware</span>
                <h4 className="text-white font-semibold text-xs truncate">Classic Tiles Return</h4>
                <p className="text-[10px] text-white/50 leading-relaxed">Horizontal layout sweeps modern screens.</p>
              </div>
              <div className="p-3.5 border border-white/10 bg-white/5 rounded-none space-y-1">
                <span className="text-[8px] text-purple-400 font-bold uppercase tracking-wider">Browser</span>
                <h4 className="text-white font-semibold text-xs truncate">Web Audio Synth</h4>
                <p className="text-[10px] text-white/50 leading-relaxed">Synthesize actual play loops on-the-fly.</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEWPORT ROUTE 7: metro://retro-games (Classic Snake Game) */}
        {url === 'metro://retro-games' && (
          <div className="flex-1 flex flex-col justify-between animate-[fadeIn_0.25s_ease-out]">
            <div className="text-center">
              <h2 className="text-base font-bold tracking-tight text-pink-500 uppercase">Retro Arcade Hub</h2>
              <p className="text-[10px] text-white/40 mt-1 font-sans">Playable Snake Game Widget</p>
            </div>

            {/* Game Canvas Container */}
            <div className="flex justify-center my-4">
              <canvas
                ref={snakeCanvasRef}
                width={200}
                height={200}
                className="border-2 border-white/10 rounded-none overflow-hidden"
              />
            </div>

            {/* Game Stats & Actions */}
            <div className="flex justify-around text-center text-xs">
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">SCORE</p>
                <p className="text-lg font-bold text-cyan-400">{score}</p>
              </div>
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">HIGH SCORE</p>
                <p className="text-lg font-bold text-pink-500">{highScore}</p>
              </div>
            </div>

            {/* Mobile Controls / Gamepad */}
            <div className="mt-4 flex flex-col items-center">
              {!gameActive ? (
                <button
                  onClick={() => {
                    setSnake([{ x: 10, y: 10 }]);
                    setScore(0);
                    setDir('RIGHT');
                    setGameActive(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-tr from-pink-500 to-rose-400 hover:opacity-90 font-bold text-xs uppercase tracking-widest rounded-none shadow-lg active:scale-95 transition-all flex items-center gap-2 text-white"
                >
                  <Play className="w-4 h-4 fill-current" />
                  START GAME
                </button>
              ) : (
                /* Virtual D-Pad controller */
                <div className="grid grid-cols-3 gap-1 w-32 font-sans font-bold text-sm">
                  <div />
                  <button 
                    onClick={() => dir !== 'DOWN' && setDir('UP')}
                    className="p-2 border border-white/10 bg-white/5 active:bg-white/15 transition-all hover:border-white/20 text-center"
                  >
                    ▲
                  </button>
                  <div />
                  
                  <button 
                    onClick={() => dir !== 'RIGHT' && setDir('LEFT')}
                    className="p-2 border border-white/10 bg-white/5 active:bg-white/15 transition-all hover:border-white/20 text-center"
                  >
                    ◀
                  </button>
                  <div className="flex items-center justify-center text-[9px] text-white/30">PAD</div>
                  <button 
                    onClick={() => dir !== 'LEFT' && setDir('RIGHT')}
                    className="p-2 border border-white/10 bg-white/5 active:bg-white/15 transition-all hover:border-white/20 text-center"
                  >
                    ▶
                  </button>

                  <div />
                  <button 
                    onClick={() => dir !== 'UP' && setDir('DOWN')}
                    className="p-2 border border-white/10 bg-white/5 active:bg-white/15 transition-all hover:border-white/20 text-center"
                  >
                    ▼
                  </button>
                  <div />
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEWPORT ROUTE 8: metro://search (Generic search matches) */}
        {url.startsWith('metro://search') && (
          <div className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
            <div className="border-b border-white/10 pb-3">
              <h2 className="text-[10px] text-white/40 uppercase tracking-wider font-sans">Search Results for:</h2>
              <p className="text-base font-bold text-cyan-400 mt-0.5">
                "{decodeURIComponent(url.split('q=')[1] || '')}"
              </p>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div className="p-3.5 border border-white/10 bg-white/5 rounded-none space-y-1">
                <a href="#" onClick={() => navigateTo('metro://news')} className="text-cyan-400 font-semibold hover:underline">
                  1. Metro News Daily - Live Launcher Updates
                </a>
                <p className="text-[10px] text-white/50 leading-relaxed">Active simulated web portal detailing client-side SPA replica.</p>
              </div>
              <div className="p-3.5 border border-white/10 bg-white/5 rounded-none space-y-1">
                <a href="#" onClick={() => navigateTo('metro://retro-games')} className="text-cyan-400 font-semibold hover:underline">
                  2. Playable Snake Arcade Sandbox
                </a>
                <p className="text-[10px] text-white/50 leading-relaxed">Retro vector-line mobile Snake game playable with virtual gamepad.</p>
              </div>
              <div className="p-3.5 border border-white/10 bg-white/5 rounded-none text-white/40 text-center py-6">
                No further external matching servers indexed in local emulator sandbox.
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
