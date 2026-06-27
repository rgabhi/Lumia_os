import React from 'react';
import { Wifi, Bluetooth, Plane, Flashlight, Bell, MessageSquare, Calendar, ShieldAlert, ArrowLeft } from 'lucide-react';
import { SystemSettings, NotificationItem } from '../types';

interface QuickSettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (updates: Partial<SystemSettings>) => void;
  notifications: NotificationItem[];
  onClearNotifications: () => void;
  onClose: () => void;
}

export default function QuickSettings({
  settings,
  onUpdateSettings,
  notifications,
  onClearNotifications,
  onClose
}: QuickSettingsProps) {

  const getAccentBg = () => {
    if (settings.accentColor === 'cyan') return 'bg-[#00abec] text-white border-transparent';
    if (settings.accentColor === 'magenta') return 'bg-[#d90274] text-white border-transparent';
    if (settings.accentColor === 'lime') return 'bg-[#b3d349] text-black border-transparent';
    if (settings.accentColor === 'orange') return 'bg-[#f05a28] text-white border-transparent';
    return 'bg-[#a252fc] text-white border-transparent';
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#0A0A0A] text-[#e2e2e2] p-6 select-none font-sans overflow-y-auto z-[70] flex flex-col justify-between no-scrollbar">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-2">
          <div className="flex items-center gap-3">
            <Bell className="w-5.5 h-5.5 text-cyan-400" />
            <h1 className="font-light text-2xl uppercase tracking-wider text-white">Action Center</h1>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 border border-white/10 bg-white/5 rounded-none hover:border-white/35 hover:bg-white/10 text-[10px] font-sans flex items-center gap-1.5 active:scale-95 transition-all text-white/80"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        </div>

        {/* Pivot Navigation */}
        <div className="flex gap-gutter mb-6 items-baseline border-b border-white/10 pb-2">
          <span className="text-white/40 font-bold text-xs tracking-widest uppercase">Quick Toggles</span>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-2 gap-3.5 mb-8">
          
          {/* Wi-Fi Toggle */}
          <button 
            onClick={() => onUpdateSettings({ wifiConnected: !settings.wifiConnected })}
            className={`p-4 flex flex-col justify-between text-left aspect-square transition-all active:scale-[0.97] rounded-none border ${
              settings.wifiConnected 
                ? getAccentBg()
                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            <Wifi className="w-6.5 h-6.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Wi-Fi</p>
              <p className="text-[10px] font-sans opacity-70">{settings.wifiConnected ? 'CONNECTED' : 'OFF'}</p>
            </div>
          </button>

          {/* Bluetooth Toggle */}
          <button 
            onClick={() => onUpdateSettings({ bluetoothEnabled: !settings.bluetoothEnabled })}
            className={`p-4 flex flex-col justify-between text-left aspect-square transition-all active:scale-[0.97] rounded-none border ${
              settings.bluetoothEnabled 
                ? getAccentBg()
                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            <Bluetooth className="w-6.5 h-6.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Bluetooth</p>
              <p className="text-[10px] font-sans opacity-70">{settings.bluetoothEnabled ? 'ACTIVE' : 'OFF'}</p>
            </div>
          </button>

          {/* Airplane Mode Toggle */}
          <button 
            onClick={() => onUpdateSettings({ airplaneMode: !settings.airplaneMode })}
            className={`p-4 flex flex-col justify-between text-left aspect-square transition-all active:scale-[0.97] rounded-none border ${
              settings.airplaneMode 
                ? 'bg-amber-600 text-white border-transparent' 
                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            <Plane className="w-6.5 h-6.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Airplane</p>
              <p className="text-[10px] font-sans opacity-70">{settings.airplaneMode ? 'ACTIVATED' : 'OFF'}</p>
            </div>
          </button>

          {/* Flashlight Toggle */}
          <button 
            onClick={() => onUpdateSettings({ flashlightOn: !settings.flashlightOn })}
            className={`p-4 flex flex-col justify-between text-left aspect-square transition-all active:scale-[0.97] rounded-none border ${
              settings.flashlightOn 
                ? 'bg-yellow-500 text-black border-transparent' 
                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            <Flashlight className="w-6.5 h-6.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Flashlight</p>
              <p className="text-[10px] font-sans opacity-70">{settings.flashlightOn ? 'ON' : 'OFF'}</p>
            </div>
          </button>

        </div>

        {/* Dynamic Metro Progress Dots inside translucent pill */}
        <div className="relative w-full h-1 bg-white/5 rounded-none mb-8 overflow-hidden">
          <div className="absolute top-0 w-1.5 h-1.5 bg-[#00abec] rounded-none animate-[dot-fly_3s_infinite_linear]" style={{ animationDelay: '0s' }} />
          <div className="absolute top-0 w-1.5 h-1.5 bg-[#00abec] rounded-none animate-[dot-fly_3s_infinite_linear]" style={{ animationDelay: '0.2s' }} />
          <div className="absolute top-0 w-1.5 h-1.5 bg-[#00abec] rounded-none animate-[dot-fly_3s_infinite_linear]" style={{ animationDelay: '0.4s' }} />
          <div className="absolute top-0 w-1.5 h-1.5 bg-[#00abec] rounded-none animate-[dot-fly_3s_infinite_linear]" style={{ animationDelay: '0.6s' }} />
        </div>

        {/* Notifications list */}
        <section className="space-y-4">
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-xs font-bold font-sans text-white/30 uppercase tracking-widest">Recent Notifications</h2>
            {notifications.length > 0 && (
              <button 
                onClick={onClearNotifications}
                className="text-[10px] font-sans text-cyan-400 hover:underline hover:text-white uppercase tracking-wider font-bold"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-500 font-sans text-center py-8">No notifications</p>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-sans font-bold uppercase tracking-wider px-1">
                    {notif.appName === 'MESSAGES' && <MessageSquare className="w-3 h-3 text-pink-400" />}
                    {notif.appName === 'CALENDAR' && <Calendar className="w-3 h-3 text-lime-400" />}
                    {notif.appName === 'SYSTEM' && <ShieldAlert className="w-3 h-3 text-yellow-500" />}
                    <span>{notif.appName}</span>
                  </div>
                  
                  {/* Notification Card */}
                  <div className="bg-white/5 hover:bg-white/10 p-4 border border-white/10 rounded-none cursor-pointer transition-all duration-200">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm text-white/95">{notif.title}</span>
                      <span className="text-[10px] text-white/40 font-sans">{notif.timestamp}</span>
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed line-clamp-2">{notif.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Brand Watermark footer */}
      <div className="pt-10 pointer-events-none opacity-5 select-none font-sans mt-auto">
        <h3 className="text-5xl font-black uppercase tracking-tighter leading-none">CLEAN<br/>DESK</h3>
      </div>
    </div>
  );
}
