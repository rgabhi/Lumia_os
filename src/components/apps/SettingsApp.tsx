import React, { useState } from 'react';
import { Settings, Sliders, Smartphone, Shield, RotateCcw, Volume2, VolumeX, Eye } from 'lucide-react';
import { SystemSettings, AccentColor } from '../../types';
import { METRO_THEMES } from '../../data';

interface SettingsAppProps {
  onClose: () => void;
  accentClass: string;
  settings: SystemSettings;
  onUpdateSettings: (updates: Partial<SystemSettings>) => void;
  onResetData: () => void;
}

const PRESET_WALLPAPERS = [
  {
    name: 'City Neon Dawn',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFSig2MIbrY0vrGLaZM8cbSD-4Gvsp2ntvXCWDublKNNFw2Ub694mJON54tvlDB1vkj-5o0cImg56oMUd_cSszlGDLhXnb6-BvpReJM3s_37KaoF1X9w5FTI7JmgJ2uy8zxoZ8J4O20S0H_HFG_rEwMp5HedWELzJ3aDKT65wN5qk_GJWMLw0kpQuDYO89VVQrSOCrFE-XGroJMrbYiX5wuYMBRYmdfUtNtCXtSZuYDgl0uYLVBoM1XGuqMzOY2DHIZznF3E3YroRO'
  },
  {
    name: 'Futuristic City Dusk',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAldsSQd_GRUzHv9Yd0Ue_zr794--dXU-mlaMl1gbn6wL7ABFUafjy2feaefNxIz0JJx6FQnc6D4QhNi9L9qbeY60EuUhEycdfDhxG_h3M3bRFmrR5_447A3tB5IG07vAOlX85tuakcJnM6nwdH1sm8hrFzFwXoGzUYdfs9evLu_1vEapqalRmmI4Tp0RK3glNrMRopgiUgY_USvtlb5bEC_s54aM1ua5sYpbQ_7h8C2s4MgHZfWANzC8jIEQw6zK6leqhxen93QuvD'
  },
  {
    name: 'Pure OLED Obsidian',
    url: 'solid_black'
  }
];

