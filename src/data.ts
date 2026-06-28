import { Contact, Chat, Email, CalendarEvent, Photo, CallLog, NotificationItem, Song, SystemSettings } from './types';

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'sarah',
    name: 'Sarah Connor',
    phone: '+1 (555) 019-2834',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzFSlSwX6Y_kchU_CkGp3jcae16k3Kz_SO_vRprm0uKTadYZcf0l_pyofZ3rWnblCDEhrILg4US3kz5PVyoNevr5FmSvLtPefJkuZoVL3Hv1Zzk9HGXbln0pI11VYxRFaGzJoBQfTpiKSy0TY-AlN-2G8iJPU1MpeyAEUfsTeoezLMRPeMwHLOTCTBSffHiJfEJSXUbDxZ1W5yI4qgMow7YrIedFhVwA0D74E7V_pt2He8cn_hVkjAYzq9a3ADbs3LlwoHuFVi19ZV',
    status: 'Busy'
  },
  {
    id: 'alex',
    name: 'Alex Rivera',
    phone: '+1 (555) 014-9842',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDa_Uwu6E9qnuv5U4G8oaZtm7afrOZW2d7-xBXoPPAP6CYGRrmTbsRgw7IuUuzD8HWknR-ejU7k_P0VpHb2qDDwBohnLH3y_naAkiaYUKZYX_8PNFBTucrVOWcSvF0EIa3iRLPzfnltMCZSM8CrD6KYiEAPKUFETddbFRVQie-bfMg5cbomRBr9ifQk0PtS8e_TXQJkvQJd9P-DTPiqHxM1V-3wjvSJ5E4iPKdIuMsHVutrNcBdoBdT9ucrbYixgdzHmAN9MsbcLHfi',
    status: 'Available'
  },
  {
    id: 'design_team',
    name: 'Design Team',
    phone: '+1 (555) 300-4100',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_wsfYalMRh8t4yUNGHppMspsovCu6we98duiWNJ3aGAbeT6piQMjPTnzSjgBkYRCufyHAlRvzWjdvvxtnyXHp6s0LT-sUsdWPC84lq5jqKCTfJ3teEWjzurVUY8XXPatYCOLuKhz0uM4WWVoe03uXZlJ6dDKO15Pl1UKzg2eqG6W1cTggFoJRJ6jTT0SJHdUz2Lgvq0H9uMrHFmFx78CJ3MeQSsenNIqUBHj_VaZIEKqaX4rCMzrc9KJ5zRXGUkO7GKzp7BXPtRxu',
    status: 'Group Chat'
  },
  {
    id: 'john',
    name: 'John Miller',
    phone: '+1 (555) 123-4567',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMSUaquRpNzsTYxjIrrNuekIEeRWkpoNkk5hro9CiDd9wL3bcOreGRgNqWwXyGO8SvEFF6tKCV5hRhu3zhNBFTxYebxher_Y50X24MMHLiGsAkBgKGEJZcj6KS58a1rvBV9C5ymOi-aananGNq9CP4u9djn3naU_hCSfg9cMkjsCUbC-fUlMMU-Q809EpEajFGOCHCcCfmLk6SM6JpHB6Oumyvy-sLiLvsXxMxdkDspy7L2a4mVag65DVwYdrX80BoJ4o60D7B83NM',
    status: 'Away'
  },
  {
    id: 'robert',
    name: 'Robert Stark',
    phone: '+1 (555) 987-6543',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmiCFVPJ_Sv6cmXBDUaogu1TL6BbiuBgP_E9NaWqwnFV21cx1_M8F_YwIUAfxXHzLL_CSZBZa33S1w06RwHnlycDUKNTF9e5DppMUtbEvE0P5dhnBADfDxTGmMRoNF8qKlM4uN7I30_cUF6ANOhmD5uHxi4OGN_QJdPJrALS2LwWwT3I-pU0_6D8IOAmMHGNfaYMBC0MubPhwVsmXjbFUmUgOtJBA7iAucduh-wn1_-E2C_5YCrMTg2Tv7y0r9oe_VqQn1bW6aFPXl',
    status: 'Offline'
  }
];

