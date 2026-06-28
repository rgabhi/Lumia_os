import React, { useState, useEffect, useRef } from 'react';
import { Wifi, Battery, Menu, Search, Circle, ArrowLeft, Grid, MessageSquare, Mail, Calendar, ShieldAlert } from 'lucide-react';
import { 
  Contact, Chat, Message, Email, CalendarEvent, Photo, CallLog, NotificationItem, Song, SystemSettings, Intent, TileConfig
} from './types';
import { 
  INITIAL_CONTACTS, INITIAL_CHATS, INITIAL_EMAILS, INITIAL_EVENTS, 
  INITIAL_PHOTOS, INITIAL_CALL_LOGS, INITIAL_NOTIFICATIONS, 
  SYSTEM_PLAYLIST, DEFAULT_SETTINGS, METRO_THEMES, DEFAULT_TILES 
} from './data';

// Component Imports
import LockScreen from './components/LockScreen';
import QuickSettings from './components/QuickSettings';
import LiveTiles from './components/LiveTiles';
import AllApps from './components/AllApps';

// App Simulator Imports
import PhoneApp from './components/apps/PhoneApp';
import MessagesApp from './components/apps/MessagesApp';
import SpotifyApp from './components/apps/SpotifyApp';
import WeatherApp from './components/apps/WeatherApp';
import CalendarApp from './components/apps/CalendarApp';
import OutlookApp from './components/apps/OutlookApp';
import SettingsApp from './components/apps/SettingsApp';
import PhotosApp from './components/apps/PhotosApp';
import CameraApp from './components/apps/CameraApp';
import BrowserApp from './components/apps/BrowserApp';
import IntentRouterApp from './components/apps/IntentRouterApp';

