import React, { useState, useEffect } from 'react';
import { Mail, MessageSquare, Phone, ChevronUp, Wifi, Battery } from 'lucide-react';
import { SystemSettings } from '../types';

interface LockScreenProps {
  settings: SystemSettings;
  unreadMsgs: number;
  unreadMails: number;
  missedCalls: number;
  onUnlock: () => void;
}

export default function LockScreen({ settings, unreadMsgs, unreadMails, missedCalls, onUnlock }: LockScreenProps) {
  const [currentTime, setCurrentTime] = useState('12:43');
  const [currentDate, setCurrentDate] = useState('SATURDAY, JUNE 27');
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);

      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      setCurrentDate(now.toLocaleDateString('en-US', options).toUpperCase());
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Parallax effect on desktop mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const moveX = (e.clientX - window.innerWidth / 2) / 40;
      const moveY = (e.clientY - window.innerHeight / 2) / 40;
      setMouseOffset({ x: moveX, y: moveY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleDragEnd = (e: React.TouchEvent | React.MouseEvent) => {
    // Simply unlock on click or touch
    onUnlock();
  };

  const isSolidBlack = settings.lockscreenWallpaper === 'solid_black';

  return (
    <div 
      onClick={onUnlock}
      className="absolute inset-0 w-full h-full flex flex-col justify-between bg-gradient-to-b from-[#0A0A0A] via-[#121212] to-[#050505] text-white p-6 select-none font-sans overflow-hidden cursor-pointer z-[60]"
    >
      {/* Parallax Atmospheric Background Image */}
      {!isSolidBlack && (
        <div 
          className="absolute inset-0 -z-10 bg-cover bg-center grayscale opacity-45 contrast-125 transition-transform duration-300 pointer-events-none scale-110"
          style={{ 
            backgroundImage: `url(${settings.lockscreenWallpaper})`,
            transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px) scale(1.1)`
          }}
        />
      )}
      
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-black/60 -z-10 pointer-events-none" />

      {/* Top Status Bar Mirroring */}
      <header className="flex justify-between items-center w-full h-8 opacity-90 z-10 px-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-white/80">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M17 5H21V19H17V5ZM11 9H15V19H11V9ZM5 13H9V19H5V13Z" />
          </svg>
          <span className="text-[11px] font-sans tracking-wide">{settings.carrierName}</span>
        </div>
        <div className="flex items-center gap-2 text-white/75">
          {!settings.airplaneMode && settings.wifiConnected && <Wifi className="w-4 h-4" />}
          <Battery className="w-5 h-5" />
        </div>
      </header>

      {/* Clock Display */}
      <main className="flex-1 flex flex-col justify-start pt-16 z-10 px-4">
        <div className="animate-[slideUpFade_0.8s_cubic-bezier(0.16,1,0.3,1)_forwards]">
          <h1 className="text-6xl font-light tracking-tighter leading-none text-white/95" id="clock">
            {currentTime}
          </h1>
          <p className="text-[11px] font-bold text-white/50 mt-3 uppercase tracking-[0.25em]" id="date">
            {currentDate}
          </p>
        </div>
      </main>

      {/* Notification Center icons inside authentic flat row */}
      <footer className="flex flex-col items-center pb-6 z-10">
        <div className="flex gap-8 mb-8 py-2 px-6 bg-transparent animate-[slideUpFade_0.8s_cubic-bezier(0.16,1,0.3,1)_0.2s_forwards]">
          
          {/* Outlook notification icon */}
          <div className="flex items-center gap-2 relative group">
            <Mail className="w-5.5 h-5.5 text-white/80" />
            <span className="text-sm font-sans font-bold text-white/90">{unreadMails}</span>
          </div>

          {/* Messages notification icon */}
          <div className="flex items-center gap-2 relative group">
            <MessageSquare className="w-5.5 h-5.5 text-white/80" />
            <span className="text-sm font-sans font-bold text-white/90">{unreadMsgs}</span>
          </div>

          {/* Dialer notification icon */}
          <div className="flex items-center gap-2 relative group">
            <Phone className="w-5.5 h-5.5 text-white/80" />
            <span className="text-sm font-sans font-bold text-white/90">{missedCalls}</span>
          </div>

        </div>

        {/* Swipe Hint */}
        <div className="flex flex-col items-center gap-1 opacity-60">
          <ChevronUp className="w-5 h-5 text-white animate-bounce" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/80">Tap anywhere to unlock</span>
        </div>
      </footer>
    </div>
  );
}
