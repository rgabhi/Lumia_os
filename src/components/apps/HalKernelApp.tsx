import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, Terminal, Layers, RefreshCw, Zap, Volume2, Bluetooth, Wifi, 
  HelpCircle, ChevronRight, Binary, FileText, Check, ShieldAlert, Sliders, Play, Square
} from 'lucide-react';
import { motion } from 'motion/react';
import { SystemSettings } from '../../types';
import { METRO_THEMES } from '../../data';

interface HalKernelAppProps {
  onClose: () => void;
  accentClass: string;
  settings: SystemSettings;
  onUpdateSettings: (settings: Partial<SystemSettings>) => void;
  playHapticSound?: (freq?: number, dur?: number, type?: OscillatorType) => void;
}

interface KernelLog {
  timestamp: string;
  tag: 'KERNEL' | 'HAL' | 'SYSCALL' | 'SYSFS';
  message: string;
}

interface SysfsNode {
  path: string;
  value: string;
  permissions: string;
  description: string;
}

export default function HalKernelApp({
  onClose,
  accentClass,
  settings,
  onUpdateSettings,
  playHapticSound
}: HalKernelAppProps) {
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'hal-controllers' | 'kernel-logs' | 'sysfs'>('hal-controllers');
  
  // HAL state models
  const [flashlightIntensity, setFlashlightIntensity] = useState(settings.flashlightOn ? 255 : 0);
  const [audioFreq, setAudioFreq] = useState(440);
  const [audioWave, setAudioWave] = useState<'sine' | 'square' | 'triangle' | 'sawtooth'>('sine');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [btDiscovery, setBtDiscovery] = useState(false);
  const [btDevices, setBtDevices] = useState<{ name: string; rssi: number; mac: string }[]>([]);
  const [wifiChannel, setWifiChannel] = useState(6);
  const [wifiSpeed, setWifiSpeed] = useState(72); // Mbps
  const [wifiSignals, setWifiSignals] = useState<number[]>([45, 48, 52, 50, 48, 55, 60, 58, 56, 59]);

  // Architecture flow selected block
  const [selectedArchBlock, setSelectedArchBlock] = useState<'api' | 'jni' | 'hal' | 'kernel' | 'hardware'>('hal');

  // Kernel dmesg log buffer
  const [kernelLogs, setKernelLogs] = useState<KernelLog[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Web Audio Context reference for audio HAL synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const activeTheme = METRO_THEMES[settings.accentColor] || METRO_THEMES.cyan;

  // Initialize some core kernel logs
  useEffect(() => {
    const formatTime = (offsetMs: number) => {
      const sec = (42 + offsetMs / 1000).toFixed(6);
      return `[   ${sec.padStart(9, ' ')}]`;
    };

    const initialLogs: KernelLog[] = [
      { timestamp: formatTime(0), tag: 'KERNEL', message: 'Linux version 4.14.117-lumia-g88fa90b (android-build@google.com) (gcc version 4.9.x)' },
      { timestamp: formatTime(100), tag: 'KERNEL', message: 'CPU0: Qualcomm Technologies, Inc. MSM8992 4x ARM Cortex-A53, 2x ARM Cortex-A57' },
      { timestamp: formatTime(250), tag: 'KERNEL', message: 'lumia-leds sysfs: Initializing flashlight led sysfs class nodes' },
      { timestamp: formatTime(320), tag: 'KERNEL', message: 'snd-soc-lumia: MSM8992 primary audio codec registered with kernel ALSA subsystem' },
      { timestamp: formatTime(440), tag: 'KERNEL', message: 'hci_qca: Bluetooth serial transport protocol driver initialized' },
      { timestamp: formatTime(550), tag: 'KERNEL', message: 'wlan: Qualcomm Atheros Prima WLAN driver loaded successfully' },
      { timestamp: formatTime(700), tag: 'HAL', message: 'android.hardware.light@2.0-service: binderized light HAL registering...' },
      { timestamp: formatTime(850), tag: 'HAL', message: 'android.hardware.audio@5.0-service: registering master hardware audio HAL instance' },
      { timestamp: formatTime(1000), tag: 'HAL', message: 'android.hardware.bluetooth@1.0-service: local transport ready' },
    ];
    setKernelLogs(initialLogs);
  }, []);

  // Add a dynamic log entry
  const addKernelLog = (tag: 'KERNEL' | 'HAL' | 'SYSCALL' | 'SYSFS', message: string) => {
    const timestamp = `[   ${(42 + Math.random() * 10).toFixed(6).padStart(9, ' ')}]`;
    setKernelLogs(prev => [...prev, { timestamp, tag, message }]);
  };

  // Scroll terminal logs to bottom when updated
  useEffect(() => {
    if (activeTab === 'kernel-logs') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [kernelLogs, activeTab]);

  // Synchronize flashlight intensity slider with settings.flashlightOn state
  useEffect(() => {
    if (settings.flashlightOn && flashlightIntensity === 0) {
      setFlashlightIntensity(255);
    } else if (!settings.flashlightOn && flashlightIntensity > 0) {
      setFlashlightIntensity(0);
    }
  }, [settings.flashlightOn]);

  // Sync Wi-Fi speed and channels over time to make simulation organic
  useEffect(() => {
    const interval = setInterval(() => {
      if (settings.wifiConnected) {
        setWifiSpeed(prev => {
          const delta = Math.floor(Math.random() * 11) - 5;
          return Math.max(54, Math.min(150, prev + delta));
        });
        setWifiSignals(prev => {
          const nextVal = Math.max(35, Math.min(100, (prev[prev.length - 1] + (Math.floor(Math.random() * 7) - 3))));
          return [...prev.slice(1), nextVal];
        });
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [settings.wifiConnected]);

  // Audio HAL Tone Synthesis Handler
  const toggleAudioSynthesis = () => {
    if (isAudioPlaying) {
      stopAudioSynthesis();
    } else {
      startAudioSynthesis();
    }
  };

  const startAudioSynthesis = () => {
    try {
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        addKernelLog('HAL', 'Audio Synthesis failed: AudioContext not supported in this browser.');
        return;
      }

      // Create Web Audio Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      // Create nodes
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = audioWave;
      osc.frequency.value = audioFreq;

      // Soft start/gain volume to protect user hearing
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);

      // Connect nodes
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Start synthesizer
      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
      setIsAudioPlaying(true);

      addKernelLog('SYSCALL', `ioctl(SND_MX_VOLUME, 12) | write() to /dev/snd/pcm_out`);
      addKernelLog('HAL', `audio.primary.lumia.so: out_write() initiated stream [freq=${audioFreq}Hz, wave=${audioWave}]`);
    } catch (e: any) {
      console.error(e);
      addKernelLog('KERNEL', `snd-soc-codec: DAC buffer overflow error in write() block`);
    }
  };

  const stopAudioSynthesis = () => {
    if (oscillatorRef.current) {
      try {
        if (audioCtxRef.current) {
          gainNodeRef.current?.gain.setValueAtTime(gainNodeRef.current.gain.value, audioCtxRef.current.currentTime);
          gainNodeRef.current?.gain.exponentialRampToValueAtTime(0.0001, audioCtxRef.current.currentTime + 0.05);
          const oscTemp = oscillatorRef.current;
          setTimeout(() => {
            try {
              oscTemp.stop();
            } catch(err) {}
          }, 60);
        } else {
          oscillatorRef.current.stop();
        }
      } catch (err) {}
      oscillatorRef.current = null;
    }
    setIsAudioPlaying(false);
    addKernelLog('HAL', `audio.primary.lumia.so: out_write() stream suspended and DAC enters power-save mode`);
  };

  // Keep Audio frequency and waveform updated on live oscillator if active
  useEffect(() => {
    if (isAudioPlaying && oscillatorRef.current) {
      oscillatorRef.current.frequency.value = audioFreq;
    }
  }, [audioFreq]);

  useEffect(() => {
    if (isAudioPlaying && oscillatorRef.current) {
      oscillatorRef.current.type = audioWave;
      addKernelLog('SYSFS', `Changing DAC wave format setting to: ${audioWave}`);
    }
  }, [audioWave]);

  // Cleanup synthesizer on component unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch(e){}
      }
    };
  }, []);

  // Flashlight sysfs slider manipulation
  const handleFlashlightIntensityChange = (val: number) => {
    setFlashlightIntensity(val);
    const ledOn = val > 0;
    
    if (ledOn !== settings.flashlightOn) {
      onUpdateSettings({ flashlightOn: ledOn });
    }

    addKernelLog('SYSCALL', `ioctl(LED_SET_BRIGHTNESS, ${val}) syscall dispatched to lights kernel module`);
    addKernelLog('SYSFS', `write("/sys/class/leds/flashlight/brightness", "${val}")`);
  };

  // Bluetooth Discovery state machine trigger
  const handleBluetoothToggle = () => {
    const nextState = !settings.bluetoothEnabled;
    onUpdateSettings({ bluetoothEnabled: nextState });

    if (nextState) {
      addKernelLog('SYSCALL', `ioctl(BT_HC_POWER_ON) -> power gpio raised to high`);
      addKernelLog('HAL', `bluetooth.default.so: init() callback complete. HCI interface up.`);
    } else {
      setBtDiscovery(false);
      setBtDevices([]);
      addKernelLog('HAL', `bluetooth.default.so: shutdown() invoked. BT state clean.`);
    }
  };

  const startBluetoothDiscovery = () => {
    if (!settings.bluetoothEnabled) return;
    
    setBtDiscovery(true);
    setBtDevices([]);
    addKernelLog('SYSCALL', `write(/dev/hci0) HCI_Inquiry packet dispatched`);
    addKernelLog('HAL', `bluetooth.default.so: startDiscovery() scanning Bluetooth carrier frequencies...`);

    if (playHapticSound) playHapticSound(880, 0.05, 'sine');

    setTimeout(() => {
      setBtDevices([
        { name: "Qualcomm Earbuds v4.2", rssi: -62, mac: "9C:45:12:DF:D2:11" },
        { name: "Lumia 950 XL Dual SIM", rssi: -78, mac: "4C:11:90:3A:BB:CC" },
        { name: "Smart BLE Fitness Band", rssi: -85, mac: "10:3B:AA:88:99:FF" }
      ]);
      addKernelLog('HAL', `bluetooth.default.so: discoveryComplete() -> 3 device descriptors parsed`);
    }, 2000);
  };

  // Virtual Sysfs nodes listing
  const SYSFS_NODES: SysfsNode[] = [
    { 
      path: '/sys/class/leds/flashlight/brightness', 
      value: String(flashlightIntensity), 
      permissions: 'rw- r-- r--', 
      description: 'Controls the back camera flash driver PWM duty cycle. Accepts values 0 to 255.' 
    },
    { 
      path: '/sys/class/leds/flashlight/max_brightness', 
      value: '255', 
      permissions: 'r-- r-- r--', 
      description: 'Hardware limit constant for the back camera flash driver.' 
    },
    { 
      path: '/sys/class/power_supply/battery/capacity', 
      value: '84', 
      permissions: 'r-- r-- r--', 
      description: 'Reports battery percentage read by the fuel gauge driver from gas-gauge registers.' 
    },
    { 
      path: '/sys/class/power_supply/battery/temp', 
      value: '315', 
      permissions: 'r-- r-- r--', 
      description: 'Battery termistor temperature in tenths of degrees Celsius (31.5°C).' 
    },
    { 
      path: '/dev/snd/pcm_out', 
      value: isAudioPlaying ? '[STREAMING ACTIVE]' : '[STANDBY]', 
      permissions: 'rw- rw- ---', 
      description: 'Direct PCM output channel node used by ALSA sound driver for audio output.' 
    },
    { 
      path: '/dev/hci0', 
      value: settings.bluetoothEnabled ? '[UP / ENABLED]' : '[DOWN]', 
      permissions: 'rw- rw- ---', 
      description: 'Host Controller Interface device node used for packet dispatching to Bluetooth firmware.' 
    },
    { 
      path: '/proc/cpuinfo', 
      value: 'Processor: ARMv8 rev 4 (v8l) \nCores: 6 (4x A53 + 2x A57) \nHardware: Qualcomm Snapdragon 808 MSM8992', 
      permissions: 'r-- r-- r--', 
      description: 'Exposes detailed Lumia CPU core topologies to userland libraries.' 
    },
    { 
      path: '/proc/version', 
      value: 'Linux version 4.14.117-lumia-g88fa90b (android-build@google.com) #1 SMP PREEMPT Sat Jun 27 2026', 
      permissions: 'r-- r-- r--', 
      description: 'Details of running Linux kernel compiler, host, and compilation dates.' 
    }
  ];

  // Architecture flow descriptions
  const ARCH_BLOCKS_INFO = {
    api: {
      title: "Android AOSP SDK Framework Java Layer",
      path: "frameworks/base/core/java/android/",
      concept: "High-level object-oriented APIs that third-party applications interact with. Contains managers like CameraManager, AudioManager, and BluetoothAdapter. This layer provides modular, standardized abstractions to prevent developers from writing platform-specific device logic.",
      snippet: `// Application code triggering standard API\nCameraManager cameraManager = (CameraManager) getSystemService(Context.CAMERA_SERVICE);\ncameraManager.setTorchMode(cameraId, true);`
    },
    jni: {
      title: "Java Native Interface (JNI) & Binder IPC",
      path: "frameworks/base/core/jni/",
      concept: "Bridges the managed Java garbage-collected runtime (ART) with local high-performance C/C++ compiled code. Translates Java class methods into C++ equivalents and handles local Binder Inter-Process Communication (IPC) to pass calls down to system services safely.",
      snippet: `// frameworks/base/core/jni/android_hardware_Camera.cpp\nstatic void android_hardware_Camera_setTorchMode(JNIEnv *env, jobject thiz, jstring id, jboolean enabled) {\n    sp<CameraService> service = getCameraService();\n    service->setTorchMode(String16(id), enabled);\n}`
    },
    hal: {
      title: "Hardware Abstraction Layer (HAL)",
      path: "hardware/interfaces/ / device/nokia/lumia/hal/",
      concept: "Defines standard APIs for hardware vendors to implement without caring about driver kernel architectures. Standard libraries like lights.lumia.so or audio.primary.lumia.so export callback interfaces. In modern Android, these run in isolated, sandboxed 'binderized' daemon processes (HIDL/AIDL) for security.",
      snippet: `// device/nokia/lumia/light/lights_hal.cpp\nint set_light_flashlight(struct light_device_t* dev, struct light_state_t const* state) {\n    int fd = open("/sys/class/leds/flashlight/brightness", O_WRONLY);\n    if (fd >= 0) {\n        char value[8];\n        snprintf(value, sizeof(value), "%d\\n", state->color & 0xFF);\n        write(fd, value, strlen(value));\n        close(fd);\n    }\n    return 0;\n}`
    },
    kernel: {
      title: "Linux Kernel Drivers Subsystem",
      path: "kernel/nokia/msm8992/drivers/",
      concept: "The core engine running in supervisor mode. Manages CPU schedules, virtual memory, network stacks, and hardware peripherals. Standardizes file interface nodes (e.g. /sys/class/ or /dev/) using driver file operations structs. Restricts hardware registers to authorized secure kernel driver modules.",
      snippet: `// kernel/drivers/leds/leds-lumia.c\nstatic ssize_t flashlight_brightness_store(struct device *dev, struct device_attribute *attr, const char *buf, size_t count) {\n    unsigned long state;\n    kstrtoul(buf, 10, &state);\n    lumia_hardware_write_pwm_registers(PWM_PIN_FLASHLIGHT, state);\n    return count;\n}`
    },
    hardware: {
      title: "Lumia Physical Hardware & Micro-Controller",
      path: "Schematics: Nokia Lumia MSM8992 Core Board",
      concept: "The actual solid-state circuitry. Includes LED arrays, digital-to-analog converters (DAC), antennas, internal power grids, capacitors, and transceivers. These respond directly to raw pulse-width modulation (PWM) square wave signals, voltage levels, or SPI/I2C bus registers programmed by the SoC.",
      snippet: `// Hardware Bus Topology\n[MSM8992 GPIO Pin 34] --- (PWM Duty Cycle Signal) ---> [LM3643 Dual-LED Driver IC]\n[LM3643 Driver IC] ------ (Boost Switched Output) ---> [Xenon Flash LED Array]`
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="h-full flex flex-col bg-black text-white p-6 select-none font-sans relative overflow-hidden rounded-none"
    >
      {/* App Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-zinc-900 pb-4 shrink-0 rounded-none">
        <div>
          <h1 className="font-light text-3xl tracking-tight uppercase flex items-center gap-2.5 rounded-none">
            <Cpu className={`w-8 h-8 ${activeTheme.textClass}`} />
            HAL & KERNEL CONSOLE
          </h1>
          <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">AOSP Hardware Abstraction Layer & Driver Diagnostics</p>
        </div>
        <div className="flex gap-2 shrink-0 rounded-none">
          <button 
            onClick={onClose}
            className="px-5 py-1.5 border border-white hover:bg-white hover:text-black transition-colors text-xs font-mono tracking-widest uppercase rounded-none"
          >
            CLOSE DIAGNOSTICS
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-4 no-scrollbar border-b border-zinc-900 shrink-0 rounded-none">
        <button
          onClick={() => {
            setActiveTab('hal-controllers');
            if (playHapticSound) playHapticSound(600, 0.03, 'sine');
          }}
          className={`px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all rounded-none whitespace-nowrap ${
            activeTab === 'hal-controllers' 
              ? `${activeTheme.bgClass} text-white font-bold` 
              : 'bg-zinc-950 hover:bg-zinc-900 text-gray-400'
          }`}
        >
          HAL MODULE CONTROLLERS
        </button>
        <button
          onClick={() => {
            setActiveTab('walkthrough');
            if (playHapticSound) playHapticSound(600, 0.03, 'sine');
          }}
          className={`px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all rounded-none whitespace-nowrap ${
            activeTab === 'walkthrough' 
              ? `${activeTheme.bgClass} text-white font-bold` 
              : 'bg-zinc-950 hover:bg-zinc-900 text-gray-400'
          }`}
        >
          AOSP STACK WALKTHROUGH
        </button>
        <button
          onClick={() => {
            setActiveTab('kernel-logs');
            if (playHapticSound) playHapticSound(600, 0.03, 'sine');
          }}
          className={`px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all rounded-none whitespace-nowrap ${
            activeTab === 'kernel-logs' 
              ? `${activeTheme.bgClass} text-white font-bold` 
              : 'bg-zinc-950 hover:bg-zinc-900 text-gray-400'
          }`}
        >
          KERNEL LOGS (DMESG)
        </button>
        <button
          onClick={() => {
            setActiveTab('sysfs');
            if (playHapticSound) playHapticSound(600, 0.03, 'sine');
          }}
          className={`px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all rounded-none whitespace-nowrap ${
            activeTab === 'sysfs' 
              ? `${activeTheme.bgClass} text-white font-bold` 
              : 'bg-zinc-950 hover:bg-zinc-900 text-gray-400'
          }`}
        >
          SYSFS & DEV FILESYSTEM
        </button>
      </div>

      {/* Main Body Panel */}
      <div className="flex-1 min-h-0 bg-zinc-950 border border-zinc-900 p-4 relative rounded-none">
        
        {/* VIEW 1: HAL Controllers (Hands-on Peripheral Simulations) */}
        {activeTab === 'hal-controllers' && (
          <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto no-scrollbar rounded-none pr-1">
            
            {/* Box A: Lights HAL Module */}
            <div className="bg-black p-4 border border-zinc-900 flex flex-col justify-between rounded-none">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3 rounded-none">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${activeTheme.textClass}`} />
                    <span className="text-sm font-bold tracking-tight uppercase">lights.lumia.so</span>
                  </div>
                  <span className="text-[9px] font-mono bg-zinc-900 px-2 py-0.5 text-zinc-400 border border-zinc-800 rounded-none">BINDERIZED</span>
                </div>
                <p className="text-xs text-gray-400 mb-4 font-sans leading-relaxed">
                  Controls the camera Flashlight LED back panel. Updates driver values in `/sys/class/leds/flashlight/brightness` via Sysfs interfaces.
                </p>

                {/* Slider and values */}
                <div className="space-y-4 rounded-none">
                  <div className="flex justify-between items-center text-xs font-mono text-gray-400 rounded-none">
                    <span>SYSFS PWM VALUE:</span>
                    <span className={`font-bold ${activeTheme.textClass}`}>{flashlightIntensity} / 255</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="255"
                    value={flashlightIntensity}
                    onChange={(e) => handleFlashlightIntensityChange(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-1 bg-zinc-800 cursor-pointer rounded-none outline-none"
                  />
                  
                  {/* Dynamic LED Light visualizer */}
                  <div className="flex items-center gap-3 bg-zinc-950 p-2.5 border border-zinc-900 rounded-none">
                    <div className="relative w-9 h-9 shrink-0 flex items-center justify-center rounded-none">
                      <div 
                        className="absolute inset-0 transition-all duration-100 rounded-full"
                        style={{ 
                          backgroundColor: '#00abec', 
                          opacity: flashlightIntensity / 255, 
                          boxShadow: flashlightIntensity > 0 ? `0 0 ${flashlightIntensity / 8}px #00abec` : 'none'
                        }} 
                      />
                      <Zap className={`w-4 h-4 z-10 transition-colors ${flashlightIntensity > 0 ? 'text-black' : 'text-zinc-500'}`} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-gray-500 block">HARDWARE STATE:</span>
                      <span className="text-xs font-semibold">{flashlightIntensity > 0 ? `EMITTING PHOTO-ENERGY (${Math.round(flashlightIntensity / 2.55)}%)` : 'STANDBY (0V)'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900/40 text-[9px] font-mono text-zinc-500">
                Sysfs node target: <span className="text-zinc-400">/sys/class/leds/flashlight/brightness</span>
              </div>
            </div>

            {/* Box B: Audio HAL Module (Interactive audio synthethizer) */}
            <div className="bg-black p-4 border border-zinc-900 flex flex-col justify-between rounded-none">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3 rounded-none">
                  <div className="flex items-center gap-2">
                    <Volume2 className={`w-4 h-4 ${activeTheme.textClass}`} />
                    <span className="text-sm font-bold tracking-tight uppercase">audio.primary.lumia.so</span>
                  </div>
                  <span className="text-[9px] font-mono bg-zinc-900 px-2 py-0.5 text-zinc-400 border border-zinc-800 rounded-none">ALSA INTEGRATION</span>
                </div>
                <p className="text-xs text-gray-400 mb-3 font-sans leading-relaxed">
                  Translates standard AOSP PCM stream interfaces down to Linux kernel audio mixer channels. Synthesizes frequencies dynamically.
                </p>

                <div className="space-y-3.5 rounded-none">
                  {/* Wave type selector */}
                  <div className="grid grid-cols-4 gap-1 rounded-none">
                    {(['sine', 'square', 'triangle', 'sawtooth'] as const).map(wave => (
                      <button
                        key={wave}
                        onClick={() => {
                          setAudioWave(wave);
                          if (playHapticSound) playHapticSound(450, 0.02, 'sine');
                        }}
                        className={`py-1 text-[9px] font-mono uppercase border rounded-none transition-colors ${
                          audioWave === wave 
                            ? `${activeTheme.borderClass} ${activeTheme.textClass} bg-zinc-950 font-bold` 
                            : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {wave}
                      </button>
                    ))}
                  </div>

                  {/* Frequency Slider */}
                  <div className="space-y-1.5 rounded-none">
                    <div className="flex justify-between items-center text-xs font-mono text-gray-400 rounded-none">
                      <span>SYNTH TONE OSCILLATOR:</span>
                      <span className={`font-bold ${activeTheme.textClass}`}>{audioFreq} Hz</span>
                    </div>
                    <input 
                      type="range"
                      min="100"
                      max="1200"
                      value={audioFreq}
                      onChange={(e) => setAudioFreq(Number(e.target.value))}
                      className="w-full accent-cyan-400 h-1 bg-zinc-800 cursor-pointer rounded-none outline-none"
                    />
                  </div>

                  {/* Play audio node trigger */}
                  <div className="flex gap-2 rounded-none">
                    <button
                      onClick={toggleAudioSynthesis}
                      className={`flex-1 py-2 text-xs font-mono uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 transition-colors border rounded-none ${
                        isAudioPlaying 
                          ? 'bg-red-950/20 border-red-500 text-red-400 hover:bg-red-900/20' 
                          : `${activeTheme.borderClass} hover:bg-white/5`
                      }`}
                    >
                      {isAudioPlaying ? (
                        <>
                          <Square className="w-3.5 h-3.5" /> STOP SYNTH DRIVER
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" /> START PCM SYNTH STREAM
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Wave oscillator Canvas/SVG emulation */}
              <div className="h-10 bg-zinc-950 border border-zinc-900 mt-3 relative overflow-hidden flex items-center justify-center rounded-none">
                {isAudioPlaying ? (
                  <svg className="w-full h-full text-cyan-400 opacity-60" viewBox="0 0 100 40" preserveAspectRatio="none">
                    <path 
                      d={Array.from({ length: 101 }, (_, x) => {
                        const waveScale = audioFreq / 400;
                        const y = 20 + Math.sin((x * waveScale) + Date.now() * 0.01) * 15;
                        return `${x === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="1.5"
                    />
                  </svg>
                ) : (
                  <div className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">AUDIO STREAM SILENT</div>
                )}
              </div>
            </div>

            {/* Box C: Bluetooth HAL Module */}
            <div className="bg-black p-4 border border-zinc-900 flex flex-col justify-between rounded-none">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3 rounded-none">
                  <div className="flex items-center gap-2">
                    <Bluetooth className={`w-4 h-4 ${activeTheme.textClass}`} />
                    <span className="text-sm font-bold tracking-tight uppercase">bluetooth.default.so</span>
                  </div>
                  <span className="text-[9px] font-mono bg-zinc-900 px-2 py-0.5 text-zinc-400 border border-zinc-800 rounded-none">HCI STACK</span>
                </div>
                <p className="text-xs text-gray-400 mb-3 font-sans leading-relaxed">
                  Controls the wireless transceiver. Exposes the host HCI controller socket via `/dev/hci0` interface to communicate with Qualcomm Bluetooth hardware firmware.
                </p>

                <div className="space-y-3 rounded-none">
                  <div className="flex items-center justify-between rounded-none">
                    <span className="text-xs font-mono text-gray-400">BLUETOOTH POWER NODE:</span>
                    <button
                      onClick={handleBluetoothToggle}
                      className={`px-3 py-1 text-[10px] font-mono uppercase font-bold tracking-widest border transition-colors rounded-none ${
                        settings.bluetoothEnabled 
                          ? `${activeTheme.bgClass} text-white border-transparent` 
                          : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {settings.bluetoothEnabled ? "RFPOWER: ON" : "RFPOWER: OFF"}
                    </button>
                  </div>

                  {settings.bluetoothEnabled && (
                    <div className="animate-fadeIn space-y-2 rounded-none">
                      <button
                        onClick={startBluetoothDiscovery}
                        disabled={btDiscovery}
                        className="w-full py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 transition-colors uppercase rounded-none"
                      >
                        {btDiscovery ? "SCANNING CARRIERS..." : "INITIATE HCI DISCOVERY"}
                      </button>

                      {/* Discovered bluetooth devices list */}
                      <div className="bg-zinc-950 p-2 border border-zinc-900 font-mono text-[10px] space-y-1.5 max-h-24 overflow-y-auto no-scrollbar rounded-none">
                        {btDiscovery && btDevices.length === 0 && (
                          <div className="text-zinc-500 text-center py-2 animate-pulse">Inquiry packets broadcasting...</div>
                        )}
                        {!btDiscovery && btDevices.length === 0 && (
                          <div className="text-zinc-600 text-center py-2">Bluetooth adapter idle. Press scan to search.</div>
                        )}
                        {btDevices.map((dev, i) => (
                          <div key={i} className="flex justify-between items-center text-zinc-400 border-b border-zinc-900/60 pb-1 rounded-none">
                            <div className="truncate pr-2 rounded-none">
                              <span className="text-white block font-semibold">{dev.name}</span>
                              <span className="text-[9px] text-zinc-600">{dev.mac}</span>
                            </div>
                            <span className={`${activeTheme.textClass} text-[9px] font-bold shrink-0`}>{dev.rssi} dBm</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900/40 text-[9px] font-mono text-zinc-500">
                Driver channel node: <span className="text-zinc-400">/dev/hci0</span>
              </div>
            </div>

            {/* Box D: Wi-Fi HAL Module */}
            <div className="bg-black p-4 border border-zinc-900 flex flex-col justify-between rounded-none">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3 rounded-none">
                  <div className="flex items-center gap-2">
                    <Wifi className={`w-4 h-4 ${activeTheme.textClass}`} />
                    <span className="text-sm font-bold tracking-tight uppercase">wifi.default.so</span>
                  </div>
                  <span className="text-[9px] font-mono bg-zinc-900 px-2 py-0.5 text-zinc-400 border border-zinc-800 rounded-none">ATH6KL DRIVER</span>
                </div>
                <p className="text-xs text-gray-400 mb-3 font-sans leading-relaxed">
                  Atheros WLAN kernel chip abstraction interface. Manages network associations, packet filters, scanning configurations, and reports signal RSSI values.
                </p>

                <div className="space-y-3 rounded-none">
                  <div className="flex items-center justify-between rounded-none">
                    <span className="text-xs font-mono text-gray-400">WLAN INTERFACE STATE:</span>
                    <button
                      onClick={() => {
                        const target = !settings.wifiConnected;
                        onUpdateSettings({ wifiConnected: target });
                        addKernelLog('HAL', `wifi.default.so: ${target ? 'Connecting to WLAN subsystem...' : 'Disconnecting wifi interfaces'}`);
                        addKernelLog('SYSCALL', `write(/sys/class/net/wlan0/operstate, "${target ? 'up' : 'down'}")`);
                      }}
                      className={`px-3 py-1 text-[10px] font-mono uppercase font-bold tracking-widest border transition-colors rounded-none ${
                        settings.wifiConnected 
                          ? `${activeTheme.bgClass} text-white border-transparent` 
                          : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {settings.wifiConnected ? "NET: CONNECTED" : "NET: OFFLINE"}
                    </button>
                  </div>

                  {settings.wifiConnected && (
                    <div className="animate-fadeIn space-y-3 rounded-none">
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono rounded-none">
                        <div className="bg-zinc-950 p-1.5 border border-zinc-900 rounded-none">
                          <span className="text-[9px] text-zinc-500 block">CHANNEL:</span>
                          <span className="text-white font-bold">{wifiChannel} (2.412 GHz)</span>
                        </div>
                        <div className="bg-zinc-950 p-1.5 border border-zinc-900 rounded-none">
                          <span className="text-[9px] text-zinc-500 block">LINK SPEED:</span>
                          <span className="text-white font-bold">{wifiSpeed} Mbps</span>
                        </div>
                      </div>

                      {/* Simple signal RSSI monitor bars */}
                      <div className="space-y-1 rounded-none">
                        <span className="text-[10px] font-mono text-gray-400">WLAN SIGNAL INSTABILITY GRAPH (RSSI dBm):</span>
                        <div className="h-10 bg-zinc-950 border border-zinc-900 flex items-end justify-between p-1.5 rounded-none">
                          {wifiSignals.map((val, idx) => (
                            <div 
                              key={idx} 
                              className={`w-4 bg-cyan-500 transition-all duration-300 ${activeTheme.bgClass}`}
                              style={{ height: `${val}%` }}
                              title={`Signal strength: -${100 - val} dBm`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-zinc-900/40 text-[9px] font-mono text-zinc-500">
                Network endpoint node: <span className="text-zinc-400">/sys/class/net/wlan0</span>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 2: AOSP Stack Walkthrough Map */}
        {activeTab === 'walkthrough' && (
          <div className="h-full flex flex-col md:flex-row gap-4 min-h-0 rounded-none">
            
            {/* Visual Block Diagram */}
            <div className="md:w-1/2 flex flex-col justify-between border border-zinc-900 bg-black/40 p-4 overflow-y-auto no-scrollbar rounded-none">
              <div>
                <h3 className="text-xs font-bold tracking-wider text-zinc-400 uppercase mb-4">AOSP Architecture Flow</h3>
                
                <div className="space-y-2 rounded-none">
                  {/* Block 1: API */}
                  <button
                    onClick={() => {
                      setSelectedArchBlock('api');
                      if (playHapticSound) playHapticSound(500, 0.02, 'sine');
                    }}
                    className={`w-full p-3 border text-left flex items-center justify-between transition-all rounded-none ${
                      selectedArchBlock === 'api' 
                        ? `${activeTheme.borderClass} bg-zinc-900` 
                        : 'border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono block text-gray-500">LEVEL 4 - JAVA ENDPOINT</span>
                      <span className="text-xs font-bold uppercase tracking-tight">System Framework API</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${selectedArchBlock === 'api' ? 'rotate-90' : ''}`} />
                  </button>

                  <div className="text-center text-zinc-700 text-xs py-0.5">↓</div>

                  {/* Block 2: JNI */}
                  <button
                    onClick={() => {
                      setSelectedArchBlock('jni');
                      if (playHapticSound) playHapticSound(500, 0.02, 'sine');
                    }}
                    className={`w-full p-3 border text-left flex items-center justify-between transition-all rounded-none ${
                      selectedArchBlock === 'jni' 
                        ? `${activeTheme.borderClass} bg-zinc-900` 
                        : 'border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono block text-gray-500">LEVEL 3 - INTER-PROCESS BRIDGE</span>
                      <span className="text-xs font-bold uppercase tracking-tight">ART JNI & Binder Proxy</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${selectedArchBlock === 'jni' ? 'rotate-90' : ''}`} />
                  </button>

                  <div className="text-center text-zinc-700 text-xs py-0.5">↓</div>

                  {/* Block 3: HAL */}
                  <button
                    onClick={() => {
                      setSelectedArchBlock('hal');
                      if (playHapticSound) playHapticSound(500, 0.02, 'sine');
                    }}
                    className={`w-full p-3 border text-left flex items-center justify-between transition-all rounded-none ${
                      selectedArchBlock === 'hal' 
                        ? `${activeTheme.borderClass} bg-zinc-900` 
                        : 'border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono block text-gray-500">LEVEL 2 - HARDWARE INTERFACE</span>
                      <span className="text-xs font-bold uppercase tracking-tight">Hardware Abstraction (HAL)</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${selectedArchBlock === 'hal' ? 'rotate-90' : ''}`} />
                  </button>

                  <div className="text-center text-zinc-700 text-xs py-0.5">↓</div>

                  {/* Block 4: Kernel */}
                  <button
                    onClick={() => {
                      setSelectedArchBlock('kernel');
                      if (playHapticSound) playHapticSound(500, 0.02, 'sine');
                    }}
                    className={`w-full p-3 border text-left flex items-center justify-between transition-all rounded-none ${
                      selectedArchBlock === 'kernel' 
                        ? `${activeTheme.borderClass} bg-zinc-900` 
                        : 'border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono block text-gray-500">LEVEL 1 - KERNELSPACE</span>
                      <span className="text-xs font-bold uppercase tracking-tight">Linux Kernel drivers</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${selectedArchBlock === 'kernel' ? 'rotate-90' : ''}`} />
                  </button>

                  <div className="text-center text-zinc-700 text-xs py-0.5">↓</div>

                  {/* Block 5: Hardware */}
                  <button
                    onClick={() => {
                      setSelectedArchBlock('hardware');
                      if (playHapticSound) playHapticSound(500, 0.02, 'sine');
                    }}
                    className={`w-full p-3 border text-left flex items-center justify-between transition-all rounded-none ${
                      selectedArchBlock === 'hardware' 
                        ? `${activeTheme.borderClass} bg-zinc-900` 
                        : 'border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono block text-gray-500">LEVEL 0 - PHYSICAL SILICON</span>
                      <span className="text-xs font-bold uppercase tracking-tight">Lumia Integrated Hardware Circuits</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-zinc-500 transition-transform ${selectedArchBlock === 'hardware' ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-4">
                Click any layer to view JNI mappings, kernel driver details, and code source blocks.
              </div>
            </div>

            {/* Block Description, Files, and Code Snippet */}
            <div className="flex-1 bg-black border border-zinc-900 p-4 flex flex-col justify-between min-h-0 rounded-none">
              <div className="space-y-4 overflow-y-auto no-scrollbar pr-1 rounded-none">
                <div className="border-b border-zinc-900 pb-2 rounded-none">
                  <span className="text-[9px] font-mono text-cyan-400 tracking-wider uppercase block">AOSP ARCHITECTURE LAYER EXPLAINED</span>
                  <h2 className="text-lg font-bold tracking-tight text-white uppercase">{ARCH_BLOCKS_INFO[selectedArchBlock].title}</h2>
                </div>

                {/* Path node */}
                <div className="bg-zinc-950 p-2 border border-zinc-900/80 font-mono text-[10px] flex items-center gap-1.5 rounded-none">
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-zinc-400">SRC DIRECTORY PATH:</span>
                  <span className="text-white font-medium break-all">{ARCH_BLOCKS_INFO[selectedArchBlock].path}</span>
                </div>

                {/* Concept text */}
                <div className="text-xs text-gray-300 leading-relaxed font-sans">
                  <p>{ARCH_BLOCKS_INFO[selectedArchBlock].concept}</p>
                </div>

                {/* Code block */}
                <div className="space-y-1.5 rounded-none">
                  <span className="text-[10px] font-mono text-zinc-500 block">SOURCE / REGISTER CODE PREVIEW:</span>
                  <pre className="bg-zinc-950 border border-zinc-900 p-3 font-mono text-[9.5px] leading-relaxed text-cyan-300 overflow-x-auto rounded-none">
                    <code>{ARCH_BLOCKS_INFO[selectedArchBlock].snippet}</code>
                  </pre>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500 rounded-none">
                <span>SELINUX MODE: ENFORCING</span>
                <span>HW VERSION: MS8992 v3.1</span>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 3: Kernel logs (dmesg terminal output) */}
        {activeTab === 'kernel-logs' && (
          <div className="h-full flex flex-col justify-between bg-black border border-zinc-900 p-4 font-mono text-xs rounded-none">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3 rounded-none">
              <div className="flex items-center gap-1.5 text-zinc-400 rounded-none">
                <Terminal className={`w-4 h-4 ${activeTheme.textClass}`} />
                <span>KERNEL RING BUFFER LOGGER (/proc/kmsg)</span>
              </div>
              <button
                onClick={() => {
                  setKernelLogs([]);
                  if (playHapticSound) playHapticSound(300, 0.05, 'triangle');
                }}
                className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold font-sans tracking-wider px-2 py-0.5 border border-zinc-800 hover:border-zinc-700 transition-all rounded-none"
              >
                Clear dmesg
              </button>
            </div>

            {/* Terminal Feed */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-950 p-3 border border-zinc-900 text-[11px] leading-relaxed space-y-1.5 min-h-0 rounded-none">
              {kernelLogs.length === 0 ? (
                <div className="text-zinc-600 text-center py-8">[Ring buffer is currently empty. Trigger driver interrupts in the controls tab]</div>
              ) : (
                kernelLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-2 items-start rounded-none">
                    <span className="text-zinc-500 shrink-0 select-none font-medium">{log.timestamp}</span>
                    <span className={`shrink-0 font-bold ${
                      log.tag === 'KERNEL' ? 'text-blue-400' :
                      log.tag === 'HAL' ? 'text-purple-400' :
                      log.tag === 'SYSCALL' ? 'text-amber-500' :
                      'text-cyan-400'
                    }`}>
                      [{log.tag}]
                    </span>
                    <span className="text-gray-300 break-all">{log.message}</span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>

            <div className="mt-3 text-[10px] text-zinc-500 flex justify-between items-center rounded-none">
              <span>ACTIVE SYSTEM CALL PATH: USERSPACE --(SYSENTER/INT 80h)--&gt; KERNEL DRIVER RING</span>
              <span className="animate-pulse text-cyan-400 font-bold">● DRIVERS LISTENING</span>
            </div>
          </div>
        )}

        {/* VIEW 4: Sysfs Node File explorer */}
        {activeTab === 'sysfs' && (
          <div className="h-full flex flex-col justify-between bg-black border border-zinc-900 p-4 font-mono text-xs rounded-none">
            <div className="border-b border-zinc-900 pb-2 mb-3 rounded-none">
              <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Binary className={`w-4 h-4 ${activeTheme.textClass}`} />
                VIRTUAL DRIVER FILE SYSTEM DIRECTORIES (/sys/ &amp; /dev/)
              </span>
            </div>

            {/* Virtual table */}
            <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-950 border border-zinc-900 min-h-0 rounded-none">
              <div className="grid grid-cols-1 divide-y divide-zinc-900 rounded-none">
                {SYSFS_NODES.map((node, i) => (
                  <div key={i} className="p-3 hover:bg-white/5 transition-colors grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center rounded-none">
                    <div className="rounded-none">
                      <span className="text-[10px] text-zinc-500 block">NODE PATH:</span>
                      <span className="text-cyan-400 font-semibold text-xs truncate break-all block">{node.path}</span>
                    </div>
                    <div className="rounded-none">
                      <span className="text-[10px] text-zinc-500 block">VALUE:</span>
                      <span className="text-white font-bold bg-zinc-900/80 px-2 py-0.5 border border-zinc-800 rounded-none inline-block">{node.value}</span>
                    </div>
                    <div className="rounded-none">
                      <span className="text-[10px] text-zinc-500 block">PERMISSIONS &amp; DRIVER PURPOSE:</span>
                      <span className="text-zinc-400 block text-[10px] leading-relaxed">{node.permissions} | {node.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 text-[10px] text-zinc-500 flex justify-between rounded-none">
              <span>TOTAL SYSFS CLASS DIRECTORIES DETECTED: 48</span>
              <span>DEV NODES MOUNTED ON /dev/...</span>
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