export const INITIAL_CHATS: Chat[] = [
  {
    contactId: 'sarah',
    unreadCount: 4,
    messages: [
      { id: 'm1', senderId: 'sarah', senderName: 'Sarah Connor', text: 'Hey there! Are we still on for today?', timestamp: '10:15 AM' },
      { id: 'm2', senderId: 'user', senderName: 'Me', text: 'Yes! What time works for you?', timestamp: '10:20 AM' },
      { id: 'm3', senderId: 'sarah', senderName: 'Sarah Connor', text: 'How about 12:30 at the diner?', timestamp: '10:22 AM' },
      { id: 'm4', senderId: 'sarah', senderName: 'Sarah Connor', text: 'Are we still meeting for lunch...', timestamp: '10:43 AM' }
    ]
  },
  {
    contactId: 'alex',
    unreadCount: 0,
    messages: [
      { id: 'm5', senderId: 'alex', senderName: 'Alex Rivera', text: 'The project architecture is finalized. Are we moving forward with the minimalist design for the dashboard?', timestamp: 'Yesterday' }
    ]
  },
  {
    contactId: 'design_team',
    unreadCount: 0,
    messages: [
      { id: 'm6', senderId: 'alex', senderName: 'Alex Rivera', text: 'I updated the color palette in the shared files', timestamp: '11:00 AM' },
      { id: 'm7', senderId: 'john', senderName: 'John Miller', text: 'Awesome, looks super sharp.', timestamp: '11:15 AM' },
      { id: 'm8', senderId: 'design_team', senderName: 'Design Team', text: '3 new assets shared in the workspace.', timestamp: '11:30 AM' }
    ]
  }
];

export const INITIAL_EMAILS: Email[] = [
  {
    id: 'e1',
    sender: 'Alex Rivera',
    subject: 'Minimalist Dashboard Architecture',
    body: 'The project architecture is finalized. Are we moving forward with the minimalist design for the dashboard? I have attached the initial mockup blueprints for review. Let me know if you would like to hop on a call to review the tiles grid system.',
    timestamp: '12:45 PM',
    read: false,
    category: 'messages'
  },
  {
    id: 'e2',
    sender: 'Design Team',
    subject: '3 New Assets Shared',
    body: 'We have updated the tile vectors for the home screen launcher app. The folder now contains high-resolution illustrations matching the Lumina Metro palette. Check out the Photos and Calendar app update mockups!',
    timestamp: '11:30 AM',
    read: false,
    category: 'messages'
  },
  {
    id: 'e3',
    sender: 'Client Calendar',
    subject: 'Client Review Meeting Reminder',
    body: 'Your meeting with the core product team is in 15 minutes. We will review tile response times, perspective-tilt animations, and dynamic widgets. Location: Meeting room 4B or via secure video link.',
    timestamp: 'In 15 min',
    read: false,
    category: 'calendar'
  },
  {
    id: 'e4',
    sender: 'System Update',
    subject: 'OS version 12.4.1 is ready to install',
    body: 'An OTA update is available for your Lumina Metro device. This update improves live tile loading performance, Web Audio API latency, and layout fluidity. Please plug your device into a charger and swipe to install.',
    timestamp: 'Yesterday',
    read: true,
    category: 'system'
  },
  {
    id: 'e5',
    sender: 'Spotify Support',
    subject: 'Welcome to Spotify Live Widget!',
    body: 'Your Spotify tile is ready to go. You can play synthesized retro tracks straight from your home screen. Pin your favorite artists to stay connected.',
    timestamp: '2 days ago',
    read: true,
    category: 'general'
  }
];

export const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'ev1',
    title: 'Client Review',
    date: '2026-06-27',
    time: '13:00',
    location: 'Meeting Room 4B'
  },
  {
    id: 'ev2',
    title: 'Lunch with Sarah',
    date: '2026-06-27',
    time: '12:30',
    location: 'Central Diner'
  },
  {
    id: 'ev3',
    title: 'Developer Sync',
    date: '2026-06-28',
    time: '10:00',
    location: 'Remote Link'
  }
];

export const INITIAL_PHOTOS: Photo[] = [
  {
    id: 'p1',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAldsSQd_GRUzHv9Yd0Ue_zr794--dXU-mlaMl1gbn6wL7ABFUafjy2feaefNxIz0JJx6FQnc6D4QhNi9L9qbeY60EuUhEycdfDhxG_h3M3bRFmrR5_447A3tB5IG07vAOlX85tuakcJnM6nwdH1sm8hrFzFwXoGzUYdfs9evLu_1vEapqalRmmI4Tp0RK3glNrMRopgiUgY_USvtlb5bEC_s54aM1ua5sYpbQ_7h8C2s4MgHZfWANzC8jIEQw6zK6leqhxen93QuvD',
    date: 'June 27, 2026'
  },
  {
    id: 'p2',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFSig2MIbrY0vrGLaZM8cbSD-4Gvsp2ntvXCWDublKNNFw2Ub694mJON54tvlDB1vkj-5o0cImg56oMUd_cSszlGDLhXnb6-BvpReJM3s_37KaoF1X9w5FTI7JmgJ2uy8zxoZ8J4O20S0H_HFG_rEwMp5HedWELzJ3aDKT65wN5qk_GJWMLw0kpQuDYO89VVQrSOCrFE-XGroJMrbYiX5wuYMBRYmdfUtNtCXtSZuYDgl0uYLVBoM1XGuqMzOY2DHIZznF3E3YroRO',
    date: 'June 26, 2026'
  }
];

