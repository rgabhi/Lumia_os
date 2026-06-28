import React, { useState } from 'react';
import { Search, Compass, Calculator, Landmark, BookOpen, Globe, Calendar, Camera, Map, Mail, MessageSquare, Clock, ShieldAlert, Cpu, Palette, Sparkles } from 'lucide-react';

interface AllAppsProps {
  onLaunchApp: (appId: string) => void;
  onNavigateHome: () => void;
  accentColor: string;
  tiles?: { id: string; name: string; appId: string; visible: boolean }[];
}

interface AppItem {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
}

export default function AllApps({ onLaunchApp, onNavigateHome, accentColor, tiles = [] }: AllAppsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const APPS_LIST: AppItem[] = [
    { id: 'clock', name: 'Alarms & Clock', category: 'a', icon: <Clock className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> },
    { id: 'browser', name: 'Analytics Pro', category: 'a', icon: <Calculator className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> },
    { id: 'browser', name: 'Banking Hub', category: 'b', icon: <Landmark className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> },
    { id: 'browser', name: 'Bookshelf', category: 'b', icon: <BookOpen className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> },
    { id: 'browser', name: 'Browser Alpha', category: 'b', icon: <Globe className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> },
    { id: 'calendar', name: 'Calendar', category: 'c', icon: <Calendar className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> },
    { id: 'camera', name: 'Camera', category: 'c', icon: <Camera className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> },
    { id: 'cortana', name: 'Cortana (Gemini AI)', category: 'c', icon: <Sparkles className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> },
    { id: 'intent-router', name: 'Intent Router Shell', category: 'i', icon: <Cpu className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> },
    { id: 'browser', name: 'Maps', category: 'm', icon: <Map className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> },
    { id: 'messages', name: 'Messaging', category: 'm', icon: <MessageSquare className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> },
    { id: 'outlook', name: 'Outlook Mail', category: 'm', icon: <Mail className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> },
    { id: 'settings', name: 'System Settings', category: 's', icon: <ShieldAlert className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> }
  ];

  // Dynamically inject custom apps installed from the App Store
  const hasPaint = tiles.some(t => t.id === 'paint');
  const hasCalc = tiles.some(t => t.id === 'calculator');
  const hasMaps = tiles.some(t => t.id === 'maps');
  const hasSnake = tiles.some(t => t.id === 'retro-games');

  if (hasPaint) {
    APPS_LIST.push({ id: 'paint', name: 'Metro Paint Studio', category: 'p', icon: <Palette className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> });
  }
  if (hasCalc) {
    APPS_LIST.push({ id: 'calculator', name: 'Tile Calculator Pro', category: 'c', icon: <Calculator className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> });
  }
  if (hasMaps) {
    APPS_LIST.push({ id: 'maps', name: 'Lumia Vector Maps', category: 'l', icon: <Map className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> });
  }
  if (hasSnake) {
    APPS_LIST.push({ id: 'retro-games', name: 'Snake Arcade HD', category: 's', icon: <Compass className="w-5 h-5 text-white/80 group-hover:text-cyan-400 transition-colors" /> });
  }

  const filteredApps = APPS_LIST.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group filtered apps by starting category
  const groups: Record<string, AppItem[]> = {};
  filteredApps.forEach(app => {
    if (!groups[app.category]) {
      groups[app.category] = [];
    }
    groups[app.category].push(app);
  });

  // Category sorted letters
  const sortedCategories = Object.keys(groups).sort();

  return (
    <div className="flex-1 flex flex-col bg-[#0A0A0A] text-[#e2e2e2] font-sans overflow-y-auto no-scrollbar pb-32 pt-28 px-6 animate-[fadeIn_0.3s_ease-out]">
      
      {/* Search overlay/input right under nav */}
      <div className="mb-6 flex items-center bg-white/5 border border-white/10 rounded-none px-4 py-3 focus-within:bg-white/10 focus-within:border-white/20 transition-all duration-200">
        <Search className="w-4 h-4 text-white/40 mr-2 shrink-0" />
        <input 
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search apps..."
          className="flex-1 bg-transparent border-none focus:outline-none text-white text-xs font-sans placeholder-white/30"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white uppercase text-[9px] tracking-widest font-semibold font-sans">Clear</button>
        )}
      </div>

      {/* Main Apps Grouping */}
      <div className="space-y-8 flex-1">
        {sortedCategories.length === 0 ? (
          <p className="text-center text-white/30 font-sans text-xs py-12">No matching apps installed</p>
        ) : (
          sortedCategories.map((category) => (
            <section key={category} className="animate-[slideUpFade_0.5s_ease-out_forwards]">
              {/* Category alphabet banner block */}
              <div className="flex items-center mb-4 px-2">
                <div 
                  className="w-9 h-9 text-white flex items-center justify-center font-bold text-sm uppercase rounded-none border border-transparent"
                  style={{ backgroundColor: accentColor || '#00abec' }}
                >
                  {category}
                </div>
              </div>

              {/* App list cards */}
              <div className="flex flex-col gap-1.5">
                {groups[category].map((app) => (
                  <div
                    key={`${app.id}-${app.name}`}
                    onClick={() => onLaunchApp(app.id)}
                    className="flex items-center gap-4 py-2 px-3 rounded-none hover:bg-white/5 border border-transparent cursor-pointer transition-all duration-150 group active:scale-[0.98] active:translate-y-px"
                  >
                    <div 
                      className="w-11 h-11 text-white flex items-center justify-center shrink-0 rounded-none transition-all duration-150"
                      style={{ backgroundColor: accentColor || '#00abec' }}
                    >
                      {app.icon}
                    </div>
                    <span className="font-semibold text-sm text-white/80 group-hover:text-white transition-colors">
                      {app.name}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Watermark Logo Footer */}
      <div className="mt-12 py-10 opacity-5 pointer-events-none select-none font-sans">
        <span className="text-6xl font-black uppercase block leading-none tracking-tighter">Applications</span>
        <span className="text-6xl font-black uppercase block leading-none tracking-tighter">System</span>
      </div>

    </div>
  );
}