export default function SettingsApp({
  onClose,
  accentClass,
  settings,
  onUpdateSettings,
  onResetData
}: SettingsAppProps) {
  const [activeTab, setActiveTab] = useState<'system' | 'personalization' | 'about'>('system');
  const [customCarrier, setCustomCarrier] = useState(settings.carrierName);
  const [customWallpaper, setCustomWallpaper] = useState(settings.lockscreenWallpaper);

  const handleCarrierSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCarrier.trim()) return;
    onUpdateSettings({ carrierName: customCarrier.trim().toUpperCase() });
  };

  const handleWallpaperSave = (url: string) => {
    setCustomWallpaper(url);
    onUpdateSettings({ lockscreenWallpaper: url });
  };

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] text-white p-6 select-none font-sans relative overflow-hidden">
      {/* App Header */}
      <div className="flex items-center justify-between mb-8 mt-1">
        <div>
          <h1 className="font-light text-2xl tracking-tight uppercase text-white">Settings</h1>
          <p className="text-[10px] text-white/40 tracking-wider">SYSTEM CONFIGURATION</p>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-1.5 border border-white/10 bg-white/5 rounded-none hover:border-white/35 hover:bg-white/10 text-[10px] font-sans flex items-center gap-1 active:scale-95 transition-all text-white/80"
        >
          Back
        </button>
      </div>

      {/* Settings Capsule Tabs */}
      <div className="flex gap-1 mb-6 text-[10px] font-semibold p-1 bg-white/5 border border-white/10 rounded-none shrink-0">
        <button 
          onClick={() => setActiveTab('system')}
          className={`flex-1 text-center py-2 px-3 rounded-none transition-all uppercase tracking-wider ${
            activeTab === 'system' ? 'text-white bg-white/15 border border-white/10 font-bold' : 'text-white/40 border border-transparent hover:text-white'
          }`}
        >
          System
        </button>
        <button 
          onClick={() => setActiveTab('personalization')}
          className={`flex-1 text-center py-2 px-3 rounded-none transition-all uppercase tracking-wider ${
            activeTab === 'personalization' ? 'text-white bg-white/15 border border-white/10 font-bold' : 'text-white/40 border border-transparent hover:text-white'
          }`}
        >
          Theme
        </button>
        <button 
          onClick={() => setActiveTab('about')}
          className={`flex-1 text-center py-2 px-3 rounded-none transition-all uppercase tracking-wider ${
            activeTab === 'about' ? 'text-white bg-white/15 border border-white/10 font-bold' : 'text-white/40 border border-transparent hover:text-white'
          }`}
        >
          About
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 no-scrollbar">
        {/* Tab 1: System settings */}
        {activeTab === 'system' && (
          <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
            {/* Audio Toggle */}
            <div className="p-4 border border-white/10 bg-white/5 rounded-none flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? <Volume2 className="text-cyan-400 w-5 h-5" /> : <VolumeX className="text-white/40 w-5 h-5" />}
                <div>
                  <p className="font-semibold text-sm">System UI Sounds</p>
                  <p className="text-[10px] text-white/50 leading-relaxed">System clicks and shutter sound feedback</p>
                </div>
              </div>
              <button
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`px-4.5 py-1.5 text-[10px] font-sans tracking-wider border font-bold transition-all rounded-none active:scale-95 ${
                  settings.soundEnabled 
                    ? 'bg-[#00abec] text-white border-transparent' 
                    : 'border-white/10 text-white/40 hover:bg-white/5'
                }`}
              >
                {settings.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Carrier Name Form */}
            <form onSubmit={handleCarrierSave} className="p-4 border border-white/10 bg-white/5 rounded-none space-y-3">
              <div className="flex items-center gap-2.5">
                <Smartphone className="text-cyan-400 w-5 h-5" />
                <p className="font-semibold text-sm">Network Carrier Identity</p>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed">Configure the custom carrier label displayed on the Lock Screen</p>
              <div className="flex gap-2">
                <input 
                  type="text"
                  maxLength={16}
                  value={customCarrier}
                  onChange={e => setCustomCarrier(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 focus:border-white/25 focus:bg-white/10 rounded-none py-2 px-4 focus:outline-none text-xs text-white font-sans"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00abec] hover:opacity-90 text-white text-xs font-semibold font-sans tracking-wider rounded-none active:scale-95 transition-all"
                >
                  Save
                </button>
              </div>
            </form>

            {/* General Toggles */}
            <div className="p-4 border border-white/10 bg-white/5 rounded-none space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <p className="font-semibold text-sm">Airplane Mode</p>
                  <p className="text-[10px] text-white/50 leading-relaxed">Suspends cellular network beacons</p>
                </div>
                <button
                  onClick={() => onUpdateSettings({ airplaneMode: !settings.airplaneMode })}
                  className={`px-4.5 py-1.5 text-[10px] font-sans border font-bold transition-all rounded-none active:scale-95 ${
                    settings.airplaneMode ? 'bg-[#f05a28] text-white border-transparent' : 'border-white/10 text-white/40 hover:bg-white/5'
                  }`}
                >
                  {settings.airplaneMode ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <p className="font-semibold text-sm">Bluetooth Wireless</p>
                  <p className="text-[10px] text-white/50 leading-relaxed">Sync wireless peripheral accessories</p>
                </div>
                <button
                  onClick={() => onUpdateSettings({ bluetoothEnabled: !settings.bluetoothEnabled })}
                  className={`px-4.5 py-1.5 text-[10px] font-sans border font-bold transition-all rounded-none active:scale-95 ${
                    settings.bluetoothEnabled ? 'bg-[#00abec] text-white border-transparent' : 'border-white/10 text-white/40 hover:bg-white/5'
                  }`}
                >
                  {settings.bluetoothEnabled ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Wi-Fi Connection</p>
                  <p className="text-[10px] text-white/50 leading-relaxed">Connect to high-speed base stations</p>
                </div>
                <button
                  onClick={() => onUpdateSettings({ wifiConnected: !settings.wifiConnected })}
                  className={`px-4.5 py-1.5 text-[10px] font-sans border font-bold transition-all rounded-none active:scale-95 ${
                    settings.wifiConnected ? 'bg-[#00abec] text-white border-transparent' : 'border-white/10 text-white/40 hover:bg-white/5'
                  }`}
                >
                  {settings.wifiConnected ? 'CONNECTED' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Reset Data Danger Zone */}
            <div className="p-4 border border-red-500/10 bg-red-950/5 rounded-none space-y-3">
              <RotateCcw className="text-red-400 w-5 h-5" />
              <div>
                <p className="font-semibold text-sm text-red-400">Recovery & Reset</p>
                <p className="text-[10px] text-white/40 leading-relaxed">Wipe all simulated contacts, call logs, captured photos, and sync preferences</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Wipe and reset the simulated OS? All user photos and messages will be reset.')) {
                    onResetData();
                  }
                }}
                className="w-full px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 hover:border-red-600/40 text-red-400 text-xs font-semibold font-sans tracking-wider rounded-none transition-all duration-150 active:scale-95"
              >
                RESET SIMULATOR OS
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Theme Personalization */}
        {activeTab === 'personalization' && (
          <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
            {/* Theme color selectors */}
            <div className="p-4 border border-white/10 bg-white/5 rounded-none space-y-3">
              <div className="flex items-center gap-2.5">
                <Sliders className="text-cyan-400 w-5 h-5" />
                <p className="font-semibold text-sm">System Accent Theme</p>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed">Changes dynamic background gradients on lockscreen triggers, live tiles, and buttons</p>
              <div className="grid grid-cols-5 gap-3">
                {(Object.keys(METRO_THEMES) as AccentColor[]).map((col) => {
                  const theme = METRO_THEMES[col];
                  const isSelected = settings.accentColor === col;
                  return (
                    <button
                      key={col}
                      onClick={() => onUpdateSettings({ accentColor: col })}
                      className={`aspect-square relative flex items-center justify-center transition-all active:scale-90 rounded-none border-2 ${
                        isSelected ? 'border-white scale-105' : 'border-white/10 hover:border-white/30'
                      }`}
                      style={{ backgroundColor: theme.accentHex }}
                      title={col}
                    >
                      {isSelected && <Shield className="w-4 h-4 text-black fill-current" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-white/30 font-sans uppercase text-center mt-2 tracking-widest">
                Active Theme: {settings.accentColor}
              </p>
            </div>

            {/* Lock Screen Wallpaper Presets */}
            <div className="p-4 border border-white/10 bg-white/5 rounded-none space-y-4">
              <div className="flex items-center gap-2.5">
                <Smartphone className="text-cyan-400 w-5 h-5" />
                <p className="font-semibold text-sm">Lock Screen Wallpaper</p>
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed">Choose an atmospheric digital sincerity backdrop</p>
              <div className="grid grid-cols-3 gap-3">
                {PRESET_WALLPAPERS.map((wp, idx) => {
                  const isSelected = settings.lockscreenWallpaper === wp.url;
                  const isObsidian = wp.url === 'solid_black';
                  return (
                    <button
                      key={idx}
                      onClick={() => handleWallpaperSave(wp.url)}
                      className={`aspect-[9/16] relative overflow-hidden border-2 rounded-none transition-all duration-150 ${
                        isSelected ? 'border-cyan-400 scale-[1.02]' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      {isObsidian ? (
                        <div className="w-full h-full bg-black flex items-center justify-center text-[10px] text-white/40 font-semibold font-sans">OLED</div>
                      ) : (
                        <img 
                          src={wp.url} 
                          alt={wp.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/80 p-1 text-[8px] text-white/60 font-sans truncate uppercase text-center">
                        {wp.name.split(' ')[1] || wp.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: About device */}
        {activeTab === 'about' && (
          <div className="p-4 border border-white/10 bg-white/5 rounded-none space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <Smartphone className="text-cyan-400 w-11 h-11 mx-auto" />
            
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold tracking-tight text-white leading-snug">Lumina OS Phone</h2>
              <p className="text-[10px] font-sans text-cyan-400 uppercase tracking-widest">Metro Grid Interface</p>
              <p className="text-[9px] text-white/30 mt-2">Build 12.4.1.ANTIGRAVITY_EMULATOR_PRO</p>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-3 font-sans text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Architecture:</span>
                <span className="font-semibold text-white/80">React SPA + Tailwind v4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Interactive State:</span>
                <span className="font-semibold text-white/80">Persistent LocalStorage</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Audio Synthesizer:</span>
                <span className="font-semibold text-white/80">HTML5 Web Audio API</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Webcam Integration:</span>
                <span className="font-semibold text-white/80">MediaDevices API Viewfinder</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Memory Allocation:</span>
                <span className="font-semibold text-white/80">8GB VIRTUAL RAM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Local Storage:</span>
                <span className="font-bold text-green-400">SECURE LOCAL PERSISTENCE</span>
              </div>
            </div>

            <div className="p-3 bg-white/5 border border-white/5 text-[10px] leading-relaxed text-white/60 text-center font-sans uppercase rounded-none">
              Designed with strict adherence to Lumia Metro design philosophies. Absolute focus on content, sharp grids, flat canvases, and bold typography.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