export const INITIAL_CALL_LOGS: CallLog[] = [
  { id: 'c1', name: 'Sarah Connor', phone: '+1 (555) 019-2834', type: 'missed', timestamp: '10:45 AM' },
  { id: 'c2', name: 'Alex Rivera', phone: '+1 (555) 014-9842', type: 'incoming', timestamp: 'Yesterday', duration: '5m 12s' },
  { id: 'c3', name: 'Unknown', phone: '+1 (555) 000-1122', type: 'outgoing', timestamp: '2 days ago', duration: '1m 45s' }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Alex Rivera',
    text: '"The project architecture is finalized. Are we moving forward with the..."',
    timestamp: '12:45 PM',
    appName: 'MESSAGES',
    sender: 'Alex Rivera'
  },
  {
    id: 'n2',
    title: 'Design Team',
    text: '3 new assets shared in the workspace.',
    timestamp: '11:30 AM',
    appName: 'MESSAGES',
    sender: 'Design Team'
  },
  {
    id: 'n3',
    title: 'Client Review',
    text: 'Meeting room 4B or via secure link.',
    timestamp: 'IN 15 MIN',
    appName: 'CALENDAR'
  },
  {
    id: 'n4',
    title: 'System Update',
    text: 'OS version 12.4.1 is ready to install. This update improves tile response times.',
    timestamp: 'YESTERDAY',
    appName: 'SYSTEM'
  }
];

// Synth tracks with pitches (frequencies in Hz) and timings for Web Audio playback
export const SYSTEM_PLAYLIST: Song[] = [
  {
    id: 's1',
    title: 'After Hours',
    artist: 'The Weeknd (Retro Synth)',
    duration: 35,
    notes: [261, 293, 329, 349, 392, 440, 494, 523] // C D E F G A B C
  },
  {
    id: 's2',
    title: 'Neon Horizon',
    artist: 'Lumina Metro',
    duration: 40,
    notes: [329, 392, 440, 392, 329, 293, 261, 293] // E G A G E D C D
  },
  {
    id: 's3',
    title: 'Metro Pulse',
    artist: 'Nokia Legacy',
    duration: 30,
    notes: [440, 494, 523, 587, 659, 587, 523, 494] // A B C D E D C B
  }
];

export const DEFAULT_SETTINGS: SystemSettings = {
  accentColor: 'cyan',
  carrierName: 'CARRIER',
  lockscreenWallpaper: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFSig2MIbrY0vrGLaZM8cbSD-4Gvsp2ntvXCWDublKNNFw2Ub694mJON54tvlDB1vkj-5o0cImg56oMUd_cSszlGDLhXnb6-BvpReJM3s_37KaoF1X9w5FTI7JmgJ2uy8zxoZ8J4O20S0H_HFG_rEwMp5HedWELzJ3aDKT65wN5qk_GJWMLw0kpQuDYO89VVQrSOCrFE-XGroJMrbYiX5wuYMBRYmdfUtNtCXtSZuYDgl0uYLVBoM1XGuqMzOY2DHIZznF3E3YroRO',
  soundEnabled: true,
  airplaneMode: false,
  bluetoothEnabled: false,
  flashlightOn: false,
  wifiConnected: true
};

export const METRO_THEMES = {
  cyan: {
    bgClass: 'bg-[#00abec]',
    textClass: 'text-[#00abec]',
    borderClass: 'border-[#00abec]',
    onClass: 'text-white bg-[#00abec]',
    accentHex: '#00abec'
  },
  magenta: {
    bgClass: 'bg-[#d90274]',
    textClass: 'text-[#d90274]',
    borderClass: 'border-[#d90274]',
    onClass: 'text-white bg-[#d90274]',
    accentHex: '#d90274'
  },
  lime: {
    bgClass: 'bg-[#b3d349]',
    textClass: 'text-[#b3d349]',
    borderClass: 'border-[#b3d349]',
    onClass: 'text-[#293500] bg-[#b3d349]',
    accentHex: '#b3d349'
  },
  orange: {
    bgClass: 'bg-[#f05a28]',
    textClass: 'text-[#f05a28]',
    borderClass: 'border-[#f05a28]',
    onClass: 'text-white bg-[#f05a28]',
    accentHex: '#f05a28'
  },
  purple: {
    bgClass: 'bg-[#a352fc]',
    textClass: 'text-[#a352fc]',
    borderClass: 'border-[#a352fc]',
    onClass: 'text-white bg-[#a352fc]',
    accentHex: '#a352fc'
  }
};
export type AccentColor = keyof typeof METRO_THEMES;

export const DEFAULT_TILES = [
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

