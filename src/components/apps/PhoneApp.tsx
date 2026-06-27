import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Clock, Users, Delete, Volume2, Mic, MicOff, VolumeX, MessageSquare, Mail } from 'lucide-react';
import { CallLog, Contact, Intent } from '../../types';
import { INITIAL_CALL_LOGS, INITIAL_CONTACTS } from '../../data';

interface PhoneAppProps {
  onClose: () => void;
  accentClass: string;
  onCallInitiated?: (numberOrName: string) => void;
  activeIntent?: Intent | null;
  onClearActiveIntent?: () => void;
  onSendIntent?: (intent: Omit<Intent, 'id' | 'timestamp'>) => void;
}

export default function PhoneApp({ 
  onClose, 
  accentClass, 
  activeIntent, 
  onClearActiveIntent,
  onSendIntent
}: PhoneAppProps) {
  const [activeTab, setActiveTab] = useState<'dialer' | 'history' | 'contacts'>('dialer');
  const [dialString, setDialString] = useState('');
  const [callLogs, setCallLogs] = useState<CallLog[]>(INITIAL_CALL_LOGS);
  const [contacts] = useState<Contact[]>(INITIAL_CONTACTS);

  // In-call simulation states
  const [activeCall, setActiveCall] = useState<{ nameOrNumber: string; duration: number } | null>(null);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [micMuted, setMicMuted] = useState(false);

  // Handle incoming intent
  useEffect(() => {
    if (activeIntent) {
      if (activeIntent.action === 'android.intent.action.DIAL' || activeIntent.action === 'android.intent.action.VIEW') {
        const url = activeIntent.data || '';
        const telNumber = url.replace('tel:', '');
        if (telNumber) {
          setDialString(telNumber);
          setActiveTab('dialer');
          if (activeIntent.extras?.immediate) {
            setActiveCall({ nameOrNumber: activeIntent.extras?.recipient || telNumber, duration: 0 });
          }
        }
      }
      onClearActiveIntent?.();
    }
  }, [activeIntent, onClearActiveIntent]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeCall) {
      interval = setInterval(() => {
        setActiveCall(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const handleKeyPress = (char: string) => {
    setDialString(prev => prev + char);
  };

  const handleDelete = () => {
    setDialString(prev => prev.slice(0, -1));
  };

  const handleInitiateCall = (target: string) => {
    if (!target) return;
    setActiveCall({ nameOrNumber: target, duration: 0 });
    // Add to call logs
    const matchedContact = contacts.find(c => c.name === target || c.phone === target);
    const newLog: CallLog = {
      id: 'log-' + Date.now(),
      name: matchedContact ? matchedContact.name : target,
      phone: matchedContact ? matchedContact.phone : target,
      type: 'outgoing',
      timestamp: 'Just now'
    };
    setCallLogs(prev => [newLog, ...prev]);
  };

  const handleEndCall = () => {
    setActiveCall(null);
    setSpeakerOn(false);
    setMicMuted(false);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col bg-black text-white p-6 select-none font-sans relative overflow-hidden">
      {/* App Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-light text-3xl tracking-tight uppercase">PHONE</h1>
          <p className="text-xs text-gray-400 font-mono tracking-wider">DIALER & CONTACTS</p>
        </div>
        <button 
          onClick={onClose}
          className="px-3 py-1 border border-white hover:bg-white hover:text-black transition-colors text-xs font-mono"
        >
          BACK
        </button>
      </div>

      {/* Main Tabs Container */}
      {!activeCall ? (
        <>
          {/* Flat Pivot Navigation Tab */}
          <div className="flex gap-6 mb-6 text-sm font-bold border-b border-zinc-800 pb-2">
            <button 
              onClick={() => setActiveTab('dialer')}
              className={`uppercase tracking-widest pb-1 transition-all ${
                activeTab === 'dialer' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Dialer
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`uppercase tracking-widest pb-1 transition-all ${
                activeTab === 'history' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              History
            </button>
            <button 
              onClick={() => setActiveTab('contacts')}
              className={`uppercase tracking-widest pb-1 transition-all ${
                activeTab === 'contacts' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              Contacts
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Tab 1: Dialer */}
            {activeTab === 'dialer' && (
              <div className="flex-1 flex flex-col justify-between">
                {/* Input Area */}
                <div className="flex items-center justify-between border border-zinc-800 bg-zinc-950 p-4 mb-4 min-h-[64px]">
                  <span className="text-2xl font-light tracking-widest overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                    {dialString || <span className="text-gray-600 italic text-lg font-mono">Enter number...</span>}
                  </span>
                  {dialString && (
                    <button onClick={handleDelete} className="p-2 hover:bg-zinc-800 rounded-none ml-2 text-red-500">
                      <Delete className="w-6 h-6" />
                    </button>
                  )}
                </div>

                {/* Grid Pad */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((char) => (
                    <button
                      key={char}
                      onClick={() => handleKeyPress(char)}
                      className="aspect-[4/3] flex flex-col items-center justify-center border border-zinc-800 hover:border-zinc-500 active:bg-zinc-900 transition-colors text-xl font-light"
                    >
                      <span>{char}</span>
                    </button>
                  ))}
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleInitiateCall(dialString)}
                  disabled={!dialString}
                  className={`w-full py-4 font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${
                    dialString ? 'bg-[#00abec] text-white' : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Phone className="w-5 h-5 fill-current" />
                  Call
                </button>
              </div>
            )}

            {/* Tab 2: Call History */}
            {activeTab === 'history' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {callLogs.map((log) => (
                  <div 
                    key={log.id} 
                    onClick={() => handleInitiateCall(log.name)}
                    className="p-3 border border-zinc-800 hover:border-zinc-600 bg-zinc-950 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-none font-mono text-xs ${
                        log.type === 'missed' ? 'bg-red-900/40 text-red-400' :
                        log.type === 'incoming' ? 'bg-green-900/40 text-green-400' :
                        'bg-blue-900/40 text-blue-400'
                      }`}>
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-cyan-400 transition-colors">{log.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{log.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{log.timestamp}</p>
                      {log.duration && <p className="text-[10px] text-gray-500 font-mono">{log.duration}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Contacts */}
            {activeTab === 'contacts' && (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {contacts.map((contact) => (
                  <div 
                    key={contact.id}
                    onClick={() => handleInitiateCall(contact.name)}
                    className="p-3 border border-zinc-800 hover:border-zinc-600 bg-zinc-950 flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={contact.avatar} 
                        alt={contact.name} 
                        className="w-10 h-10 object-cover border border-zinc-700 rounded-none referrerPolicy='no-referrer'"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm group-hover:text-cyan-400 transition-colors truncate">{contact.name}</p>
                        <p className="text-xs text-gray-500 font-mono truncate">{contact.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendIntent?.({
                            action: 'android.intent.action.SENDTO',
                            data: `sms:${contact.phone}`,
                            extras: { recipient: contact.name }
                          });
                        }}
                        className="p-2 border border-zinc-800 hover:border-cyan-400 hover:bg-zinc-900 transition-all text-gray-400 hover:text-cyan-400"
                        title="Send SMS"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSendIntent?.({
                            action: 'android.intent.action.SENDTO',
                            data: `mailto:${contact.id}@lumia.net`,
                            extras: { recipient: contact.name, subject: "Hello" }
                          });
                        }}
                        className="p-2 border border-zinc-800 hover:border-cyan-400 hover:bg-zinc-900 transition-all text-gray-400 hover:text-cyan-400"
                        title="Send Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ACTIVE IN-CALL INTERFACE (High Fidelity Overlay) */
        <div className="flex-1 flex flex-col justify-between py-12 animate-[fadeIn_0.3s_ease-out]">
          <div className="text-center">
            {/* Animated Pulses for Active Call */}
            <div className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center">
              <div className="absolute inset-0 border border-[#00abec] animate-ping opacity-30 rounded-none" />
              <div className="absolute inset-4 border border-[#00abec] animate-[ping_1.5s_infinite] opacity-45 rounded-none" />
              <div className="w-20 h-20 bg-zinc-900 border border-[#00abec] flex items-center justify-center rounded-none">
                <Phone className="w-8 h-8 text-[#00abec] fill-current animate-bounce" />
              </div>
            </div>

            <h2 className="text-3xl font-light tracking-wide">{activeCall.nameOrNumber}</h2>
            <p className="text-[#00abec] text-sm font-mono mt-2 uppercase tracking-widest">Calling...</p>
            <p className="text-2xl font-light text-gray-400 mt-4 font-mono">{formatDuration(activeCall.duration)}</p>
          </div>

          <div className="space-y-6 max-w-sm mx-auto w-full px-6">
            {/* Call Action Toggles */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setMicMuted(p => !p)}
                className={`py-3 flex flex-col items-center justify-center gap-2 border text-xs font-mono uppercase tracking-wider transition-all ${
                  micMuted ? 'border-red-500 bg-red-950/20 text-red-400' : 'border-zinc-800 text-gray-400 hover:border-white'
                }`}
              >
                {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {micMuted ? 'Muted' : 'Mute'}
              </button>

              <button 
                onClick={() => setSpeakerOn(p => !p)}
                className={`py-3 flex flex-col items-center justify-center gap-2 border text-xs font-mono uppercase tracking-wider transition-all ${
                  speakerOn ? 'border-[#00abec] bg-cyan-950/20 text-[#00abec]' : 'border-zinc-800 text-gray-400 hover:border-white'
                }`}
              >
                {speakerOn ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                Speaker
              </button>
            </div>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <PhoneOff className="w-5 h-5" />
              End Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
