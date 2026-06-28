import React, { useState, useEffect } from 'react';
import { 
  Phone, MessageSquare, Users, Music, Calendar, Sun, Mail, ShoppingBag, 
  Settings, Play, Pause, X, ChevronLeft, ChevronRight, Maximize2, Plus, Check, Pin, PinOff
} from 'lucide-react';
import { Song, SystemSettings, CalendarEvent, TileConfig } from '../types';

interface LiveTilesProps {
  settings: SystemSettings;
  unreadMsgs: number;
  lastMessageText: string;
  unreadMails: number;
  events: CalendarEvent[];
  capturedPhotos: string[];
  activeSong: Song | null;
  isPlaying: boolean;
  onLaunchApp: (appId: string) => void;
  onTogglePlaySpotify: (e: React.MouseEvent) => void;
  tiles: TileConfig[];
  onUpdateTiles: (tiles: TileConfig[]) => void;
  isEditMode: boolean;
  onSetEditMode: (val: boolean) => void;
  playHapticSound?: (freq?: number, dur?: number, type?: OscillatorType) => void;
}

export default function LiveTiles({
  settings,
  unreadMsgs,
  lastMessageText,
  unreadMails,
  events,
  capturedPhotos,
  activeSong,
  isPlaying,
  onLaunchApp,
  onTogglePlaySpotify,
  tiles,
  onUpdateTiles,
  isEditMode,
  onSetEditMode,
  playHapticSound
}: LiveTilesProps) {
  
  // Local state for interactive click tilt transforms
  const [tiltStyles, setTiltStyles] = useState<Record<string, string>>({});

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
    if (isEditMode) return; // Disable tile click-tilt during layout customization
    const tile = e.currentTarget;
    const rect = tile.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 8;
    const rotateY = (centerX - x) / 8;

    setTiltStyles(prev => ({
      ...prev,
      [id]: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(0.96)`
    }));
  };

  const handleMouseUpOrLeave = (id: string) => {
    setTiltStyles(prev => ({
      ...prev,
      [id]: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)'
    }));
  };

  const getTiltStyle = (id: string): React.CSSProperties => {
    return {
      transform: tiltStyles[id] || 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'transform 0.15s cubic-bezier(0.1, 0.9, 0.2, 1)'
    };
  };

  // Determine current day of week and date
  const now = new Date();
  const todayNum = now.getDate();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short' });

  // Dynamically cycle photo tile backgrounds
  const [photoIdx, setPhotoIdx] = useState(0);
  const photoRoll = capturedPhotos.length > 0 ? capturedPhotos : [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAldsSQd_GRUzHv9Yd0Ue_zr794--dXU-mlaMl1gbn6wL7ABFUafjy2feaefNxIz0JJx6FQnc6D4QhNi9L9qbeY60EuUhEycdfDhxG_h3M3bRFmrR5_447A3tB5IG07vAOlX85tuakcJnM6nwdH1sm8hrFzFwXoGzUYdfs9evLu_1vEapqalRmmI4Tp0RK3glNrMRopgiUgY_USvtlb5bEC_s54aM1ua5sYpbQ_7h8C2s4MgHZfWANzC8jIEQw6zK6leqhxen93QuvD'
  ];

  useEffect(() => {
    if (photoRoll.length <= 1) return;
    const interval = setInterval(() => {
      setPhotoIdx(prev => (prev + 1) % photoRoll.length);
    }, 5000); // cycle photos every 5 seconds
    return () => clearInterval(interval);
  }, [photoRoll]);

  // Accent mapping class
  const getAccentBg = () => {
    if (settings.accentColor === 'cyan') return 'bg-[#00abec] text-white';
    if (settings.accentColor === 'magenta') return 'bg-[#d90274] text-white';
    if (settings.accentColor === 'lime') return 'bg-[#b3d349] text-black';
    if (settings.accentColor === 'orange') return 'bg-[#f05a28] text-white';
    return 'bg-[#a252fc] text-white';
  };

  const getAccentBorder = () => {
    if (settings.accentColor === 'cyan') return 'border-[#00abec]';
    if (settings.accentColor === 'magenta') return 'border-[#d90274]';
    if (settings.accentColor === 'lime') return 'border-[#b3d349]';
    if (settings.accentColor === 'orange') return 'border-[#f05a28]';
    return 'border-[#a252fc]';
  };

  const getAccentText = () => {
    if (settings.accentColor === 'cyan') return 'text-[#00abec]';
    if (settings.accentColor === 'magenta') return 'text-[#d90274]';
    if (settings.accentColor === 'lime') return 'text-[#b3d349]';
    if (settings.accentColor === 'orange') return 'text-[#f05a28]';
    return 'text-[#a252fc]';
  };

  // --- Dynamic Tile Handlers ---
  const handleCycleSize = (tileId: string) => {
    const updated = tiles.map(t => {
      if (t.id === tileId) {
        let nextSize: 'small' | 'medium' | 'wide' = 'medium';
        if (t.size === 'small') nextSize = 'medium';
        else if (t.size === 'medium') nextSize = 'wide';
        else if (t.size === 'wide') nextSize = 'small';
        return { ...t, size: nextSize };
      }
      return t;
    });
    onUpdateTiles(updated);
    playHapticSound?.(750, 0.08, 'triangle');
  };

  const handleMoveTile = (index: number, direction: 'prev' | 'next') => {
    const visibleTiles = tiles.filter(t => t.visible);
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < visibleTiles.length) {
      // Find the index of these tiles in the main array
      const currentTile = visibleTiles[index];
      const swappedTile = visibleTiles[targetIndex];

      const mainCurrentIdx = tiles.findIndex(t => t.id === currentTile.id);
      const mainSwappedIdx = tiles.findIndex(t => t.id === swappedTile.id);

      if (mainCurrentIdx !== -1 && mainSwappedIdx !== -1) {
        const updated = [...tiles];
        // Swap orders
        const tempOrder = updated[mainCurrentIdx].order;
        updated[mainCurrentIdx].order = updated[mainSwappedIdx].order;
        updated[mainSwappedIdx].order = tempOrder;

        // Re-sort main array
        updated.sort((a, b) => a.order - b.order);
        // Normalize orders
        updated.forEach((t, i) => t.order = i + 1);

        onUpdateTiles(updated);
        playHapticSound?.(600, 0.05);
      }
    }
  };

  const handleUnpinTile = (tileId: string) => {
    const updated = tiles.map(t => {
      if (t.id === tileId) {
        return { ...t, visible: false };
      }
      return t;
    });
    onUpdateTiles(updated);
    playHapticSound?.(450, 0.1, 'sawtooth');
  };

  const handlePinTile = (tileId: string) => {
    const updated = tiles.map(t => {
      if (t.id === tileId) {
        return { ...t, visible: true };
      }
      return t;
    });
    onUpdateTiles(updated);
    playHapticSound?.(650, 0.1, 'sine');
  };

  const handleResetLayout = () => {
    // Reset to default
    const defaults: TileConfig[] = [
      { id: 'phone', name: 'Phone', appId: 'phone', size: 'medium', order: 1, visible: true },
      { id: 'messages', name: 'Messaging', appId: 'messages', size: 'medium', order: 2, visible: true },
      { id: 'people', name: 'People', appId: 'phone', size: 'wide', order: 3, visible: true },
      { id: 'photos', name: 'Photos', appId: 'photos', size: 'wide', order: 4, visible: true },
      { id: 'spotify', name: 'Spotify', appId: 'spotify', size: 'medium', order: 5, visible: true },
      { id: 'calendar', name: 'Calendar', appId: 'calendar', size: 'small', order: 6, visible: true },
      { id: 'weather', name: 'Weather', appId: 'weather', size: 'small', order: 7, visible: true },
      { id: 'outlook', name: 'Outlook', appId: 'outlook', size: 'medium', order: 8, visible: true },
      { id: 'browser', name: 'Store', appId: 'browser', size: 'small', order: 9, visible: true },
      { id: 'settings', name: 'Settings', appId: 'settings', size: 'small', order: 10, visible: true }
    ];
    onUpdateTiles(defaults);
    playHapticSound?.(300, 0.2, 'sine');
  };

  // Get visible tiles sorted by order
  const visibleTiles = tiles.filter(t => t.visible).sort((a, b) => a.order - b.order);
  const hiddenTiles = tiles.filter(t => !t.visible);

  return (
    <div className="px-5 space-y-6 max-w-screen-md mx-auto py-2 animate-[fadeIn_0.4s_ease-out]">
      
      {/* Dynamic Edit Mode Header Bar */}
      {isEditMode && (
        <div className="bg-zinc-900 border border-white/10 p-4 mb-2 flex flex-col sm:flex-row items-center justify-between gap-3 animate-[slideDown_0.2s_ease-out]">
          <div className="text-center sm:text-left">
            <h3 className={`text-xs font-black uppercase tracking-widest ${getAccentText()}`}>Tile Customizer Mode</h3>
            <p className="text-[10px] text-white/50">Long press tiles or tap controls to resize (1x1, 2x2, 4x2) and reorder.</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleResetLayout}
              className="flex-1 sm:flex-none px-3 py-1.5 border border-red-900/40 bg-red-950/20 text-red-400 text-[10px] uppercase font-mono font-bold tracking-wider hover:bg-red-900/20"
            >
              Reset Layout
            </button>
            <button
              onClick={() => {
                onSetEditMode(false);
                playHapticSound?.(800, 0.1);
              }}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase flex items-center justify-center gap-1.5 ${getAccentBg()}`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid Canvas */}
      <div className="flex gap-3 flex-wrap justify-start select-none">
        {visibleTiles.map((tile, idx) => {
          // Dynamic dimensions based on Windows Phone specifications
          let sizeClass = '';
          if (tile.size === 'small') {
            sizeClass = 'w-[calc(25%-9px)] aspect-square';
          } else if (tile.size === 'medium') {
            sizeClass = 'w-[calc(50%-6px)] aspect-square';
          } else if (tile.size === 'wide') {
            sizeClass = 'w-full h-28 sm:h-36 aspect-[2/1] sm:aspect-auto';
          }

          // Dynamic tile content dispatcher
          const renderTileContent = () => {
            switch (tile.id) {
              case 'phone':
                if (tile.size === 'small') {
                  return (
                    <div className="h-full w-full flex items-center justify-center">
                      <Phone className="w-6 h-6 fill-current" />
                    </div>
                  );
                } else if (tile.size === 'medium') {
                  return (
                    <div className="h-full w-full flex flex-col justify-between p-4">
                      <div className="flex justify-end">
                        <Phone className="w-7 h-7 fill-current" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider">Phone</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="h-full w-full flex items-center justify-between p-4.5">
                      <div className="flex items-center gap-3">
                        <Phone className="w-9 h-9 fill-current text-white" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold uppercase tracking-wider">Phone Dialer</span>
                          <span className="text-[10px] text-white/70">Nokia Pure Dialer Network</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col text-right">
                        <span className="text-[9px] font-mono text-white/40 uppercase">Line Status</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">● Live Carrier</span>
                      </div>
                    </div>
                  );
                }

              case 'messages':
                if (tile.size === 'small') {
                  return (
                    <div className="h-full w-full flex items-center justify-center relative">
                      <MessageSquare className="w-6 h-6 fill-current" />
                      {unreadMsgs > 0 && (
                        <span className="absolute top-1 right-1 bg-white text-black font-black text-[9px] w-4.5 h-4.5 flex items-center justify-center font-mono rounded-none">
                          {unreadMsgs}
                        </span>
                      )}
                    </div>
                  );
                } else if (tile.size === 'medium') {
                  return (
                    <div className="h-full w-full flex flex-col justify-between p-4 relative">
                      <div className="flex justify-end relative">
                        <MessageSquare className="w-7 h-7 fill-current" />
                        {unreadMsgs > 0 && (
                          <span className="absolute -top-1 -right-1 bg-white text-black font-black text-xs w-5 h-5 flex items-center justify-center font-mono">
                            {unreadMsgs}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] leading-snug mb-1 truncate opacity-90 font-sans">
                          {lastMessageText || 'No unread messages.'}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider">Messaging</span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="h-full w-full flex flex-col justify-between p-4 relative">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Inbox Hub</span>
                        <MessageSquare className="w-5 h-5 fill-current" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white mb-0.5">
                          {unreadMsgs > 0 ? `Sarah Connor (+${unreadMsgs} unread)` : 'Sarah Connor'}
                        </span>
                        <p className="text-[11px] text-white/80 line-clamp-1 mb-1 font-sans">
                          {lastMessageText || 'Tap to compose new SMS chat.'}
                        </p>
                        <span className="text-[11px] font-bold uppercase tracking-wider">Lumia Messages</span>
                      </div>
                    </div>
                  );
                }

              case 'people':
                if (tile.size === 'small') {
                  return (
                    <div className="h-full w-full flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                  );
                } else if (tile.size === 'medium') {
                  return (
                    <div className="h-full w-full p-0.5 relative">
                      <div className="grid grid-cols-2 grid-rows-2 h-full w-full gap-0.5">
                        <div className="bg-cover bg-center rounded-none" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDa_Uwu6E9qnuv5U4G8oaZtm7afrOZW2d7-xBXoPPAP6CYGRrmTbsRgw7IuUuzD8HWknR-ejU7k_P0VpHb2qDDwBohnLH3y_naAkiaYUKZYX_8PNFBTucrVOWcSvF0EIa3iRLPzfnltMCZSM8CrD6KYiEAPKUFETddbFRVQie-bfMg5cbomRBr9ifQk0PtS8e_TXQJkvQJd9P-DTPiqHxM1V-3wjvSJ5E4iPKdIuMsHVutrNcBdoBdT9ucrbYixgdzHmAN9MsbcLHfi')` }} />
                        <div className="bg-cover bg-center rounded-none" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCMSUaquRpNzsTYxjIrrNuekIEeRWkpoNkk5hro9CiDd9wL3bcOreGRgNqWwXyGO8SvEFF6tKCV5hRhu3zhNBFTxYebxher_Y50X24MMHLiGsAkBgKGEJZcj6KS58a1rvBV9C5ymOi-aananGNq9CP4u9djn3naU_hCSfg9cMkjsCUbC-fUlMMU-Q809EpEajFGOCHCcCfmLk6SM6JpHB6Oumyvy-sLiLvsXxMxdkDspy7L2a4mVag65DVwYdrX80BoJ4o60D7B83NM')` }} />
                        <div className="bg-cover bg-center rounded-none" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB_wsfYalMRh8t4yUNGHppMspsovCu6we98duiWNJ3aGAbeT6piQMjPTnzSjgBkYRCufyHAlRvzWjdvvxtnyXHp6s0LT-sUsdWPC84lq5jqKCTfJ3teEWjzurVUY8XXPatYCOLuKhz0uM4WWVoe03uXZlJ6dDKO15Pl1UKzg2eqG6W1cTggFoJRJ6jTT0SJHdUz2Lgvq0H9uMrHFmFx78CJ3MeQSsenNIqUBHj_VaZIEKqaX4rCMzrc9KJ5zRXGUkO7GKzp7BXPtRxu')` }} />
                        <div className="flex items-center justify-center bg-black/10">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black/50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        People
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="h-full w-full p-0.5 relative">
                      <div className="grid grid-cols-4 grid-rows-2 h-full w-full gap-0.5">
                        <div className="bg-cover bg-center rounded-none" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDa_Uwu6E9qnuv5U4G8oaZtm7afrOZW2d7-xBXoPPAP6CYGRrmTbsRgw7IuUuzD8HWknR-ejU7k_P0VpHb2qDDwBohnLH3y_naAkiaYUKZYX_8PNFBTucrVOWcSvF0EIa3iRLPzfnltMCZSM8CrD6KYiEAPKUFETddbFRVQie-bfMg5cbomRBr9ifQk0PtS8e_TXQJkvQJd9P-DTPiqHxM1V-3wjvSJ5E4iPKdIuMsHVutrNcBdoBdT9ucrbYixgdzHmAN9MsbcLHfi')` }} />
                        <div className="bg-cover bg-center rounded-none" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCMSUaquRpNzsTYxjIrrNuekIEeRWkpoNkk5hro9CiDd9wL3bcOreGRgNqWwXyGO8SvEFF6tKCV5hRhu3zhNBFTxYebxher_Y50X24MMHLiGsAkBgKGEJZcj6KS58a1rvBV9C5ymOi-aananGNq9CP4u9djn3naU_hCSfg9cMkjsCUbC-fUlMMU-Q809EpEajFGOCHCcCfmLk6SM6JpHB6Oumyvy-sLiLvsXxMxdkDspy7L2a4mVag65DVwYdrX80BoJ4o60D7B83NM')` }} />
                        <div className="bg-cover bg-center rounded-none" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB_wsfYalMRh8t4yUNGHppMspsovCu6we98duiWNJ3aGAbeT6piQMjPTnzSjgBkYRCufyHAlRvzWjdvvxtnyXHp6s0LT-sUsdWPC84lq5jqKCTfJ3teEWjzurVUY8XXPatYCOLuKhz0uM4WWVoe03uXZlJ6dDKO15Pl1UKzg2eqG6W1cTggFoJRJ6jTT0SJHdUz2Lgvq0H9uMrHFmFx78CJ3MeQSsenNIqUBHj_VaZIEKqaX4rCMzrc9KJ5zRXGUkO7GKzp7BXPtRxu')` }} />
                        <div className="bg-cover bg-center rounded-none" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuAmiCFVPJ_Sv6cmXBDUaogu1TL6BbiuBgP_E9NaWqwnFV21cx1_M8F_YwIUAfxXHzLL_CSZBZa33S1w06RwHnlycDUKNTF9e5DppMUtbEvE0P5dhnBADfDxTGmMRoNF8qKlM4uN7I30_cUF6ANOhmD5uHxi4OGN_QJdPJrALS2LwWwT3I-pU0_6D8IOAmMHGNfaYMBC0MubPhwVsmXjbFUmUgOtJBA7iAucduh-wn1_-E2C_5YCrMTg2Tv7y0r9oe_VqQn1bW6aFPXl')` }} />
                        <div className="bg-cover bg-center rounded-none" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBzFSlSwX6Y_kchU_CkGp3jcae16k3Kz_SO_vRprm0uKTadYZcf0l_pyofZ3rWnblCDEhrILg4US3kz5PVyoNevr5FmSvLtPefJkuZoVL3Hv1Zzk9HGXbln0pI11VYxRFaGzJoBQfTpiKSy0TY-AlN-2G8iJPU1MpeyAEUfsTeoezLMRPeMwHLOTCTBSffHiJfEJSXUbDxZ1W5yI4qgMow7YrIedFhVwA0D74E7V_pt2He8cn_hVkjAYzq9a3ADbs3LlwoHuFVi19ZV')` }} />
                        <div className="flex items-center justify-center rounded-none bg-black/20">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div className="bg-cover bg-center rounded-none" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDzzyNfmlkyK-KZzcMTADitd90GJ2Yz0jog8qIQ9pbjckbFzzNvJwNBueNy6gB3FoZ7bg_I_nhBOOIX5mPzJoEGE-7_HnVcK839eZ_NG5q5Dj0y46KCYy3JOJzwNwjLGLf6W_M6KGW10hEiDwBmQr_W19d11IRE3xIaMH9L-nXHZffWrCiy38jCdwY2dd6H-Po8czvlNMoaAjpwHJ0NedE-brnchDfP8v4sdEM5U-hfIRJH8c059qRqTo7H0yL-zglXhCM1IZUkVKJk')` }} />
                        <div className="bg-cover bg-center rounded-none" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDUPI-tbL9ytQd8cey_MfSZaHXFXhoX841g7W6IrkozKlgSeOR2yZ3BeHk4UGXBX4b5wVM-gMv3qwpF0N_qlw1R1vWAIFS8fkEeolIsmy39mw-B7vjnDbiofXzVa6zjqMpm4VJ4_OJlmt9fhuSP57gG1ji1ZwNFArftVl3ycYaVbUmffie0MUUu7cYFq1x2yh9ZjJsDY14oBn9hh6hhJW0BjmfL5xFykcY7rsQexugIaNm5D0rwpoQVVLSXjNcCF94mScr9QBR1yXus')` }} />
                      </div>
                      <div className="absolute bottom-3 left-4 font-sans text-xs font-bold uppercase tracking-wider text-white bg-black/60 px-2 py-0.5">
                        People Hub
                      </div>
                    </div>
                  );
                }

              case 'photos':
                if (tile.size === 'small') {
                  return (
                    <div className="h-full w-full relative">
                      <img 
                        src={photoRoll[photoIdx]} 
                        alt="Photos compact view" 
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  );
                } else if (tile.size === 'medium') {
                  return (
                    <div className="h-full w-full bg-zinc-900 overflow-hidden relative">
                      <img 
                        src={photoRoll[photoIdx]} 
                        alt="Photos standard view" 
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-2 left-2 font-sans text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 px-1.5 py-0.5">
                        Photos
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="h-full w-full bg-zinc-900 overflow-hidden relative">
                      <img 
                        src={photoRoll[photoIdx]} 
                        alt="Photos wide view" 
                        className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-3 left-4 font-sans text-xs font-bold uppercase tracking-wider text-white bg-black/60 px-2 py-0.5">
                        Lumia Camera Roll Gallery
                      </div>
                    </div>
                  );
                }

              case 'spotify':
                if (tile.size === 'small') {
                  return (
                    <div className="h-full w-full flex items-center justify-center bg-[#1DB954]">
                      <Music className={`w-6 h-6 text-white ${isPlaying ? 'animate-spin-slow' : ''}`} />
                    </div>
                  );
                } else if (tile.size === 'medium') {
                  return (
                    <div className="h-full w-full bg-[#1DB954] text-white flex flex-col justify-between p-4">
                      <div className="flex justify-between items-start">
                        <div className="w-8 h-8 bg-black/25 flex items-center justify-center">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePlaySpotify(e);
                          }}
                          className="w-7 h-7 bg-black/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                        >
                          {isPlaying ? (
                            <Pause className="w-3.5 h-3.5 text-white fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-white fill-current ml-0.5" />
                          )}
                        </button>
                      </div>
                      
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[11px] truncate leading-tight">{activeSong?.title || 'After Hours'}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-85">Spotify</span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="h-full w-full bg-[#1DB954] text-white flex items-center justify-between p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-black/25 flex items-center justify-center flex-shrink-0">
                          <Music className={`w-7 h-7 text-white ${isPlaying ? 'animate-spin-slow' : ''}`} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm truncate">{activeSong?.title || 'After Hours'}</span>
                          <span className="text-xs text-white/80 truncate mb-1">{activeSong?.artist || 'Lumia Metro'}</span>
                          {/* Animated playing bars or simple slider */}
                          <div className="w-32 h-1 bg-white/20 relative overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 h-full bg-white transition-all duration-1000" 
                              style={{ width: isPlaying ? '60%' : '10%' }}
                            />
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePlaySpotify(e);
                        }}
                        className="w-10 h-10 bg-black/40 flex items-center justify-center rounded-none hover:bg-black/60 active:scale-95 transition-transform ml-3 flex-shrink-0"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white fill-current" />
                        ) : (
                          <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                        )}
                      </button>
                    </div>
                  );
                }

              case 'calendar':
                if (tile.size === 'small') {
                  return (
                    <div className="h-full w-full flex flex-col justify-center items-center">
                      <span className="text-2xl font-light leading-none">{todayNum}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-90 mt-0.5">{weekday}</span>
                    </div>
                  );
                } else if (tile.size === 'medium') {
                  return (
                    <div className="h-full w-full flex flex-col justify-between p-4">
                      <div className="flex flex-col">
                        <span className="text-3xl font-light leading-none">{todayNum}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 mt-1">{weekday}</span>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider">Calendar</span>
                    </div>
                  );
                } else {
                  const nextEvent = events.length > 0 ? events[events.length - 1] : null;
                  return (
                    <div className="h-full w-full flex justify-between items-center p-4">
                      <div className="flex flex-col justify-center items-center border-r border-white/10 pr-4 flex-shrink-0">
                        <span className="text-4xl font-light leading-none">{todayNum}</span>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-90 mt-1">{weekday}</span>
                      </div>
                      <div className="flex-1 min-w-0 pl-4 flex flex-col justify-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-1">Up Next</span>
                        <span className="text-sm font-bold text-white truncate">{nextEvent ? nextEvent.title : 'Free Day!'}</span>
                        <span className="text-xs text-white/70">{nextEvent ? `${nextEvent.time} • ${nextEvent.location}` : 'No upcoming schedule'}</span>
                      </div>
                    </div>
                  );
                }

              case 'weather':
                if (tile.size === 'small') {
                  return (
                    <div className="h-full w-full flex flex-col justify-center items-center bg-zinc-900">
                      <Sun className="w-5 h-5 text-yellow-400" />
                      <span className="text-[11px] font-bold mt-1">72°</span>
                    </div>
                  );
                } else if (tile.size === 'medium') {
                  return (
                    <div className="h-full w-full flex flex-col justify-between p-4 bg-zinc-900">
                      <div className="flex justify-between items-start">
                        <Sun className="w-7 h-7 text-yellow-400" />
                        <span className="text-xl font-light font-mono text-white/90">72°</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/70">Redmond • Sunny</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Weather</span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="h-full w-full flex justify-between items-center p-4 bg-zinc-900">
                      <div className="flex items-center gap-3">
                        <Sun className="w-10 h-10 text-yellow-400" />
                        <div className="flex flex-col">
                          <span className="text-2xl font-light font-mono text-white">72°</span>
                          <span className="text-xs text-white/70">Redmond, WA</span>
                        </div>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-bold uppercase text-white/50 tracking-wider">Extended</span>
                        <span className="text-xs text-yellow-300">Clear Skies & Sunshine</span>
                        <span className="text-[10px] text-white/40">Humidity: 45% • Wind: 5mph</span>
                      </div>
                    </div>
                  );
                }

              case 'outlook':
                if (tile.size === 'small') {
                  return (
                    <div className="h-full w-full flex items-center justify-center relative">
                      <Mail className="w-6 h-6 fill-current" />
                      {unreadMails > 0 && (
                        <span className="absolute top-1 right-1 bg-white text-black font-black text-[9px] w-4.5 h-4.5 flex items-center justify-center font-mono">
                          {unreadMails}
                        </span>
                      )}
                    </div>
                  );
                } else if (tile.size === 'medium') {
                  return (
                    <div className="h-full w-full flex flex-col justify-between p-4 relative">
                      <div className="flex justify-end">
                        <Mail className="w-7 h-7 fill-current" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs tracking-tight mb-1">
                          {unreadMails > 0 ? `${unreadMails} New Mails` : 'Inbox Clean'}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider">Outlook</span>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="h-full w-full flex flex-col justify-between p-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/50">Exchange Mail</span>
                        <Mail className="w-5 h-5 fill-current" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white mb-0.5">
                          {unreadMails > 0 ? `Important Review (${unreadMails} messages)` : 'Inbox completely up to date'}
                        </span>
                        <span className="text-[11px] text-white/70 line-clamp-1 mb-1 font-sans">
                          Sender: Alex Rivera • Blueprint specifications attached
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider">Outlook Mail</span>
                      </div>
                    </div>
                  );
                }

              case 'browser':
                if (tile.size === 'small') {
                  return (
                    <div className="h-full w-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  );
                } else if (tile.size === 'medium') {
                  return (
                    <div className="h-full w-full flex flex-col justify-between p-4">
                      <div className="flex justify-end">
                        <ShoppingBag className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider">Store</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="h-full w-full flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="w-9 h-9 text-white" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold uppercase tracking-wider">Lumia App Store</span>
                          <span className="text-[10px] text-white/70">Featured Retro Games & Utilities</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono bg-white/10 px-2 py-1 text-white border border-white/5 uppercase">Free</span>
                    </div>
                  );
                }

              case 'settings':
                if (tile.size === 'small') {
                  return (
                    <div className="h-full w-full flex items-center justify-center bg-zinc-900">
                      <Settings className="w-5 h-5 animate-spin-slow text-white/80" />
                    </div>
                  );
                } else if (tile.size === 'medium') {
                  return (
                    <div className="h-full w-full flex flex-col justify-between p-4 bg-zinc-900 text-white/95">
                      <div className="flex justify-end">
                        <Settings className="w-7 h-7 animate-spin-slow" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider">Settings</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="h-full w-full flex items-center gap-4 p-4 bg-zinc-900 text-white">
                      <Settings className="w-9 h-9 animate-spin-slow text-cyan-400" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold uppercase tracking-wider">Config Center</span>
                        <span className="text-[10px] text-white/60">Customize wallpaper, haptic sound tones, and themes</span>
                      </div>
                    </div>
                  );
                }

              default:
                return (
                  <div className="h-full w-full flex items-center justify-center p-4">
                    <span className="text-xs uppercase font-bold">{tile.name}</span>
                  </div>
                );
            }
          };

          return (
            <div 
              key={tile.id}
              onClick={() => {
                if (!isEditMode) {
                  onLaunchApp(tile.appId);
                }
              }}
              onMouseDown={(e) => handleMouseDown(e, tile.id)}
              onMouseUp={() => handleMouseUpOrLeave(tile.id)}
              onMouseLeave={() => handleMouseUpOrLeave(tile.id)}
              style={getTiltStyle(tile.id)}
              className={`relative cursor-pointer transition-all duration-200 select-none overflow-hidden rounded-none shadow-md ${sizeClass} ${
                tile.id === 'spotify' ? 'bg-[#1DB954]' : tile.id === 'weather' || tile.id === 'settings' ? 'bg-zinc-900' : getAccentBg()
              } ${isEditMode ? 'ring-2 ring-white/50 scale-[0.98]' : 'hover:brightness-105'}`}
            >
              {/* Actual custom Tile UI */}
              {renderTileContent()}

              {/* Dynamic Action Controls Layer (ONLY shown in edit mode) */}
              {isEditMode && (
                <div 
                  onClick={(e) => e.stopPropagation()} // Block launching app while inside action bounds
                  className="absolute inset-0 bg-black/75 z-20 flex flex-col items-center justify-center p-2 gap-2 text-white animate-[fadeIn_0.15s_ease-out]"
                >
                  {/* Title Indicator inside edit shade */}
                  <span className="text-[9px] font-black uppercase tracking-wider opacity-60 line-clamp-1 mb-1">{tile.name} ({tile.size})</span>

                  {/* Sizing & Unpin Actions row */}
                  <div className="flex items-center gap-1.5">
                    {/* Size Selector */}
                    <button
                      onClick={() => handleCycleSize(tile.id)}
                      className="p-1.5 bg-zinc-800 border border-white/20 hover:border-white/50 text-white flex items-center gap-1"
                      title="Toggle Widget Size"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="text-[8px] font-bold uppercase">Size</span>
                    </button>

                    {/* Unpin Action */}
                    <button
                      onClick={() => handleUnpinTile(tile.id)}
                      className="p-1.5 bg-red-950/40 text-red-400 border border-red-900/40 hover:bg-red-900/30 flex items-center gap-1"
                      title="Unpin Tile"
                    >
                      <PinOff className="w-3.5 h-3.5" />
                      <span className="text-[8px] font-bold uppercase">Unpin</span>
                    </button>
                  </div>

                  {/* Reordering Shift buttons row */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveTile(idx, 'prev')}
                      disabled={idx === 0}
                      className="p-1 bg-zinc-800 border border-white/10 hover:border-white/30 text-white disabled:opacity-30 disabled:hover:border-white/10"
                      title="Move Up/Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[9px] font-mono text-white/50 px-1 font-bold">Pos {tile.order}</span>
                    <button
                      onClick={() => handleMoveTile(idx, 'next')}
                      disabled={idx === visibleTiles.length - 1}
                      className="p-1 bg-zinc-800 border border-white/10 hover:border-white/30 text-white disabled:opacity-30 disabled:hover:border-white/10"
                      title="Move Down/Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pinned Applications Drawer (Pins Unpinned Apps) */}
      {isEditMode && hiddenTiles.length > 0 && (
        <div className="border border-white/10 bg-white/5 p-4 rounded-none space-y-3 animate-[fadeIn_0.3s_ease-out]">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-lime-400" />
            <span>Pin More Tiles to Start screen</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {hiddenTiles.map(tile => (
              <button
                key={tile.id}
                onClick={() => handlePinTile(tile.id)}
                className="flex items-center justify-between p-2.5 bg-zinc-950 border border-white/10 hover:border-white/30 text-white transition-all text-left"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold truncate">{tile.name}</span>
                  <span className="text-[8px] font-mono text-white/40 uppercase">App ID: {tile.appId}</span>
                </div>
                <Plus className={`w-4 h-4 ${getAccentText()} flex-shrink-0 ml-2`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trigger Edit Layout Mode helper bar (shown only when NOT in edit mode) */}
      {!isEditMode && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => {
              onSetEditMode(true);
              playHapticSound?.(600, 0.1, 'sine');
            }}
            className="px-6 py-2 border border-white/10 bg-white/5 text-[10px] uppercase font-mono font-bold tracking-widest text-white/50 hover:text-white hover:border-white/20 hover:bg-white/10 active:scale-95 transition-all flex items-center gap-2"
          >
            <Settings className="w-3.5 h-3.5 animate-spin-slow" />
            Customize Start Tiles
          </button>
        </div>
      )}

    </div>
  );
}
