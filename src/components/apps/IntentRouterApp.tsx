import React, { useState } from 'react';
import { Cpu, Send, Terminal, Layers, CheckCircle, RefreshCw, Eye } from 'lucide-react';
import { Intent } from '../../types';

interface IntentRouterAppProps {
  onClose: () => void;
  accentClass: string;
  intentLogs: Intent[];
  onClearLogs: () => void;
  onBroadcastIntent: (intent: Omit<Intent, 'id' | 'timestamp'>) => void;
}

const PRESET_INTENTS = [
  {
    name: "Dial Contact (Phone)",
    action: "android.intent.action.DIAL",
    data: "tel:555-0199",
    type: "",
    extras: { recipient: "Sarah Connor" }
  },
  {
    name: "Open Webpage (Browser)",
    action: "android.intent.action.VIEW",
    data: "https://www.nokia.com/phones/lumia",
    type: "",
    extras: {}
  },
  {
    name: "Open Maps Coords (Browser)",
    action: "android.intent.action.VIEW",
    data: "geo:47.6062,-122.3321",
    type: "",
    extras: { label: "Seattle Metro" }
  },
  {
    name: "Compose SMS (Messages)",
    action: "android.intent.action.SENDTO",
    data: "sms:555-0144",
    type: "",
    extras: { text: "Hey! Let's build some metro grids." }
  },
  {
    name: "Send Mail (Outlook)",
    action: "android.intent.action.SENDTO",
    data: "mailto:alex@lumia.net",
    type: "",
    extras: { subject: "Metro Interface Design", text: "The sharp tile look is fantastic." }
  },
  {
    name: "Play Synthesized Song (Spotify)",
    action: "android.intent.action.PLAY_MUSIC",
    data: "spotify:track:1",
    type: "",
    extras: { songId: "track_waves", title: "Retro Sine Waves" }
  },
  {
    name: "Share Photo (Dialog Share Sheet)",
    action: "android.intent.action.SEND",
    data: "content://media/photos/1",
    type: "image/jpeg",
    extras: { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e" }
  }
];

export default function IntentRouterApp({ 
  onClose, 
  accentClass, 
  intentLogs, 
  onClearLogs, 
  onBroadcastIntent 
}: IntentRouterAppProps) {
  const [activeTab, setActiveTab] = useState<'dispatcher' | 'filters' | 'logs'>('dispatcher');

  // Custom Dispatcher states
  const [action, setAction] = useState('android.intent.action.VIEW');
  const [data, setData] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [extraKey, setExtraKey] = useState('');
  const [extraVal, setExtraVal] = useState('');
  const [extrasList, setExtrasList] = useState<Record<string, any>>({});
  const [successMsg, setSuccessMsg] = useState(false);

  const handleAddExtra = () => {
    if (!extraKey.trim()) return;
    setExtrasList(prev => ({
      ...prev,
      [extraKey.trim()]: extraVal
    }));
    setExtraKey('');
    setExtraVal('');
  };

  const handleClearExtras = () => {
    setExtrasList({});
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    onBroadcastIntent({
      action,
      data: data.trim() || undefined,
      type: mimeType.trim() || undefined,
      extras: Object.keys(extrasList).length > 0 ? extrasList : undefined
    });

    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2000);
  };

  const handleApplyPreset = (preset: typeof PRESET_INTENTS[0]) => {
    setAction(preset.action);
    setData(preset.data);
    setMimeType(preset.type);
    setExtrasList(preset.extras);
  };

  return (
    <div className="h-full flex flex-col bg-black text-white p-6 select-none font-sans relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-light text-3xl tracking-tight uppercase">INTENT ROUTER</h1>
          <p className="text-xs text-cyan-400 font-mono tracking-wider">INTER-APP COMMUNICATION LAYER</p>
        </div>
        <button 
          onClick={onClose}
          className="px-3 py-1 border border-white hover:bg-white hover:text-black transition-colors text-xs font-mono"
        >
          BACK
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6 text-sm font-bold border-b border-zinc-800 pb-2">
        <button 
          onClick={() => setActiveTab('dispatcher')}
          className={`uppercase tracking-widest pb-1 transition-all ${
            activeTab === 'dispatcher' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Dispatcher
        </button>
        <button 
          onClick={() => setActiveTab('filters')}
          className={`uppercase tracking-widest pb-1 transition-all ${
            activeTab === 'filters' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          Intent Filters
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`uppercase tracking-widest pb-1 transition-all ${
            activeTab === 'logs' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          System Logs ({intentLogs.length})
        </button>
      </div>

      {/* Main Content scroll window */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar pb-10">
        
        {/* TAB 1: DISPATCHER */}
        {activeTab === 'dispatcher' && (
          <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
            {successMsg && (
              <div className="p-3 bg-cyan-950 border border-cyan-400 text-cyan-400 text-xs flex items-center gap-2 animate-pulse">
                <CheckCircle className="w-4 h-4" />
                <span>INTENT BROADCAST SENT SUCCESSFULLY</span>
              </div>
            )}

            {/* Presets Grid */}
            <div>
              <h2 className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-3">Preloaded Android OS Intent Presets</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PRESET_INTENTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPreset(p)}
                    className="p-3 bg-zinc-950 border border-zinc-900 hover:border-cyan-400 hover:bg-zinc-900 transition-all text-left text-xs font-sans group flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-white group-hover:text-cyan-400 transition-colors">{p.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">{p.action}</p>
                    </div>
                    <Send className="w-3.5 h-3.5 text-gray-600 group-hover:text-cyan-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Intent Builder Form */}
            <form onSubmit={handleBroadcast} className="p-4 border border-zinc-800 bg-zinc-950 space-y-4">
              <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest border-b border-zinc-900 pb-2">Custom Intent Builder</h3>
              
              {/* Action Dropdown / Input */}
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">Intent Action</label>
                <select
                  value={action}
                  onChange={e => setAction(e.target.value)}
                  className="w-full bg-black border border-zinc-850 focus:border-cyan-400 focus:outline-none p-2.5 text-xs text-white"
                >
                  <option value="android.intent.action.VIEW">android.intent.action.VIEW</option>
                  <option value="android.intent.action.DIAL">android.intent.action.DIAL</option>
                  <option value="android.intent.action.SEND">android.intent.action.SEND</option>
                  <option value="android.intent.action.SENDTO">android.intent.action.SENDTO</option>
                  <option value="android.intent.action.PLAY_MUSIC">android.intent.action.PLAY_MUSIC</option>
                  <option value="custom.intent.action.LAUNCH">custom.intent.action.LAUNCH</option>
                </select>
              </div>

              {/* Data URI Input */}
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">Data URI</label>
                <input
                  type="text"
                  value={data}
                  onChange={e => setData(e.target.value)}
                  placeholder="e.g. tel:555-0199 or https://google.com or geo:lat,lng"
                  className="w-full bg-black border border-zinc-850 focus:border-cyan-400 focus:outline-none p-2.5 text-xs text-white"
                />
              </div>

              {/* Mime Type Input */}
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">MIME Type</label>
                <input
                  type="text"
                  value={mimeType}
                  onChange={e => setMimeType(e.target.value)}
                  placeholder="e.g. text/plain or image/jpeg"
                  className="w-full bg-black border border-zinc-850 focus:border-cyan-400 focus:outline-none p-2.5 text-xs text-white"
                />
              </div>

              {/* Intent Extras builder */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">Intent Extras (Key-Value Strings)</label>
                
                {/* List current extras */}
                {Object.keys(extrasList).length > 0 && (
                  <div className="p-2.5 bg-black border border-zinc-900 space-y-1">
                    {Object.entries(extrasList).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-[11px] font-mono">
                        <span className="text-cyan-400">{k}:</span>
                        <span className="text-gray-300 max-w-[200px] truncate">{String(v)}</span>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleClearExtras}
                      className="text-[9px] font-mono text-red-400 hover:text-red-300 uppercase block mt-2 hover:underline"
                    >
                      Clear Extras
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={extraKey}
                    onChange={e => setExtraKey(e.target.value)}
                    placeholder="Key"
                    className="flex-1 bg-black border border-zinc-850 focus:border-cyan-400 focus:outline-none p-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={extraVal}
                    onChange={e => setExtraVal(e.target.value)}
                    placeholder="Value"
                    className="flex-1 bg-black border border-zinc-850 focus:border-cyan-400 focus:outline-none p-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddExtra}
                    className="px-3 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono uppercase"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Broadcast Trigger */}
              <button
                type="submit"
                className="w-full py-4.5 bg-[#00abec] hover:bg-cyan-500 text-white text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <Cpu className="w-4.5 h-4.5" />
                BROADCAST TARGETED INTENT
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: FILTERS */}
        {activeTab === 'filters' && (
          <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
            <p className="text-xs text-gray-400 leading-relaxed">
              Below are the standard Android OS intent filters configured for the Lumia emulator. Incoming system intents are dynamically matched against these schemas.
            </p>

            <div className="space-y-4">
              
              {/* Phone app filter */}
              <div className="p-4 border border-zinc-850 bg-zinc-950">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>1. Phone App (Dialer)</span>
                  <span className="text-[9px] bg-cyan-900 text-cyan-200 px-2 py-0.5">RESOLVER</span>
                </h3>
                <div className="space-y-1.5 text-xs text-gray-400 font-mono">
                  <p><span className="text-cyan-400">Action:</span> android.intent.action.DIAL</p>
                  <p><span className="text-cyan-400">Action:</span> android.intent.action.VIEW</p>
                  <p><span className="text-cyan-400">Data Scheme:</span> tel:*</p>
                </div>
              </div>

              {/* Messages app filter */}
              <div className="p-4 border border-zinc-850 bg-zinc-950">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>2. Messaging Client</span>
                  <span className="text-[9px] bg-cyan-900 text-cyan-200 px-2 py-0.5">RESOLVER</span>
                </h3>
                <div className="space-y-1.5 text-xs text-gray-400 font-mono">
                  <p><span className="text-cyan-400">Action:</span> android.intent.action.SENDTO</p>
                  <p><span className="text-cyan-400">Data Scheme:</span> sms:*</p>
                  <p><span className="text-cyan-400">Action:</span> android.intent.action.SEND</p>
                  <p><span className="text-cyan-400">Mime Type:</span> text/plain</p>
                </div>
              </div>

              {/* Outlook app filter */}
              <div className="p-4 border border-zinc-850 bg-zinc-950">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>3. Outlook Mail</span>
                  <span className="text-[9px] bg-cyan-900 text-cyan-200 px-2 py-0.5">RESOLVER</span>
                </h3>
                <div className="space-y-1.5 text-xs text-gray-400 font-mono">
                  <p><span className="text-cyan-400">Action:</span> android.intent.action.SENDTO</p>
                  <p><span className="text-cyan-400">Data Scheme:</span> mailto:*</p>
                  <p><span className="text-cyan-400">Action:</span> android.intent.action.SEND</p>
                  <p><span className="text-cyan-400">Mime Type:</span> image/*, text/plain</p>
                </div>
              </div>

              {/* Browser app filter */}
              <div className="p-4 border border-zinc-850 bg-zinc-950">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>4. Browser Alpha & Maps</span>
                  <span className="text-[9px] bg-cyan-900 text-cyan-200 px-2 py-0.5">RESOLVER</span>
                </h3>
                <div className="space-y-1.5 text-xs text-gray-400 font-mono">
                  <p><span className="text-cyan-400">Action:</span> android.intent.action.VIEW</p>
                  <p><span className="text-cyan-400">Data Schemes:</span> http:*, https:*, geo:*, metro:*</p>
                </div>
              </div>

              {/* Spotify app filter */}
              <div className="p-4 border border-zinc-850 bg-zinc-950">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>5. Spotify Synthesizer</span>
                  <span className="text-[9px] bg-cyan-900 text-cyan-200 px-2 py-0.5">RESOLVER</span>
                </h3>
                <div className="space-y-1.5 text-xs text-gray-400 font-mono">
                  <p><span className="text-cyan-400">Action:</span> android.intent.action.PLAY_MUSIC</p>
                  <p><span className="text-cyan-400">Data Scheme:</span> spotify:*</p>
                </div>
              </div>

              {/* Photos app filter */}
              <div className="p-4 border border-zinc-850 bg-zinc-950">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>6. Photos & Camera Roll</span>
                  <span className="text-[9px] bg-cyan-900 text-cyan-200 px-2 py-0.5">RESOLVER</span>
                </h3>
                <div className="space-y-1.5 text-xs text-gray-400 font-mono">
                  <p><span className="text-cyan-400">Action:</span> android.intent.action.VIEW</p>
                  <p><span className="text-cyan-400">Data Scheme:</span> content://media/photos/*</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-gray-500 uppercase">Recent System Intents Queue</span>
              {intentLogs.length > 0 && (
                <button
                  onClick={onClearLogs}
                  className="text-red-400 hover:text-red-300 font-mono text-[9px] uppercase tracking-wider hover:underline"
                >
                  Clear Logs
                </button>
              )}
            </div>

            {intentLogs.length === 0 ? (
              <div className="p-8 border border-dashed border-zinc-800 text-center text-xs text-gray-500 font-sans">
                No active intents dispatched yet. Broadcaster pipeline is idle.
              </div>
            ) : (
              <div className="space-y-2">
                {intentLogs.map((log) => (
                  <div key={log.id} className="p-3 border border-zinc-850 bg-zinc-950 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-white text-xs block truncate max-w-[180px]">{log.action}</span>
                        <span className="text-[8px] text-gray-500 font-mono">{log.timestamp}</span>
                      </div>
                      <span className="text-[9px] bg-green-950 border border-green-700 text-green-400 px-2 py-0.5 uppercase tracking-wider font-bold">
                        → {log.resolvedApp || "BROADCASTED"}
                      </span>
                    </div>

                    <div className="text-[10px] space-y-1 bg-black/50 p-2 border border-zinc-900 font-mono text-gray-400">
                      {log.data && <p><span className="text-cyan-400">data:</span> {log.data}</p>}
                      {log.type && <p><span className="text-cyan-400">type:</span> {log.type}</p>}
                      {log.extras && (
                        <div>
                          <p className="text-cyan-400">extras:</p>
                          <pre className="text-[9px] text-gray-500 pl-2 leading-tight overflow-x-auto">
                            {JSON.stringify(log.extras, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