export default function App() {
  // --- Persistent Storage State initialization ---
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem('metro_is_locked');
    return saved ? JSON.parse(saved) : true;
  });

  const [currentView, setCurrentView] = useState<'tiles' | 'all-apps' | 'action-center' | string>(() => {
    return localStorage.getItem('metro_current_view') || 'tiles';
  });

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('metro_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('metro_chats');
    return saved ? JSON.parse(saved) : INITIAL_CHATS;
  });

  const [emails, setEmails] = useState<Email[]>(() => {
    const saved = localStorage.getItem('metro_emails');
    return saved ? JSON.parse(saved) : INITIAL_EMAILS;
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('metro_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [photos, setPhotos] = useState<Photo[]>(() => {
    const saved = localStorage.getItem('metro_photos');
    return saved ? JSON.parse(saved) : INITIAL_PHOTOS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('metro_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);

  const [notificationRules, setNotificationRules] = useState(() => {
    const saved = localStorage.getItem('metro_notif_rules');
    return saved ? JSON.parse(saved) : {
      dndMode: false,
      channels: {
        MESSAGES: { sound: true, toast: true, priority: 'Normal' },
        CALENDAR: { sound: true, toast: true, priority: 'Normal' },
        SYSTEM: { sound: true, toast: true, priority: 'High' },
        OUTLOOK: { sound: true, toast: true, priority: 'Normal' }
      }
    };
  });

  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    const saved = localStorage.getItem('metro_call_logs');
    return saved ? JSON.parse(saved) : INITIAL_CALL_LOGS;
  });

  const [intentLogs, setIntentLogs] = useState<Intent[]>(() => {
    const saved = localStorage.getItem('metro_intent_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeIntent, setActiveIntent] = useState<Intent | null>(() => {
    const saved = localStorage.getItem('metro_active_intent');
    return saved ? JSON.parse(saved) : null;
  });

  const [tiles, setTiles] = useState<TileConfig[]>(() => {
    const saved = localStorage.getItem('metro_live_tiles');
    return saved ? JSON.parse(saved) : DEFAULT_TILES;
  });

  const [isEditMode, setIsEditMode] = useState(false);

  // --- Spotify Web Audio Synth State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSong, setActiveSong] = useState<Song | null>(SYSTEM_PLAYLIST[0]);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Audio nodes and interval references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentNoteRef = useRef(0);

  // --- Save states to localStorage ---
  useEffect(() => {
    localStorage.setItem('metro_is_locked', JSON.stringify(isLocked));
  }, [isLocked]);

  useEffect(() => {
    localStorage.setItem('metro_current_view', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('metro_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('metro_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('metro_emails', JSON.stringify(emails));
  }, [emails]);

  useEffect(() => {
    localStorage.setItem('metro_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('metro_photos', JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    localStorage.setItem('metro_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('metro_notif_rules', JSON.stringify(notificationRules));
  }, [notificationRules]);

  useEffect(() => {
    localStorage.setItem('metro_call_logs', JSON.stringify(callLogs));
  }, [callLogs]);

  useEffect(() => {
    localStorage.setItem('metro_intent_logs', JSON.stringify(intentLogs));
  }, [intentLogs]);

  useEffect(() => {
    localStorage.setItem('metro_active_intent', JSON.stringify(activeIntent));
  }, [activeIntent]);

  useEffect(() => {
    localStorage.setItem('metro_live_tiles', JSON.stringify(tiles));
  }, [tiles]);

  // --- Haptic/Click Sound Service ---
  const playHapticSound = (freq = 800, dur = 0.05, type: OscillatorType = 'sine') => {
    if (!settings.soundEnabled) return;
    try {
      const audioCtx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtxRef.current) audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + dur + 0.01);
    } catch (e) {
      console.warn('AudioContext not allowed or ready', e);
    }
  };

  // --- Web Audio Synth Loop ---
  const playSynthLoop = (song: Song) => {
    stopSynthLoop();
    if (!settings.soundEnabled) return;

    try {
      const audioCtx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioCtxRef.current) audioCtxRef.current = audioCtx;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const notes = song.notes || [261, 293, 329, 349, 392];
      currentNoteRef.current = 0;

      // Play note sequence
      synthIntervalRef.current = setInterval(() => {
        if (audioCtx.state === 'suspended') return;

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        // Alternate waves for a rich classic sound
        osc.type = currentNoteRef.current % 2 === 0 ? 'triangle' : 'sine';
        
        const noteFreq = notes[currentNoteRef.current % notes.length];
        osc.frequency.setValueAtTime(noteFreq, audioCtx.currentTime);

        // Ambient, soothing low volume
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.45);

        currentNoteRef.current += 1;
      }, 450);

    } catch (e) {
      console.warn('Synth loop audio context error', e);
    }
  };

  const stopSynthLoop = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  // Music progress timer
  useEffect(() => {
    if (isPlaying && activeSong) {
      playSynthLoop(activeSong);
      progressIntervalRef.current = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            // Loop back or play next song
            const nextIdx = (SYSTEM_PLAYLIST.findIndex(s => s.id === activeSong.id) + 1) % SYSTEM_PLAYLIST.length;
            setActiveSong(SYSTEM_PLAYLIST[nextIdx]);
            return 0;
          }
          return prev + (100 / activeSong.duration);
        });
      }, 1000);
    } else {
      stopSynthLoop();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }

    return () => {
      stopSynthLoop();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, activeSong]);

  const handlePlaySong = (song: Song) => {
    playHapticSound(600, 0.08);
    setActiveSong(song);
    setPlaybackProgress(0);
    setIsPlaying(true);
  };

  const handleTogglePlaySpotify = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // prevent launching app from play button click
    playHapticSound(600, 0.08);
    setIsPlaying(prev => !prev);
  };

  const handleProgressChange = (val: number) => {
    setPlaybackProgress(val);
  };

  // --- Messenger replies simulator engine ---
  const handleSendMessage = (contactId: string, text: string) => {
    playHapticSound(900, 0.05, 'triangle');

    // 1. Add user message
    const userMsg: Message = {
      id: 'msg-user-' + Date.now(),
      senderId: 'user',
      senderName: 'Me',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChats(prev => prev.map(chat => {
      if (chat.contactId === contactId) {
        return {
          ...chat,
          messages: [...chat.messages, userMsg]
        };
      }
      return chat;
    }));

    // 2. Schedule smart chatbot response with notification
    setTimeout(() => {
      let replyText = "Understood. Talk to you soon!";
      const contactName = INITIAL_CONTACTS.find(c => c.id === contactId)?.name || 'Sarah Connor';

      if (contactId === 'sarah') {
        replyText = "Awesome! I am already at the Central Diner, ordered coffee. See you in a bit! ☕";
      } else if (contactId === 'alex') {
        replyText = "Superb. I am finalizing the tile grids right now. Let me know if we need to sync.";
      } else if (contactId === 'design_team') {
        replyText = "3 new assets synchronized in the workspace! Check out the updated theme previews.";
      }

      const botMsg: Message = {
        id: 'msg-bot-' + Date.now(),
        senderId: contactId,
        senderName: contactName,
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChats(prev => prev.map(chat => {
        if (chat.contactId === contactId) {
          return {
            ...chat,
            unreadCount: chat.unreadCount + 1,
            messages: [...chat.messages, botMsg]
          };
        }
        return chat;
      }));

      // Add to notifications with inter-app intent action
      addNotification({
        title: contactName,
        text: replyText,
        appName: 'MESSAGES',
        sender: contactName,
        intent: {
          action: 'android.intent.action.SENDTO',
          data: `sms:${contactId}`,
          extras: { recipient: contactName }
        }
      });

    }, 2000);
  };

  // --- Email Outlook simulation engine ---
  const handleMarkEmailRead = (emailId: string) => {
    setEmails(prev => prev.map(email => {
      if (email.id === emailId) {
        return { ...email, read: true };
      }
      return email;
    }));
  };

  const handleComposeEmail = (recipient: string, subject: string, body: string) => {
    playHapticSound(900, 0.05);
    const newEmail: Email = {
      id: 'email-' + Date.now(),
      sender: recipient, // for sandbox, let recipient compose back to you
      subject,
      body,
      timestamp: 'Just now',
      read: false,
      category: 'general'
    };
    setEmails(prev => [newEmail, ...prev]);

    // Also add to notifications using unified listener engine
    addNotification({
      title: recipient,
      text: subject,
      appName: 'OUTLOOK',
      intent: {
        action: 'android.intent.action.SENDTO',
        data: `mailto:${recipient.toLowerCase().replace(/\s+/g, '')}@lumia.net`,
        extras: { recipient, subject }
      }
    });
  };

  // --- Calendar Event schedules ---
  const handleAddCalendarEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    playHapticSound(800, 0.08);
    const event: CalendarEvent = {
      id: 'event-' + Date.now(),
      ...newEvent
    };
    setEvents(prev => [...prev, event]);

    // Add to notifications using unified listener engine
    addNotification({
      title: 'Calendar Scheduled',
      text: `${event.title} at ${event.time}`,
      appName: 'CALENDAR',
      intent: {
        action: 'custom.intent.action.LAUNCH',
        data: 'calendar'
      }
    });
  };

  // --- Camera Roll photos ---
  const handleCapturePhoto = (newPhoto: Photo) => {
    setPhotos(prev => [newPhoto, ...prev]);
  };

  const handleDeletePhoto = (photoId: string) => {
    playHapticSound(400, 0.15);
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  // --- General System Settings ---
  const handleUpdateSettings = (updates: Partial<SystemSettings>) => {
    playHapticSound(750, 0.05);
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const handleResetData = () => {
    playHapticSound(250, 0.4);
    setChats(INITIAL_CHATS);
    setEmails(INITIAL_EMAILS);
    setEvents(INITIAL_EVENTS);
    setPhotos(INITIAL_PHOTOS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSettings(DEFAULT_SETTINGS);
    setIntentLogs([]);
    setActiveIntent(null);
    setIsLocked(true);
    setCurrentView('tiles');
  };

  // --- Intent Resolution Routing Engine ---
  const handleBroadcastIntent = (intentInput: Omit<Intent, 'id' | 'timestamp'>) => {
    playHapticSound(800, 0.1, 'triangle');
    const newIntent: Intent = {
      ...intentInput,
      id: 'intent-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    let resolvedApp = 'browser';
    const action = newIntent.action;
    const data = newIntent.data || '';
    const mime = newIntent.type || '';

    if (action === 'android.intent.action.DIAL') {
      resolvedApp = 'phone';
    } else if (action === 'android.intent.action.SENDTO') {
      if (data.startsWith('sms:')) {
        resolvedApp = 'messages';
      } else if (data.startsWith('mailto:')) {
        resolvedApp = 'outlook';
      } else {
        resolvedApp = 'messages';
      }
    } else if (action === 'android.intent.action.SEND') {
      if (mime.startsWith('image/')) {
        resolvedApp = 'outlook';
      } else {
        resolvedApp = 'messages';
      }
    } else if (action === 'android.intent.action.PLAY_MUSIC') {
      resolvedApp = 'spotify';
    } else if (action === 'android.intent.action.VIEW') {
      if (data.startsWith('tel:')) {
        resolvedApp = 'phone';
      } else if (data.startsWith('sms:')) {
        resolvedApp = 'messages';
      } else if (data.startsWith('mailto:')) {
        resolvedApp = 'outlook';
      } else if (data.startsWith('content://media/photos')) {
        resolvedApp = 'photos';
      } else if (data.startsWith('http:') || data.startsWith('https:') || data.startsWith('geo:') || data.startsWith('metro:')) {
        resolvedApp = 'browser';
      }
    } else if (action === 'android.media.action.IMAGE_CAPTURE' || action === 'android.intent.action.IMAGE_CAPTURE') {
      resolvedApp = 'camera';
    } else if (action === 'custom.intent.action.LAUNCH') {
      resolvedApp = data || 'settings';
    }

    newIntent.resolvedApp = resolvedApp;
    setIntentLogs(prev => [newIntent, ...prev]);
    setActiveIntent(newIntent);
    setCurrentView(resolvedApp);
  };

  const handleClearActiveIntent = () => {
    setActiveIntent(null);
  };

  const addNotification = (notifInput: Omit<NotificationItem, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => {
    const channel = notifInput.appName;
    const rules = notificationRules.channels[channel] || { sound: true, toast: true, priority: 'Normal' };

    const newNotif: NotificationItem = {
      id: notifInput.id || 'notif-' + Date.now(),
      title: notifInput.title,
      text: notifInput.text,
      timestamp: notifInput.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      appName: channel,
      sender: notifInput.sender,
      intent: notifInput.intent
    };

    setNotifications(prev => [newNotif, ...prev]);

    // Respect Do Not Disturb rules unless High Priority
    if (notificationRules.dndMode && rules.priority !== 'High') {
      return;
    }

    // Play specific sound frequencies per channel for authentic device feel
    if (rules.sound && settings.soundEnabled) {
      if (channel === 'MESSAGES') {
        playHapticSound(520, 0.2, 'triangle');
      } else if (channel === 'SYSTEM') {
        playHapticSound(720, 0.25, 'sine');
      } else if (channel === 'CALENDAR') {
        playHapticSound(640, 0.15, 'sawtooth');
      } else if (channel === 'OUTLOOK') {
        playHapticSound(480, 0.15, 'sine');
      } else {
        playHapticSound(600, 0.1, 'sine');
      }
    }

    // Display sliding toast if allowed
    if (rules.toast) {
      setActiveToast(newNotif);
    }
  };

  const handleDeleteNotification = (id: string) => {
    playHapticSound(400, 0.05);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    playHapticSound(800, 0.08, 'sine');
    if (notif.intent) {
      handleBroadcastIntent(notif.intent);
    } else {
      // Fallback: route to its logical app
      if (notif.appName === 'MESSAGES') {
        setCurrentView('messages');
      } else if (notif.appName === 'OUTLOOK') {
        setCurrentView('outlook');
      } else if (notif.appName === 'CALENDAR') {
        setCurrentView('calendar');
      } else {
        setCurrentView('settings');
      }
    }
    // Windows Phone style: delete upon tapping
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
  };

  // Auto-dismiss active toast banner after a short duration
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // --- Actions ---
  const handleClearNotifications = () => {
    playHapticSound(450, 0.1);
    setNotifications([]);
  };

  // Count unreads
  const totalUnreadMsgs = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
  const totalUnreadMails = emails.filter(e => !e.read).length;
  const totalMissedCalls = callLogs.filter(c => c.type === 'missed').length;

  const lastMsgObj = chats.find(c => c.unreadCount > 0)?.messages.slice(-1)[0];
  const lastMessageText = lastMsgObj ? `${lastMsgObj.senderName}: "${lastMsgObj.text}"` : '';

  // Navigation button actions
  const handleBackNavigation = () => {
    playHapticSound(800, 0.05);
    if (currentView === 'tiles') {
      setIsLocked(true);
    } else if (currentView === 'all-apps') {
      setCurrentView('tiles');
    } else {
      // Is an open app viewport
      setCurrentView('tiles');
    }
  };

  const handleHomeNavigation = () => {
    playHapticSound(600, 0.08, 'triangle');
    if (isLocked) {
      setIsLocked(false);
    } else {
      setCurrentView('tiles');
    }
  };

  const handleSearchNavigation = () => {
    playHapticSound(800, 0.05);
    if (isLocked) {
      setIsLocked(false);
    }
    setCurrentView('browser');
  };

  const handleLaunchApp = (appId: string) => {
    playHapticSound(720, 0.08);
    // Clear notifications for that app if opened
    if (appId === 'messages') {
      setChats(prev => prev.map(c => ({ ...c, unreadCount: 0 })));
    }
    
    // Redirect web-based store apps via intent view
    if (appId === 'paint') {
      handleBroadcastIntent({ action: 'android.intent.action.VIEW', data: 'metro://paint' });
      return;
    }
    if (appId === 'calculator') {
      handleBroadcastIntent({ action: 'android.intent.action.VIEW', data: 'metro://calculator' });
      return;
    }
    if (appId === 'maps') {
      handleBroadcastIntent({ action: 'android.intent.action.VIEW', data: 'metro://maps' });
      return;
    }
    if (appId === 'retro-games') {
      handleBroadcastIntent({ action: 'android.intent.action.VIEW', data: 'metro://retro-games' });
      return;
    }

    setCurrentView(appId);
  };

  // Render open application screen content
  const renderAppContent = () => {
    const theme = METRO_THEMES[settings.accentColor];
    
    switch (currentView) {
      case 'phone':
        return (
          <PhoneApp 
            onClose={() => setCurrentView('tiles')} 
            accentClass={theme.bgClass} 
            activeIntent={activeIntent}
            onClearActiveIntent={handleClearActiveIntent}
            onSendIntent={handleBroadcastIntent}
          />
        );
      case 'messages':
        return (
          <MessagesApp 
            onClose={() => setCurrentView('tiles')} 
            accentClass={theme.bgClass} 
            chats={chats}
            onSendMessage={handleSendMessage}
            activeIntent={activeIntent}
            onClearActiveIntent={handleClearActiveIntent}
            onSendIntent={handleBroadcastIntent}
          />
        );
      case 'spotify':
        return (
          <SpotifyApp 
            onClose={() => setCurrentView('tiles')} 
            accentClass={theme.bgClass}
            accentHex={theme.accentHex}
            activeSong={activeSong}
            isPlaying={isPlaying}
            onPlaySong={handlePlaySong}
            onPauseSong={() => setIsPlaying(false)}
            onTogglePlay={handleTogglePlaySpotify}
            playbackProgress={playbackProgress}
            onProgressChange={handleProgressChange}
            activeIntent={activeIntent}
            onClearActiveIntent={handleClearActiveIntent}
          />
        );
      case 'weather':
        return <WeatherApp onClose={() => setCurrentView('tiles')} accentClass={theme.bgClass} />;
      case 'calendar':
        return (
          <CalendarApp 
            onClose={() => setCurrentView('tiles')} 
            accentClass={theme.bgClass} 
            events={events}
            onAddEvent={handleAddCalendarEvent}
          />
        );
      case 'outlook':
        return (
          <OutlookApp 
            onClose={() => setCurrentView('tiles')} 
            accentClass={theme.bgClass} 
            emails={emails}
            onMarkRead={handleMarkEmailRead}
            onComposeEmail={handleComposeEmail}
            activeIntent={activeIntent}
            onClearActiveIntent={handleClearActiveIntent}
            onSendIntent={handleBroadcastIntent}
          />
        );
      case 'settings':
        return (
          <SettingsApp 
            onClose={() => setCurrentView('tiles')} 
            accentClass={theme.bgClass} 
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetData={handleResetData}
          />
        );
      case 'photos':
        return (
          <PhotosApp 
            onClose={() => setCurrentView('tiles')} 
            accentClass={theme.bgClass} 
            photos={photos}
            onSetWallpaper={(url) => handleUpdateSettings({ lockscreenWallpaper: url })}
            onDeletePhoto={handleDeletePhoto}
            activeIntent={activeIntent}
            onClearActiveIntent={handleClearActiveIntent}
            onSendIntent={handleBroadcastIntent}
          />
        );
      case 'camera':
        return (
          <CameraApp 
            onClose={() => setCurrentView('tiles')} 
            accentClass={theme.bgClass} 
            onCapturePhoto={handleCapturePhoto}
            soundEnabled={settings.soundEnabled}
          />
        );
      case 'browser':
        return (
          <BrowserApp 
            onClose={() => setCurrentView('tiles')} 
            accentClass={theme.bgClass} 
            activeIntent={activeIntent}
            onClearActiveIntent={handleClearActiveIntent}
            onSendIntent={handleBroadcastIntent}
            tiles={tiles}
            onUpdateTiles={setTiles}
            playHapticSound={playHapticSound}
            settings={settings}
            onCapturePhoto={handleCapturePhoto}
          />
        );
      case 'intent-router':
        return (
          <IntentRouterApp 
            onClose={() => setCurrentView('tiles')} 
            accentClass={theme.bgClass} 
            intentLogs={intentLogs}
            onClearLogs={() => setIntentLogs([])}
            onBroadcastIntent={handleBroadcastIntent}
          />
        );
      default:
        return null;
    }
  };

  const themeAccent = METRO_THEMES[settings.accentColor];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#e2e2e2] flex items-center justify-center p-0 md:p-6 select-none overflow-x-hidden font-sans">
      
      {/* 
        TAILWIND INJECTED STYLES FOR METRO PROGRESS AND ANIMATIONS 
        This is necessary for standard classic fade animations since we are doing 0px border curves
      */}
      <style>{`
        @keyframes dot-fly {
          0% { left: -10%; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: 110%; opacity: 0; }
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: scale(0.98); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes slideUpFade {
          0% { transform: translateY(24px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          0% { transform: translateY(-30px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* --- PHONE DEVICE CHASSIS SHELL (Responsive: Floating on desktop, fullscreen on mobile) --- */}
      <div className="relative w-full max-w-[430px] h-[100dvh] md:h-[880px] bg-black shadow-[0_30px_70px_rgba(0,0,0,0.95)] flex flex-col justify-between overflow-hidden md:border-[12px] md:border-zinc-800 md:rounded-[16px] border-zinc-900">
        
        {/* Physical Front Camera Notch / Speaker Grill for Premium Craftsmanship (Desktop only) */}
        <div className="hidden md:flex absolute top-0 inset-x-0 h-6 bg-black z-[100] items-center justify-center">
          <div className="w-20 h-1 bg-zinc-900 rounded-full mb-1.5" />
          <div className="w-3.5 h-3.5 bg-zinc-950 border border-zinc-900 rounded-full absolute right-24 top-1" />
        </div>

        {/* --- DEVICE SCREEN CONTAINER --- */}
        <div className="flex-1 relative flex flex-col justify-between bg-[#0A0A0A] md:rounded-none overflow-hidden min-h-0">
          
          {/* 1. LOCK SCREEN PORTAL (Z-INDEX 60) */}
          {isLocked && (
            <LockScreen 
              settings={settings}
              unreadMsgs={totalUnreadMsgs}
              unreadMails={totalUnreadMails}
              missedCalls={totalMissedCalls}
              onUnlock={() => {
                playHapticSound(500, 0.15, 'sine');
                setIsLocked(false);
              }}
            />
          )}

          {/* 2. LIVE TOGGLES ACTION CENTER DRAWER (Z-INDEX 75 overlay) */}
          {currentView === 'action-center' && (
            <QuickSettings 
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              notifications={notifications}
              onClearNotifications={handleClearNotifications}
              onClose={() => setCurrentView('tiles')}
              notificationRules={notificationRules}
              onUpdateNotificationRules={setNotificationRules}
              onAddNotification={addNotification}
              onDeleteNotification={handleDeleteNotification}
              onNotificationClick={handleNotificationClick}
              onBroadcastIntent={handleBroadcastIntent}
            />
          )}

          {/* 3. DYNAMIC TOAST BANNER (Z-INDEX 50 overlay) */}
          {!isLocked && activeToast && currentView !== 'action-center' && (
            <div 
              onClick={() => {
                handleNotificationClick(activeToast);
                setActiveToast(null);
              }}
              className="absolute top-14 inset-x-3 bg-zinc-900 border-l-4 shadow-[0_15px_30px_rgba(0,0,0,0.85)] p-3 z-50 flex items-center justify-between cursor-pointer animate-[slideDown_0.22s_ease-out] hover:bg-zinc-850"
              style={{ borderLeftColor: themeAccent.hex }}
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-white" style={{ backgroundColor: themeAccent.hex }}>
                  {activeToast.appName === 'MESSAGES' && <MessageSquare className="w-4 h-4" />}
                  {activeToast.appName === 'OUTLOOK' && <Mail className="w-4 h-4" />}
                  {activeToast.appName === 'CALENDAR' && <Calendar className="w-4 h-4" />}
                  {activeToast.appName === 'SYSTEM' && <ShieldAlert className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black text-white/40 tracking-widest uppercase mb-0.5 leading-none">{activeToast.appName}</p>
                  <p className="text-xs font-bold text-white truncate leading-none mb-1">{activeToast.title}</p>
                  <p className="text-xs text-white/70 truncate leading-tight">{activeToast.text}</p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveToast(null);
                }}
                className="p-2 text-white/30 hover:text-white hover:bg-white/5 transition-colors self-start ml-2"
              >
                <span className="text-xs font-bold font-sans">✕</span>
              </button>
            </div>
          )}

          {/* --- ACTIVE SYSTEM BAR / STATUS HEADER --- */}
          {!isLocked && currentView !== 'action-center' && (
            <header 
              onClick={() => setCurrentView('action-center')}
              className="absolute top-0 inset-x-0 h-12 flex justify-between items-end px-6 pb-1.5 z-40 bg-[#0A0A0A]/40 backdrop-blur-md cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-white/80">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17 5H21V19H17V5ZM11 9H15V19H11V9ZM5 13H9V19H5V13Z" />
                </svg>
                <span className="text-[10px] tracking-wide opacity-80">{settings.carrierName}</span>
              </div>
              
              {/* Dynamic Status Bar Indicators */}
              <div className="flex items-center gap-3 text-white/70">
                {!settings.airplaneMode && settings.wifiConnected && (
                  <Wifi className="w-3.5 h-3.5 text-white/80" />
                )}
                {isPlaying && (
                  <span className="text-[9px] font-mono font-bold text-green-400 tracking-widest animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                    PLAYING
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Battery className="w-4 h-4" />
                  <span className="text-[10px] font-mono">10:45</span>
                </div>
              </div>
            </header>
          )}

          {/* --- MAIN OPERATING VIEWPORT PORTAL --- */}
          <div className="flex-1 flex flex-col justify-between min-h-0 relative">
            
            {/* If an app is running, render inside a clean full app container */}
            {!isLocked && currentView !== 'tiles' && currentView !== 'all-apps' && currentView !== 'action-center' ? (
              <div className="absolute inset-0 pt-12 pb-16 z-30 bg-[#0A0A0A]">
                {renderAppContent()}
              </div>
            ) : null}

            {/* A. HOMESCREEN LIVE TILES VIEWPORT */}
            {!isLocked && currentView === 'tiles' && (
              <div className="flex-1 flex flex-col min-h-0 pt-14 pb-16 overflow-y-auto no-scrollbar">
                
                {/* Horizontal Pivot Top Nav (START / ALL APPS toggle) */}
                <nav className="flex items-end justify-between px-6 h-16 bg-transparent pb-2.5 select-none border-b border-white/5 mb-3">
                  <div className="flex gap-6 items-baseline">
                    <button 
                      className={`text-2xl uppercase font-light leading-none tracking-wider transition-all ${
                        currentView === 'tiles' ? 'text-white font-medium' : 'text-white/40 scale-90'
                      }`}
                    >
                      Start
                    </button>
                    <button 
                      onClick={() => handleLaunchApp('all-apps')}
                      className="text-2xl uppercase font-light leading-none tracking-wider text-white/40 scale-90 hover:text-white transition-all"
                    >
                      All Apps
                    </button>
                  </div>
                  
                  {/* Pull down indicators */}
                  <button 
                    onClick={() => setCurrentView('action-center')}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                    title="Action Center"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </nav>

                {/* The Responsive Grid content */}
                <LiveTiles 
                  settings={settings}
                  unreadMsgs={totalUnreadMsgs}
                  lastMessageText={lastMessageText}
                  unreadMails={totalUnreadMails}
                  events={events}
                  capturedPhotos={photos.map(p => p.url)}
                  activeSong={activeSong}
                  isPlaying={isPlaying}
                  onLaunchApp={handleLaunchApp}
                  onTogglePlaySpotify={handleTogglePlaySpotify}
                  tiles={tiles}
                  onUpdateTiles={setTiles}
                  isEditMode={isEditMode}
                  onSetEditMode={setIsEditMode}
                  playHapticSound={playHapticSound}
                />
              </div>
            )}

            {/* B. ALL APPS VIEWPORT */}
            {!isLocked && currentView === 'all-apps' && (
              <div className="flex-1 flex flex-col min-h-0 relative">
                {/* Fixed pivot nav for All Apps */}
                <nav className="absolute top-14 inset-x-0 h-16 bg-transparent flex items-end px-6 pb-2.5 z-40 select-none border-b border-white/5">
                  <div className="flex gap-6 items-baseline">
                    <button 
                      onClick={() => {
                        playHapticSound(800, 0.05);
                        setCurrentView('tiles');
                      }}
                      className="text-2xl uppercase font-light leading-none tracking-wider text-white/40 scale-90 hover:text-white transition-all"
                    >
                      Start
                    </button>
                    <button 
                      className={`text-2xl uppercase font-light leading-none tracking-wider transition-all ${
                        currentView === 'all-apps' ? 'text-white font-medium' : 'text-white/40 scale-90'
                      }`}
                    >
                      All Apps
                    </button>
                  </div>
                </nav>

                <AllApps 
                  onLaunchApp={handleLaunchApp} 
                  onNavigateHome={() => setCurrentView('tiles')} 
                  accentColor={themeAccent.accentHex}
                  tiles={tiles}
                />
              </div>
            )}

          </div>

          {/* --- PHYSICAL CAPACITIVE NAVIGATION BAR KEYS --- */}
          <footer className="h-16 bg-black border-t border-white/5 flex justify-around items-center py-2 z-40">
            {/* BACK BUTTON */}
            <button 
              onClick={handleBackNavigation}
              className="flex flex-col items-center justify-center p-4 text-white/50 hover:text-white transition-all active:scale-90"
              title="Back"
            >
              <ArrowLeft className="w-5.5 h-5.5 stroke-[2]" />
            </button>
            
            {/* WINDOWS HOME BUTTON (Classic 4-Squares Grid Logo) */}
            <button 
              onClick={handleHomeNavigation}
              className="flex flex-col items-center justify-center p-4 text-white/70 hover:text-white transition-all active:scale-90"
              title="Home"
            >
              <Grid className="w-5.5 h-5.5 stroke-[2]" />
            </button>
            
            {/* SEARCH BUTTON */}
            <button 
              onClick={handleSearchNavigation}
              className="flex flex-col items-center justify-center p-4 text-white/50 hover:text-white transition-all active:scale-90"
              title="Search"
            >
              <Search className="w-5.5 h-5.5 stroke-[2]" />
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
}
