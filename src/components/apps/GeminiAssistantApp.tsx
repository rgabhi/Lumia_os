import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Mic, MicOff, Volume2, VolumeX, Terminal, ArrowRight, Play, Check } from 'lucide-react';
import { SystemSettings, Intent } from '../../types';

interface GeminiAssistantAppProps {
  onClose: () => void;
  accentClass: string;
  settings: SystemSettings;
  onUpdateSettings: (settings: Partial<SystemSettings>) => void;
  onBroadcastIntent: (intent: Omit<Intent, 'id' | 'timestamp'>) => void;
  playHapticSound?: (freq?: number, dur?: number, type?: OscillatorType) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionExecuted?: string;
}

export default function GeminiAssistantApp({
  onClose,
  accentClass,
  settings,
  onUpdateSettings,
  onBroadcastIntent,
  playHapticSound
}: GeminiAssistantAppProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I am Cortana, your Gemini-powered assistant. How can I help you navigate your Lumia device today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantState, setAssistantState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setAssistantState('listening');
        if (playHapticSound) playHapticSound(523.25, 0.08, 'sine'); // C5 chime
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue(transcript);
          handleSendMessage(transcript);
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setAssistantState('idle');
      };

      rec.onend = () => {
        setIsListening(false);
        if (assistantState === 'listening') {
          setAssistantState('idle');
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  // Clean up speech synthesis when unmounted
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-To-Speech Synthesis
  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    // Clean markdown before speaking
    const cleanText = text.replace(/[*#`_\-]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Try to find a standard friendly English voice
    const voices = window.speechSynthesis.getVoices();
    const optimalVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Cortana') || v.name.includes('Female'))
    ) || voices[0];
    
    if (optimalVoice) {
      utterance.voice = optimalVoice;
    }
    
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    utterance.onstart = () => setAssistantState('speaking');
    utterance.onend = () => setAssistantState('idle');
    utterance.onerror = () => setAssistantState('idle');

    window.speechSynthesis.speak(utterance);
  };

  // Toggle Microphone Voice Input
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser environment. Please type your command.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setInputValue('');
      recognitionRef.current.start();
    }
  };

  // Log events to terminal status display
  const addLog = (message: string) => {
    setStatusLog(prev => [...prev.slice(-3), `[${new Date().toLocaleTimeString([], { hour12: false })}] ${message}`]);
  };

  // Process system-level function calls sent by Gemini
  const executeSystemFunction = (funcCall: { name: string; args: any }) => {
    const { name, args } = funcCall;
    addLog(`Invoking system API: ${name}`);
    
    if (name === 'broadcastIntent') {
      const intentArgs = {
        action: args.action,
        data: args.data,
        extras: args.extras || {}
      };
      onBroadcastIntent(intentArgs);
      addLog(`Intent triggered: ${intentArgs.action} -> ${intentArgs.data || ''}`);
      if (playHapticSound) playHapticSound(659.25, 0.1, 'sine'); // E5 success chime
      return `Executed action: Opened ${args.data || args.action}`;
    }

    if (name === 'changeAccentColor') {
      const color = args.color;
      if (['cyan', 'magenta', 'lime', 'orange', 'purple'].includes(color)) {
        onUpdateSettings({ accentColor: color });
        addLog(`System setting: AccentColor set to ${color}`);
        if (playHapticSound) playHapticSound(587.33, 0.1, 'triangle');
        return `Changed theme color to ${color}`;
      }
    }

    if (name === 'toggleSystemSetting') {
      const { setting, value } = args;
      if (['flashlightOn', 'airplaneMode', 'bluetoothEnabled', 'soundEnabled'].includes(setting)) {
        onUpdateSettings({ [setting]: value });
        addLog(`System configuration: ${setting} set to ${value}`);
        if (playHapticSound) playHapticSound(523.25, 0.1, 'sine');
        return `Toggled setting: ${setting} is now ${value ? 'ON' : 'OFF'}`;
      }
    }

    return '';
  };

  // Send message to Gemini API
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isProcessing) return;

    if (playHapticSound) playHapticSound(440, 0.05, 'sine'); // Haptic feedback click

    // Append user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);
    setAssistantState('thinking');
    addLog(`Awaiting Gemini inference...`);

    try {
      // Build conversation history payload
      const historyPayload = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          systemStatus: settings
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      addLog(`Gemini core processed response`);

      let actionExecutedString = '';
      if (data.functionCalls && data.functionCalls.length > 0) {
        actionExecutedString = executeSystemFunction(data.functionCalls[0]);
      }

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        content: data.text || "I have initiated the system action you requested.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: actionExecutedString || undefined
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsProcessing(false);
      setAssistantState('speaking');

      // Trigger text-to-speech feedback
      speakText(assistantMsg.content);

    } catch (error: any) {
      console.error("Assistant API call failed:", error);
      addLog(`Error: API interface communication error`);
      
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        role: 'assistant',
        content: "I'm having trouble communicating with the server right now. Please verify your Gemini API key is configured correctly in the Settings Secrets tab.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, errorMsg]);
      setIsProcessing(false);
      setAssistantState('idle');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Helper list of prompt recommendations
  const QUICK_COMMANDS = [
    { label: "Change theme to magenta", text: "Change theme to magenta" },
    { label: "Turn on Flashlight", text: "Turn on the flashlight" },
    { label: "Open Paint App", text: "Launch the Paint Studio app" },
    { label: "Check weather", text: "What's the weather like right now?" }
  ];

  return (
    <div className="h-full flex flex-col bg-black text-white p-6 select-none font-sans relative overflow-hidden">
      {/* App Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-light text-3xl tracking-tight uppercase flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-cyan-400 animate-pulse" />
            CORTANA
          </h1>
          <p className="text-xs text-gray-400 font-mono tracking-wider">GEMINI AI INTELLIGENT COMPANION</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className="p-2 border border-zinc-700 hover:border-white transition-colors text-xs flex items-center justify-center"
            title={voiceEnabled ? "Mute Voice Responses" : "Unmute Voice Responses"}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 border border-white hover:bg-white hover:text-black transition-colors text-xs font-mono"
          >
            BACK
          </button>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        
        {/* Left Side: Cortana Halo Neural Center & Status Logs */}
        <div className="md:w-1/3 flex flex-col items-center justify-center bg-zinc-950 p-6 border border-zinc-900 relative">
          
          {/* Windows Phone Cortana Halo Ring */}
          <div className="relative w-44 h-44 flex items-center justify-center my-6">
            
            {/* Wave Ripples when listening/thinking */}
            {assistantState === 'listening' && (
              <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" />
            )}
            {assistantState === 'thinking' && (
              <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-spin-slow" />
            )}
            {assistantState === 'speaking' && (
              <div className="absolute -inset-4 rounded-full border border-cyan-400/15 animate-pulse" />
            )}

            {/* Neural halo rings representing assistant state */}
            <div className={`absolute w-36 h-36 rounded-full border-4 border-double transition-all duration-700 ${
              assistantState === 'listening' ? 'border-red-500 scale-105 animate-pulse' :
              assistantState === 'thinking' ? 'border-purple-500 rotate-180 scale-95 border-dashed' :
              assistantState === 'speaking' ? 'border-cyan-400 scale-110 border-dotted' :
              'border-cyan-500' // idle
            }`} />

            <div className={`absolute w-28 h-28 rounded-full border border-white/10 flex items-center justify-center transition-all duration-500 ${
              assistantState === 'thinking' ? 'bg-purple-950/20' :
              assistantState === 'listening' ? 'bg-red-950/20' :
              'bg-zinc-900/50'
            }`}>
              <div className={`w-8 h-8 rounded-full transition-all duration-500 ${
                assistantState === 'listening' ? 'bg-red-500 animate-ping' :
                assistantState === 'thinking' ? 'bg-purple-400 scale-125' :
                assistantState === 'speaking' ? 'bg-cyan-300 scale-110' :
                'bg-cyan-400 scale-100 animate-pulse'
              }`} />
            </div>

            {/* Micro details */}
            <span className="absolute bottom-1 text-[9px] font-mono tracking-widest text-white/40 uppercase">
              {assistantState}
            </span>
          </div>

          {/* Neural state details */}
          <div className="text-center mb-4">
            <h3 className="text-sm font-semibold text-white/90">
              {assistantState === 'listening' ? "Listening to you..." :
               assistantState === 'thinking' ? "Processing request..." :
               assistantState === 'speaking' ? "Speaking..." :
               "Cortana Active"}
            </h3>
            <p className="text-[10px] text-white/50 font-mono mt-0.5">
              SYSTEM HOST PORT: 3000
            </p>
          </div>

          {/* Terminal / Live API Log output */}
          <div className="w-full mt-auto bg-black p-3 font-mono text-[9px] border border-zinc-900">
            <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-1.5 mb-1.5 text-zinc-500">
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>LOG: INTEGRATED ASSISTANT CORE</span>
            </div>
            {statusLog.length === 0 ? (
              <span className="text-zinc-600 block">System ready. State: Idle.</span>
            ) : (
              statusLog.map((log, idx) => (
                <div key={idx} className="text-cyan-400/80 leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Chat Dialog Feed & Command Inputs */}
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 border border-zinc-900">
          
          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                {/* Meta block */}
                <span className="text-[9px] font-mono text-zinc-500 mb-1">
                  {msg.role === 'user' ? 'LUMIA USER' : 'CORTANA CORE'} • {msg.timestamp}
                </span>

                {/* Message Content Tile */}
                <div className={`p-3.5 text-sm transition-all duration-300 ${
                  msg.role === 'user' 
                    ? 'bg-zinc-900 text-white border-r-4 border-cyan-500' 
                    : 'bg-[#1e1e24] text-white/95 border-l-4 border-cyan-400'
                }`}>
                  <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                </div>

                {/* System actions logs attached inside message bubble */}
                {msg.actionExecuted && (
                  <div className="mt-1.5 bg-black border border-zinc-800 text-emerald-400 text-[10px] font-mono py-1 px-2.5 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>{msg.actionExecuted}</span>
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex flex-col max-w-[85%] mr-auto items-start">
                <span className="text-[9px] font-mono text-zinc-500 mb-1">CORTANA CORE • Thinking</span>
                <div className="p-3.5 bg-zinc-900 border-l-4 border-purple-500 text-sm text-white/70 italic flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span>Synthesizing neural reply...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Interactive Suggestions Hub */}
          <div className="px-4 py-2 bg-zinc-900/40 border-t border-zinc-900">
            <span className="text-[9px] font-mono tracking-wider text-zinc-500 uppercase block mb-1.5">Suggested Directives</span>
            <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar scroll-smooth">
              {QUICK_COMMANDS.map((cmd, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInputValue(cmd.text);
                    handleSendMessage(cmd.text);
                  }}
                  disabled={isProcessing}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] hover:text-cyan-400 transition-colors whitespace-nowrap flex items-center gap-1"
                >
                  <span>{cmd.label}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-zinc-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Input Panel */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex gap-2">
            {/* Audio Speech-to-text Microphone Button */}
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`p-3 border flex items-center justify-center transition-colors ${
                isListening 
                  ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                  : 'border-zinc-700 hover:border-white text-zinc-400 hover:text-white'
              }`}
              title="Voice Recognition Command Input"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Standard Text input */}
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isProcessing}
              placeholder={isListening ? "Listening... Speak now." : "Type a command or question for Cortana..."}
              className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-white px-4 py-2 text-sm outline-none transition-colors"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={isProcessing || !inputValue.trim()}
              className="px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-zinc-800 text-white font-semibold transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
