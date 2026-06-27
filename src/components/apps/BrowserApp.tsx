import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, ArrowLeft, ArrowRight, RotateCw, Play, Volume2 } from 'lucide-react';

interface BrowserAppProps {
  onClose: () => void;
  accentClass: string;
}

export default function BrowserApp({ onClose, accentClass }: BrowserAppProps) {
  const [url, setUrl] = useState('metro://news');
  const [inputUrl, setInputUrl] = useState('metro://news');
  const [history, setHistory] = useState<string[]>(['metro://news']);
  const [historyIdx, setHistoryIdx] = useState(0);

  // Snake game states
  const [snake, setSnake] = useState<{ x: number; y: number }[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<{ x: number; y: number }>({ x: 5, y: 5 });
  const [dir, setDir] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('RIGHT');
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const snakeCanvasRef = useRef<HTMLCanvasElement>(null);

  const navigateTo = (newUrl: string) => {
    const nextHistory = history.slice(0, historyIdx + 1);
    nextHistory.push(newUrl);
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1);
    setUrl(newUrl);
    setInputUrl(newUrl);
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      setHistoryIdx(prev => prev - 1);
      setUrl(history[historyIdx - 1]);
      setInputUrl(history[historyIdx - 1]);
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx(prev => prev + 1);
      setUrl(history[historyIdx + 1]);
      setInputUrl(history[historyIdx + 1]);
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

  // Playable Snake Game logic
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
          alert('GAME OVER! Score: ' + score);
          return [{ x: 10, y: 10 }];
        }

        // Self collision
        for (const seg of prev) {
          if (seg.x === head.x && seg.y === head.y) {
            setGameActive(false);
            alert('GAME OVER! Score: ' + score);
            return [{ x: 10, y: 10 }];
          }
        }

        const nextSnake = [head, ...prev];

        // Eat food
        if (head.x === food.x && head.y === food.y) {
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
    ctx.strokeStyle = '#1e292b';
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

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] text-white p-6 select-none font-sans relative overflow-hidden">
      {/* App Header */}
      <div className="flex items-center justify-between mb-6 mt-1">
        <div>
          <h1 className="font-light text-2xl tracking-tight uppercase text-white">Browser Alpha</h1>
          <p className="text-[10px] text-white/40 tracking-wider">SECURE SANDBOX WEB</p>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-1.5 border border-white/10 bg-white/5 rounded-none hover:border-white/35 hover:bg-white/10 text-[10px] font-sans flex items-center gap-1 active:scale-95 transition-all text-white/80"
        >
          Back
        </button>
      </div>

      {/* Browser Controls / Address Bar */}
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
        
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 px-3.5 py-2 rounded-none focus-within:bg-white/10 focus-within:border-white/20 transition-all duration-200">
          <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            className="flex-1 bg-transparent border-none focus:outline-none text-xs text-white placeholder-white/30 font-sans"
          />
        </div>

        <button type="submit" className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-none text-white/70 hover:text-white transition-all">
          <Search className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Viewport Content */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-none flex flex-col overflow-y-auto p-4.5 relative min-h-0 no-scrollbar">
        
        {/* VIEWPORT 1: metro://news */}
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
              <p className="text-xs text-white/70 leading-relaxed">
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

        {/* VIEWPORT 2: metro://retro-games */}
        {url === 'metro://retro-games' && (
          <div className="flex-1 flex flex-col justify-between animate-[fadeIn_0.25s_ease-out]">
            <div className="text-center">
              <h2 className="text-base font-bold tracking-tight text-pink-500 uppercase">Retro Arcade Hub</h2>
              <p className="text-[10px] text-white/40 mt-1">Playable Snake Game Widget</p>
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
                  className="px-6 py-3 bg-gradient-to-tr from-pink-500 to-rose-400 hover:opacity-90 font-bold text-xs uppercase tracking-widest rounded-full shadow-lg active:scale-95 transition-all flex items-center gap-2 text-white"
                >
                  <Play className="w-4 h-4 fill-current" />
                  START GAME
                </button>
              ) : (
                /* Virtual D-Pad controller */
                <div className="grid grid-cols-3 gap-1.5 w-32 max-w-xs font-sans font-bold text-sm">
                  <div />
                  <button 
                    onClick={() => dir !== 'DOWN' && setDir('UP')}
                    className="p-3 border border-white/10 bg-white/5 rounded-xl active:bg-white/15 transition-all hover:border-white/20 text-center"
                  >
                    ▲
                  </button>
                  <div />
                  
                  <button 
                    onClick={() => dir !== 'RIGHT' && setDir('LEFT')}
                    className="p-3 border border-white/10 bg-white/5 rounded-xl active:bg-white/15 transition-all hover:border-white/20 text-center"
                  >
                    ◀
                  </button>
                  <div className="flex items-center justify-center text-[10px] text-white/30">PAD</div>
                  <button 
                    onClick={() => dir !== 'LEFT' && setDir('RIGHT')}
                    className="p-3 border border-white/10 bg-white/5 rounded-none active:bg-white/15 transition-all hover:border-white/20 text-center"
                  >
                    ▶
                  </button>

                  <div />
                  <button 
                    onClick={() => dir !== 'UP' && setDir('DOWN')}
                    className="p-3 border border-white/10 bg-white/5 rounded-none active:bg-white/15 transition-all hover:border-white/20 text-center"
                  >
                    ▼
                  </button>
                  <div />
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEWPORT 3: metro://search */}
        {url.startsWith('metro://search') && (
          <div className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
            <div className="border-b border-white/10 pb-3">
              <h2 className="text-[10px] text-white/40 uppercase tracking-wider font-sans">Search Results for:</h2>
              <p className="text-base font-bold text-cyan-400 mt-0.5">
                "{decodeURIComponent(url.split('q=')[1] || '')}"
              </p>
            </div>

            <div className="space-y-4 text-xs">
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

// Icon helper since lucide doesn't have ChevronRight directly in local scope
function ChevronRight(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
