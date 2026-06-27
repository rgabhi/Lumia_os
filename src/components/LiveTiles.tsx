import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, Users, Music, Calendar, Sun, Mail, ShoppingBag, Settings, Play, Pause, CloudRain, CloudSnow, CloudLightning, Cloud } from 'lucide-react';
import { Song, SystemSettings, CalendarEvent } from '../types';

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
  onTogglePlaySpotify
}: LiveTilesProps) {
  
  // Local state for interactive click tilt transforms
  const [tiltStyles, setTiltStyles] = useState<Record<string, string>>({});

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, id: string) => {
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

  return (
    <div className="px-5 flex gap-3 flex-wrap max-w-screen-md mx-auto justify-start select-none py-2 animate-[fadeIn_0.4s_ease-out]">
      
      {/* PHONE TILE (Medium Square) */}
      <div 
        onClick={() => onLaunchApp('phone')}
        onMouseDown={(e) => handleMouseDown(e, 'phone')}
        onMouseUp={() => handleMouseUpOrLeave('phone')}
        onMouseLeave={() => handleMouseUpOrLeave('phone')}
        style={getTiltStyle('phone')}
        className={`w-[calc(50%-6px)] aspect-square cursor-pointer flex flex-col justify-between p-4.5 rounded-none ${getAccentBg()}`}
      >
        <div className="flex justify-end">
          <Phone className="w-8 h-8 fill-current" />
        </div>
        <span className="font-sans text-xs font-bold uppercase tracking-wider">Phone</span>
      </div>

      {/* MESSAGES TILE (Medium Square) */}
      <div 
        onClick={() => onLaunchApp('messages')}
        onMouseDown={(e) => handleMouseDown(e, 'messages')}
        onMouseUp={() => handleMouseUpOrLeave('messages')}
        onMouseLeave={() => handleMouseUpOrLeave('messages')}
        style={getTiltStyle('messages')}
        className={`w-[calc(50%-6px)] aspect-square cursor-pointer flex flex-col justify-between p-4.5 rounded-none relative ${getAccentBg()}`}
      >
        <div className="flex justify-end relative">
          <MessageSquare className="w-8 h-8 fill-current" />
          {unreadMsgs > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-white text-black font-bold text-xs w-5 h-5 flex items-center justify-center font-mono">
              {unreadMsgs}
            </span>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] leading-snug mb-1 truncate opacity-90">
            {lastMessageText || 'No unread messages.'}
          </span>
          <span className="font-sans text-xs font-bold uppercase tracking-wider">Messaging</span>
        </div>
      </div>

      {/* PEOPLE TILE (Wide Rectangle - 2x1) */}
      <div 
        onClick={() => onLaunchApp('phone')} // People launches same phone contacts hub
        onMouseDown={(e) => handleMouseDown(e, 'people')}
        onMouseUp={() => handleMouseUpOrLeave('people')}
        onMouseLeave={() => handleMouseUpOrLeave('people')}
        style={getTiltStyle('people')}
        className="w-full h-[calc(50vw-12px)] md:h-52 cursor-pointer overflow-hidden relative"
      >
        <div className={`grid grid-cols-4 grid-rows-2 h-full w-full gap-0.5 ${getAccentBg()} p-0.5`}>
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
        <div className="absolute bottom-3 left-4 font-sans text-xs font-bold uppercase tracking-wider text-white">
          People
        </div>
      </div>

      {/* PHOTOS TILE (Wide Rectangle - 2x1) */}
      <div 
        onClick={() => onLaunchApp('photos')}
        onMouseDown={(e) => handleMouseDown(e, 'photos')}
        onMouseUp={() => handleMouseUpOrLeave('photos')}
        onMouseLeave={() => handleMouseUpOrLeave('photos')}
        style={getTiltStyle('photos')}
        className="w-full h-[calc(50vw-12px)] md:h-52 bg-zinc-900 cursor-pointer overflow-hidden relative rounded-none"
      >
        <img 
          src={photoRoll[photoIdx]} 
          alt="Atmospheric landscape or camera snapshot" 
          className="absolute inset-0 w-full h-full object-cover transition-all duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-3 left-4 font-sans text-xs font-bold uppercase tracking-wider text-white bg-black/50 px-2 py-0.5">
          Photos
        </div>
      </div>

      {/* SPOTIFY TILE (Medium Square) */}
      <div 
        onClick={() => onLaunchApp('spotify')}
        onMouseDown={(e) => handleMouseDown(e, 'spotify')}
        onMouseUp={() => handleMouseUpOrLeave('spotify')}
        onMouseLeave={() => handleMouseUpOrLeave('spotify')}
        style={getTiltStyle('spotify')}
        className="w-[calc(50%-6px)] aspect-square cursor-pointer bg-[#1DB954] text-white flex flex-col justify-between p-4.5 rounded-none"
      >
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 bg-black/25 flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          
          <button 
            onClick={onTogglePlaySpotify}
            className="w-8 h-8 bg-black/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white fill-current" />
            ) : (
              <Play className="w-4 h-4 text-white fill-current ml-0.5" />
            )}
          </button>
        </div>
        
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-sm truncate">{activeSong?.title || 'After Hours'}</span>
          <span className="font-sans text-xs font-bold uppercase tracking-wider opacity-80">Spotify</span>
        </div>
      </div>

      {/* CALENDAR TILE (Small Square) */}
      <div 
        onClick={() => onLaunchApp('calendar')}
        onMouseDown={(e) => handleMouseDown(e, 'calendar')}
        onMouseUp={() => handleMouseUpOrLeave('calendar')}
        onMouseLeave={() => handleMouseUpOrLeave('calendar')}
        style={getTiltStyle('calendar')}
        className={`w-[calc(25%-8px)] aspect-square cursor-pointer text-white flex flex-col justify-center items-center font-sans rounded-none ${getAccentBg()}`}
      >
        <span className="text-3xl font-light leading-none">{todayNum}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-90">{weekday}</span>
      </div>

      {/* WEATHER TILE (Small Square) */}
      <div 
        onClick={() => onLaunchApp('weather')}
        onMouseDown={(e) => handleMouseDown(e, 'weather')}
        onMouseUp={() => handleMouseUpOrLeave('weather')}
        onMouseLeave={() => handleMouseUpOrLeave('weather')}
        style={getTiltStyle('weather')}
        className="w-[calc(25%-8px)] aspect-square cursor-pointer bg-zinc-900 text-white flex flex-col justify-center items-center font-sans rounded-none"
      >
        <Sun className="w-6 h-6 text-yellow-400" />
        <span className="text-xs font-bold tracking-wider mt-1.5">72°</span>
      </div>

      {/* MAIL/OUTLOOK TILE (Medium Square) */}
      <div 
        onClick={() => onLaunchApp('outlook')}
        onMouseDown={(e) => handleMouseDown(e, 'outlook')}
        onMouseUp={() => handleMouseUpOrLeave('outlook')}
        onMouseLeave={() => handleMouseUpOrLeave('outlook')}
        style={getTiltStyle('outlook')}
        className={`w-[calc(50%-6px)] aspect-square cursor-pointer text-white flex flex-col justify-between p-4.5 rounded-none ${getAccentBg()}`}
      >
        <div className="flex justify-end">
          <Mail className="w-8 h-8 fill-current" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight leading-none mb-1">
            {unreadMails > 0 ? `${unreadMails} New` : 'Inbox Clean'}
          </span>
          <span className="font-sans text-xs font-bold uppercase tracking-wider">Outlook</span>
        </div>
      </div>

      {/* STORE TILE (Small Square) */}
      <div 
        onClick={() => onLaunchApp('browser')}
        onMouseDown={(e) => handleMouseDown(e, 'store')}
        onMouseUp={() => handleMouseUpOrLeave('store')}
        onMouseLeave={() => handleMouseUpOrLeave('store')}
        style={getTiltStyle('store')}
        className={`w-[calc(25%-8px)] aspect-square cursor-pointer text-white flex flex-col justify-center items-center rounded-none transition-all ${getAccentBg()}`}
      >
        <ShoppingBag className="w-6 h-6" />
        <span className="text-[9px] font-sans font-bold uppercase tracking-widest mt-1">Store</span>
      </div>

      {/* SETTINGS TILE (Small Square) */}
      <div 
        onClick={() => onLaunchApp('settings')}
        onMouseDown={(e) => handleMouseDown(e, 'settings')}
        onMouseUp={() => handleMouseUpOrLeave('settings')}
        onMouseLeave={() => handleMouseUpOrLeave('settings')}
        style={getTiltStyle('settings')}
        className="w-[calc(25%-8px)] aspect-square cursor-pointer bg-zinc-900 text-white/90 hover:text-white flex flex-col justify-center items-center rounded-none transition-all"
      >
        <Settings className="w-6 h-6 animate-spin-slow" />
        <span className="text-[9px] font-sans font-bold uppercase tracking-widest mt-1">Config</span>
      </div>

    </div>
  );
}
