export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  status: string;
}

export interface Message {
  id: string;
  senderId: 'user' | string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface Chat {
  contactId: string;
  unreadCount: number;
  messages: Message[];
}

export interface Email {
  id: string;
  sender: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  category: 'messages' | 'calendar' | 'system' | 'general';
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location?: string;
}

export interface Photo {
  id: string;
  url: string;
  date: string;
  isUserCaptured?: boolean;
}

export interface CallLog {
  id: string;
  name: string;
  phone: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  duration?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  text: string;
  timestamp: string;
  appName: 'MESSAGES' | 'CALENDAR' | 'SYSTEM' | 'OUTLOOK';
  sender?: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  notes?: number[]; // frequencies for synthesis
}

export type AccentColor = 'cyan' | 'magenta' | 'lime' | 'orange' | 'purple';

export interface SystemSettings {
  accentColor: AccentColor;
  carrierName: string;
  lockscreenWallpaper: string;
  soundEnabled: boolean;
  airplaneMode: boolean;
  bluetoothEnabled: boolean;
  flashlightOn: boolean;
  wifiConnected: boolean;
}
