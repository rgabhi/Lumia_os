import React, { useState } from 'react';
import { 
  Wifi, Bluetooth, Plane, Flashlight, Bell, MessageSquare, Calendar, 
  ShieldAlert, ArrowLeft, Mail, Sliders, Radio, Trash2, X, Play, BellOff, Volume2
} from 'lucide-react';
import { SystemSettings, NotificationItem, Intent } from '../types';

interface QuickSettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (updates: Partial<SystemSettings>) => void;
  notifications: NotificationItem[];
  onClearNotifications: () => void;
  onClose: () => void;
  notificationRules: {
    dndMode: boolean;
    channels: Record<string, { sound: boolean; toast: boolean; priority: 'Normal' | 'High' }>;
  };
  onUpdateNotificationRules: (rules: any) => void;
  onAddNotification: (notif: any) => void;
  onDeleteNotification: (id: string) => void;
  onNotificationClick: (notif: NotificationItem) => void;
  onBroadcastIntent: (intent: Omit<Intent, 'id' | 'timestamp'>) => void;
}

type PivotType = 'notifs' | 'rules' | 'simulator';

export default function QuickSettings({
  settings,
  onUpdateSettings,
  notifications,
  onClearNotifications,
  onClose,
  notificationRules,
  onUpdateNotificationRules,
  onAddNotification,
  onDeleteNotification,
  onNotificationClick,
  onBroadcastIntent
}: QuickSettingsProps) {
  const [activePivot, setActivePivot] = useState<PivotType>('notifs');

  // --- Simulator Form State ---
  const [simTitle, setSimTitle] = useState('Sarah Connor');
  const [simText, setSimText] = useState('Are we still meeting for lunch today?');
  const [simAppName, setSimAppName] = useState<'MESSAGES' | 'CALENDAR' | 'SYSTEM' | 'OUTLOOK'>('MESSAGES');
  const [simIntentType, setSimIntentType] = useState<string>('sms_sarah');

  const getAccentBg = () => {
    if (settings.accentColor === 'cyan') return 'bg-[#00abec] text-white border-transparent';
    if (settings.accentColor === 'magenta') return 'bg-[#d90274] text-white border-transparent';
    if (settings.accentColor === 'lime') return 'bg-[#b3d349] text-black border-transparent';
    if (settings.accentColor === 'orange') return 'bg-[#f05a28] text-white border-transparent';
    return 'bg-[#a252fc] text-white border-transparent';
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

  // --- Run simulation broadcast ---
  const handleSimulateBroadcast = () => {
    // Generate appropriate intent payload depending on selection
    let intentPayload: Omit<Intent, 'id' | 'timestamp'> | undefined;

    if (simIntentType === 'sms_sarah') {
      intentPayload = {
        action: 'android.intent.action.SENDTO',
        data: 'sms:sarah',
        extras: { recipient: 'Sarah Connor' }
      };
    } else if (simIntentType === 'mailto_alex') {
      intentPayload = {
        action: 'android.intent.action.SENDTO',
        data: 'mailto:alex@lumia.net',
        extras: { recipient: 'Alex Rivera', subject: 'Project Review' }
      };
    } else if (simIntentType === 'play_music') {
      intentPayload = {
        action: 'android.intent.action.PLAY_MUSIC',
        extras: { songName: 'After Hours' }
      };
    } else if (simIntentType === 'open_calendar') {
      intentPayload = {
        action: 'custom.intent.action.LAUNCH',
        data: 'calendar'
      };
    } else if (simIntentType === 'view_google') {
      intentPayload = {
        action: 'android.intent.action.VIEW',
        data: 'https://google.com'
      };
    }

    onAddNotification({
      title: simTitle,
      text: simText,
      appName: simAppName,
      sender: simTitle,
      intent: intentPayload
    });
  };

  const toggleChannelSetting = (channel: string, key: 'sound' | 'toast') => {
    const updatedChannels = {
      ...notificationRules.channels,
      [channel]: {
        ...notificationRules.channels[channel],
        [key]: !notificationRules.channels[channel][key]
      }
    };
    onUpdateNotificationRules({
      ...notificationRules,
      channels: updatedChannels
    });
  };

  const changeChannelPriority = (channel: string, priority: 'Normal' | 'High') => {
    const updatedChannels = {
      ...notificationRules.channels,
      [channel]: {
        ...notificationRules.channels[channel],
        priority
      }
    };
    onUpdateNotificationRules({
      ...notificationRules,
      channels: updatedChannels
    });
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#0A0A0A] text-[#e2e2e2] p-6 select-none font-sans overflow-y-auto z-[70] flex flex-col justify-between no-scrollbar">
      <div>
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6 mt-1">
          <div className="flex items-center gap-3">
            <Bell className="w-5.5 h-5.5 text-cyan-400" />
            <h1 className="font-light text-2xl uppercase tracking-wider text-white">Action Center</h1>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 border border-white/10 bg-white/5 rounded-none hover:border-white/30 hover:bg-white/10 text-[10px] font-sans flex items-center gap-1.5 active:scale-95 transition-all text-white/80"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
        </div>

        {/* Pivot Navigation header with Nokia style high-contrast look */}
        <div className="flex gap-4 border-b border-white/10 pb-1 mb-6">
          <button 
            onClick={() => setActivePivot('notifs')}
            className={`pb-1.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 ${
              activePivot === 'notifs' 
                ? `${getAccentText()} ${getAccentBorder()} font-black` 
                : 'text-white/40 border-transparent hover:text-white/75'
            }`}
          >
            Notifications
          </button>
          <button 
            onClick={() => setActivePivot('rules')}
            className={`pb-1.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 ${
              activePivot === 'rules' 
                ? `${getAccentText()} ${getAccentBorder()} font-black` 
                : 'text-white/40 border-transparent hover:text-white/75'
            }`}
          >
            Rules & Toggles
          </button>
          <button 
            onClick={() => setActivePivot('simulator')}
            className={`pb-1.5 text-xs font-bold tracking-widest uppercase transition-all border-b-2 ${
              activePivot === 'simulator' 
                ? `${getAccentText()} ${getAccentBorder()} font-black` 
                : 'text-white/40 border-transparent hover:text-white/75'
            }`}
          >
            Broadcast Sim
          </button>
        </div>

        {/* PIVOT SECTION 1: NOTIFICATIONS & QUICK TOGGLES */}
        {activePivot === 'notifs' && (
          <div className="space-y-6">
            
            {/* Quick settings toggles strip */}
            <div className="grid grid-cols-4 gap-2">
              {/* Wi-Fi */}
              <button 
                onClick={() => onUpdateSettings({ wifiConnected: !settings.wifiConnected })}
                className={`p-2 flex flex-col items-center justify-center gap-1 aspect-square rounded-none border transition-all active:scale-95 ${
                  settings.wifiConnected ? getAccentBg() : 'bg-white/5 border-white/10 text-white/50'
                }`}
                title="Wi-Fi Toggle"
              >
                <Wifi className="w-4 h-4" />
                <span className="text-[8px] font-bold tracking-wider uppercase">Wi-Fi</span>
              </button>

              {/* Bluetooth */}
              <button 
                onClick={() => onUpdateSettings({ bluetoothEnabled: !settings.bluetoothEnabled })}
                className={`p-2 flex flex-col items-center justify-center gap-1 aspect-square rounded-none border transition-all active:scale-95 ${
                  settings.bluetoothEnabled ? getAccentBg() : 'bg-white/5 border-white/10 text-white/50'
                }`}
                title="Bluetooth Toggle"
              >
                <Bluetooth className="w-4 h-4" />
                <span className="text-[8px] font-bold tracking-wider uppercase">BT</span>
              </button>

              {/* Airplane Mode */}
              <button 
                onClick={() => onUpdateSettings({ airplaneMode: !settings.airplaneMode })}
                className={`p-2 flex flex-col items-center justify-center gap-1 aspect-square rounded-none border transition-all active:scale-95 ${
                  settings.airplaneMode ? 'bg-amber-600 text-white border-transparent' : 'bg-white/5 border-white/10 text-white/50'
                }`}
                title="Airplane Mode Toggle"
              >
                <Plane className="w-4 h-4" />
                <span className="text-[8px] font-bold tracking-wider uppercase">PLANE</span>
              </button>

              {/* Flashlight */}
              <button 
                onClick={() => onUpdateSettings({ flashlightOn: !settings.flashlightOn })}
                className={`p-2 flex flex-col items-center justify-center gap-1 aspect-square rounded-none border transition-all active:scale-95 ${
                  settings.flashlightOn ? 'bg-yellow-500 text-black border-transparent' : 'bg-white/5 border-white/10 text-white/50'
                }`}
                title="Flashlight Toggle"
              >
                <Flashlight className="w-4 h-4" />
                <span className="text-[8px] font-bold tracking-wider uppercase">LIGHT</span>
              </button>
            </div>

            {/* Quick settings status summary bar */}
            <div className="flex justify-between items-center bg-white/5 px-3 py-2 border border-white/10">
              <span className="text-[10px] font-bold tracking-wider uppercase text-white/40">DND Quiet Hours</span>
              <button 
                onClick={() => onUpdateNotificationRules({ ...notificationRules, dndMode: !notificationRules.dndMode })}
                className={`px-3 py-1 text-[9px] font-bold tracking-widest uppercase border ${
                  notificationRules.dndMode 
                    ? 'bg-red-900/30 text-red-400 border-red-800' 
                    : 'bg-white/5 text-white/60 border-white/10 hover:border-white/30'
                }`}
              >
                {notificationRules.dndMode ? 'ACTIVE' : 'INACTIVE'}
              </button>
            </div>

            {/* Dynamic Metro flying progress bar indicator */}
            <div className="relative w-full h-1 bg-white/5 rounded-none overflow-hidden">
              <div className="absolute top-0 w-1.5 h-1.5 bg-[#00abec] rounded-none animate-[dot-fly_3s_infinite_linear]" style={{ animationDelay: '0s' }} />
              <div className="absolute top-0 w-1.5 h-1.5 bg-[#00abec] rounded-none animate-[dot-fly_3s_infinite_linear]" style={{ animationDelay: '0.2s' }} />
              <div className="absolute top-0 w-1.5 h-1.5 bg-[#00abec] rounded-none animate-[dot-fly_3s_infinite_linear]" style={{ animationDelay: '0.4s' }} />
            </div>

            {/* Notifications section */}
            <section className="space-y-4">
              <div className="flex justify-between items-baseline mb-2">
                <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest">Recent Notifications</h2>
                {notifications.length > 0 && (
                  <button 
                    onClick={onClearNotifications}
                    className="text-[10px] text-cyan-400 hover:underline hover:text-white uppercase tracking-wider font-bold"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center bg-white/5 border border-white/5 p-4">
                    <BellOff className="w-8 h-8 text-white/10 mb-2" />
                    <p className="text-xs text-white/40">All quiet. No new notifications.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className="group relative bg-white/5 hover:bg-white/10 border border-white/10 p-3.5 transition-all duration-200 border-l-4"
                      style={{ borderLeftColor: notif.appName === 'MESSAGES' ? '#ec4899' : notif.appName === 'OUTLOOK' ? '#3b82f6' : notif.appName === 'CALENDAR' ? '#84cc16' : '#f59e0b' }}
                    >
                      <div className="flex justify-between items-start gap-4 mb-1">
                        {/* Title & icon indicator */}
                        <div 
                          onClick={() => onNotificationClick(notif)}
                          className="flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-bold uppercase tracking-widest mb-1">
                            {notif.appName === 'MESSAGES' && <MessageSquare className="w-3 h-3 text-pink-500" />}
                            {notif.appName === 'OUTLOOK' && <Mail className="w-3 h-3 text-blue-400" />}
                            {notif.appName === 'CALENDAR' && <Calendar className="w-3 h-3 text-lime-500" />}
                            {notif.appName === 'SYSTEM' && <ShieldAlert className="w-3 h-3 text-yellow-500" />}
                            <span>{notif.appName}</span>
                          </div>
                          
                          <span className="font-bold text-sm text-white/95 line-clamp-1">{notif.title}</span>
                        </div>

                        {/* Individual dismiss action */}
                        <button 
                          onClick={() => onDeleteNotification(notif.id)}
                          className="text-white/30 hover:text-white hover:bg-white/10 p-1 rounded-none transition-colors"
                          title="Dismiss notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Text & click trigger */}
                      <div 
                        onClick={() => onNotificationClick(notif)}
                        className="cursor-pointer"
                      >
                        <p className="text-xs text-white/60 leading-relaxed line-clamp-2 pr-4">{notif.text}</p>
                        
                        <div className="flex justify-between items-center mt-2 pt-1 border-t border-white/5">
                          <span className="text-[9px] text-white/30">{notif.timestamp}</span>
                          {notif.intent && (
                            <span className="text-[8px] px-1 bg-white/10 text-white/60 font-mono tracking-wider uppercase">Action Pending</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* PIVOT SECTION 2: LISTENER CONFIG RULES */}
        {activePivot === 'rules' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 p-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">How listeners work</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Configure how different notification channels route payloads. Bypassing channels blocks audio synthesis haptic alerts or visual toast slide-downs.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-baseline mb-2">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Notification Channels</h3>
              </div>

              {Object.entries(notificationRules.channels).map(([appName, conf]: [string, any]) => (
                <div key={appName} className="bg-white/5 border border-white/10 p-4 space-y-3.5">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
                      {appName === 'MESSAGES' && <MessageSquare className="w-3.5 h-3.5 text-pink-500" />}
                      {appName === 'OUTLOOK' && <Mail className="w-3.5 h-3.5 text-blue-400" />}
                      {appName === 'CALENDAR' && <Calendar className="w-3.5 h-3.5 text-lime-500" />}
                      {appName === 'SYSTEM' && <ShieldAlert className="w-3.5 h-3.5 text-yellow-500" />}
                      {appName}
                    </span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => changeChannelPriority(appName, 'Normal')}
                        className={`px-2 py-0.5 text-[8px] font-bold uppercase ${
                          conf.priority === 'Normal' ? 'bg-cyan-500 text-black' : 'bg-white/5 text-white/40'
                        }`}
                      >
                        Normal
                      </button>
                      <button 
                        onClick={() => changeChannelPriority(appName, 'High')}
                        className={`px-2 py-0.5 text-[8px] font-bold uppercase ${
                          conf.priority === 'High' ? 'bg-amber-600 text-white' : 'bg-white/5 text-white/40'
                        }`}
                      >
                        High
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Sound Alert Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60 uppercase font-bold">Sound Alarm</span>
                      <button 
                        onClick={() => toggleChannelSetting(appName, 'sound')}
                        className={`w-10 h-5 border flex items-center transition-all ${
                          conf.sound 
                            ? `${getAccentBorder()} justify-end bg-white/5` 
                            : 'border-white/10 justify-start bg-black'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 mx-0.5 ${conf.sound ? getAccentBg() : 'bg-white/20'}`} />
                      </button>
                    </div>

                    {/* Toast Alert Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/60 uppercase font-bold">Toast Banner</span>
                      <button 
                        onClick={() => toggleChannelSetting(appName, 'toast')}
                        className={`w-10 h-5 border flex items-center transition-all ${
                          conf.toast 
                            ? `${getAccentBorder()} justify-end bg-white/5` 
                            : 'border-white/10 justify-start bg-black'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 mx-0.5 ${conf.toast ? getAccentBg() : 'bg-white/20'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PIVOT SECTION 3: BROADCAST SIMULATOR */}
        {activePivot === 'simulator' && (
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 p-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-pink-500 animate-pulse" />
                Push Notification Injection Console
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Simulate standard system notifications. They route to the notification listener, matching active channels and triggering sliding dynamic toast alerts.
              </p>
            </div>

            {/* Simulator Form */}
            <div className="space-y-3 bg-white/5 border border-white/10 p-4">
              
              {/* App Source */}
              <div>
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">AppName Source</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['MESSAGES', 'OUTLOOK', 'CALENDAR', 'SYSTEM'] as const).map((app) => (
                    <button 
                      key={app}
                      type="button"
                      onClick={() => {
                        setSimAppName(app);
                        if (app === 'MESSAGES') {
                          setSimTitle('Sarah Connor');
                          setSimText('Are we still meeting for lunch today?');
                          setSimIntentType('sms_sarah');
                        } else if (app === 'OUTLOOK') {
                          setSimTitle('Alex Rivera');
                          setSimText('Review of client dashboard layouts.');
                          setSimIntentType('mailto_alex');
                        } else if (app === 'CALENDAR') {
                          setSimTitle('Diner Lunch with Sarah');
                          setSimText('Scheduled for 12:30 PM at Central Diner');
                          setSimIntentType('open_calendar');
                        } else {
                          setSimTitle('Low Storage Warning');
                          setSimText('Nokia Lumia storage is almost full.');
                          setSimIntentType('none');
                        }
                      }}
                      className={`py-1.5 text-[8px] font-bold tracking-wider rounded-none uppercase transition-all ${
                        simAppName === app 
                          ? 'bg-zinc-800 text-white border border-white/30' 
                          : 'bg-zinc-950 text-white/50 border border-white/5 hover:text-white'
                      }`}
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender Name / Title */}
              <div>
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Title / Sender</label>
                <input 
                  type="text" 
                  value={simTitle}
                  onChange={(e) => setSimTitle(e.target.value)}
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:border-white/30 focus:outline-none text-white font-sans rounded-none"
                />
              </div>

              {/* Text / Message */}
              <div>
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Notification Body</label>
                <textarea 
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  rows={2}
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:border-white/30 focus:outline-none text-white font-sans rounded-none resize-none"
                />
              </div>

              {/* Attached Intent Action Mapping */}
              <div>
                <label className="block text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Attach Intent Action Payload</label>
                <select 
                  value={simIntentType}
                  onChange={(e) => setSimIntentType(e.target.value)}
                  className="w-full bg-black border border-white/10 px-3 py-2 text-xs focus:border-white/30 focus:outline-none text-white font-sans rounded-none"
                >
                  <option value="none">No Intent payload (standard application route)</option>
                  <option value="sms_sarah">android.intent.action.SENDTO (sms:sarah chat)</option>
                  <option value="mailto_alex">android.intent.action.SENDTO (mailto:alex email draft)</option>
                  <option value="play_music">android.intent.action.PLAY_MUSIC (spotify: After Hours)</option>
                  <option value="open_calendar">custom.intent.action.LAUNCH (calendar app)</option>
                  <option value="view_google">android.intent.action.VIEW (web: https://google.com)</option>
                </select>
              </div>

              {/* Broadcast Action Button */}
              <button 
                type="button"
                onClick={handleSimulateBroadcast}
                className="w-full py-3 mt-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-mono font-bold tracking-widest uppercase border border-zinc-700 hover:border-zinc-500 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 text-pink-400" />
                Broadcast Push Alert
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Brand Watermark footer */}
      <div className="pt-10 pointer-events-none opacity-5 select-none font-sans mt-auto">
        <h3 className="text-5xl font-black uppercase tracking-tighter leading-none">CLEAN<br/>DESK</h3>
      </div>
    </div>
  );
}
