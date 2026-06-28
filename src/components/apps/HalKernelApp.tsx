import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, Terminal, Layers, RefreshCw, Zap, Volume2, Bluetooth, Wifi, 
  HelpCircle, ChevronRight, Binary, FileText, Check, ShieldAlert, Sliders, Play, Square,
  Folder, Power, ArrowRight
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
  const [activeTab, setActiveTab] = useState<'walkthrough' | 'hal-controllers' | 'kernel-logs' | 'sysfs' | 'aosp-code' | 'twrp-flasher'>('aosp-code');
  
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

  // AOSP Compiler / DevSuite States
  const [selectedCodeFile, setSelectedCodeFile] = useState<'kotlin-launcher' | 'rust-lights' | 'rust-audio' | 'board-config'>('kotlin-launcher');
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationProgress, setCompilationProgress] = useState(0);
  const [compileLogs, setCompileLogs] = useState<string[]>([]);
  const [compileSuccess, setCompileSuccess] = useState(false);
  const compileTerminalEndRef = useRef<HTMLDivElement>(null);

  // TWRP Recovery & Reboot States
  const [twrpStep, setTwrpStep] = useState<'menu' | 'select-file' | 'swipe-flash' | 'flashing' | 'done'>('menu');
  const [twrpLogs, setTwrpLogs] = useState<string[]>([]);
  const [twrpProgress, setTwrpProgress] = useState(0);
  const [swipePosition, setSwipePosition] = useState(0);
  const [isRebooting, setIsRebooting] = useState(false);
  const [rebootStep, setRebootStep] = useState<'off' | 'logo' | 'dots' | 'finished'>('finished');
  const twrpTerminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll TWRP terminal logs
  useEffect(() => {
    if (twrpTerminalEndRef.current) {
      twrpTerminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [twrpLogs]);

  // TWRP zip flashing simulation
  const runTwrpFlashing = () => {
    setTwrpStep('flashing');
    setTwrpProgress(0);
    setTwrpLogs([]);

    const flashSteps = [
      { log: "Updating partition details...", progress: 5, delay: 300 },
      { log: "...done", progress: 8, delay: 150 },
      { log: "Full OTA package detected.", progress: 12, delay: 200 },
      { log: "Installing zip file '/sdcard/aosp_src/Lumia_MSM8992_OTA.zip'", progress: 18, delay: 400 },
      { log: "Checking for MD5 file...", progress: 22, delay: 250 },
      { log: "Skipping MD5 check: no MD5 file found", progress: 25, delay: 150 },
      { log: "Verifying zip signature...", progress: 30, delay: 350 },
      { log: "I:Update binary zip splits: target 'msm8992_lumia' userdebug", progress: 35, delay: 200 },
      { log: "Erasing old system partition block allocations...", progress: 45, delay: 600 },
      { log: "Flashing boot.img (Custom Android 11 Linux Kernel)...", progress: 55, delay: 500 },
      { log: "Flashing system.img (AOSP Core + Jetpack Compose Lumia Launcher)...", progress: 70, delay: 800 },
      { log: "Flashing vendor.img (Rust lights_hal & audio_hal system binders)...", progress: 85, delay: 600 },
      { log: "Setting up Rust binder system service links in /system/bin/...", progress: 90, delay: 400 },
      { log: "Configuring hardware sysfs LED flashlight register max_brightness = 255...", progress: 95, delay: 300 },
      { log: "Applying SELinux file contexts: system/sepolicy/lights.te active.", progress: 98, delay: 250 },
      { log: "Script succeeded: result was [/system/bin/success]", progress: 100, delay: 200 },
      { log: "Successfully flashed custom Lumia AOSP ROM!", progress: 100, delay: 200 }
    ];

    let current = 0;
    const executeNext = () => {
      if (current < flashSteps.length) {
        const step = flashSteps[current];
        setTwrpLogs(prev => [...prev, `[TWRP] ${step.log}`]);
        setTwrpProgress(step.progress);
        if (playHapticSound) {
          playHapticSound(500 + step.progress * 4, 0.02, 'sine');
        }
        current++;
        setTimeout(executeNext, step.delay);
      } else {
        setTwrpStep('done');
        if (playHapticSound) {
          playHapticSound(880, 0.25, 'sine');
        }
      }
    };
    executeNext();
  };

  // Simulated Device reboot transition
  const runDeviceReboot = () => {
    setIsRebooting(true);
    setRebootStep('off');
    if (playHapticSound) playHapticSound(200, 0.2, 'sawtooth');

    // Step 1: Turn off (pitch black)
    setTimeout(() => {
      setRebootStep('logo');
      if (playHapticSound) playHapticSound(500, 0.05, 'sine');
      
      // Step 2: Show Nokia / Lumia bootlogo
      setTimeout(() => {
        setRebootStep('dots');
        if (playHapticSound) playHapticSound(650, 0.05, 'sine');

        // Step 3: Spinning / rolling circular dots
        setTimeout(() => {
          setRebootStep('finished');
          setIsRebooting(false);
          // Go back to homescreen tiles or active view with a nice notification!
          if (playHapticSound) playHapticSound(1000, 0.15, 'sine');
          // Update status / carrier as a fun easter-egg
          onUpdateSettings({ 
            carrierName: "LUMIA AOSP RUST"
          });
          
          addKernelLog('KERNEL', 'TWRP Boot Loader handoff: Booting fresh compiled custom ROM kernel image.');
          addKernelLog('HAL', 'Lumia AOSP Rust system binaries initialized. lights.primary.lumia binded.');
          addKernelLog('HAL', 'audio.primary.lumia registered with ALSA system mixer successfully.');
          
          setTwrpStep('menu'); // reset twrp flasher
          setSwipePosition(0);
          setActiveTab('hal-controllers'); // Switch to controllers so they can test their shiny new ROM!
        }, 3500); // 3.5s of spinning dots
      }, 2000); // 2s of static nokia logo
    }, 1500); // 1.5s of off blackscreen
  };

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

  // Auto-scroll compiler logs terminal
  useEffect(() => {
    if (compileTerminalEndRef.current) {
      compileTerminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [compileLogs]);

  // Simulate Android AOSP ROM build compilation pipeline
  const runAospROMCompilation = () => {
    if (isCompiling) return;
    
    setIsCompiling(true);
    setCompilationProgress(0);
    setCompileSuccess(false);
    setCompileLogs([]);

    const steps = [
      { log: "Initializing Lumia MSM8992 AOSP Environment...", progress: 5, delay: 350 },
      { log: "$ source build/envsetup.sh && lunch lumia_msm8992-userdebug", progress: 12, delay: 450 },
      { log: "Checking host build toolchains: clang v12.0.5, rustc v1.65.0, gradle v8.2...", progress: 20, delay: 400 },
      { log: "[1/6] Building low-level lights HAL service in Rust...", progress: 30, delay: 550 },
      { log: "  cargo build --manifest-path=/aosp_src/hal/lights_hal/Cargo.toml --target=aarch64-linux-android --release", progress: 38, delay: 350 },
      { log: "  Compiling core registers mapping modules...", progress: 42, delay: 250 },
      { log: "  Finished lights.primary.lumia HAL binary [target/aarch64-linux-android/release/lights.primary.lumia]", progress: 48, delay: 350 },
      { log: "[2/6] Building primary audio HAL codec driver interface in Rust...", progress: 54, delay: 500 },
      { log: "  Compiling audio_hal/src/main.rs using rust-android target links...", progress: 58, delay: 300 },
      { log: "  Finished audio.primary.lumia HAL subsystem C-bindings successfully.", progress: 64, delay: 350 },
      { log: "[3/6] Building Jetpack Compose Lumia SystemUI & Launcher (Kotlin)...", progress: 70, delay: 650 },
      { log: "  ./gradlew :app:assembleRelease --project-dir=/aosp_src/launcher", progress: 74, delay: 450 },
      { log: "  Applying theme alignments (Lumia Cyan/Magenta/Lime)...", progress: 78, delay: 250 },
      { log: "  Finished building system application: com.nokia.lumia.launcher.apk", progress: 82, delay: 350 },
      { log: "[4/6] Parsing BoardConfig.mk and compiling system image partitions...", progress: 88, delay: 550 },
      { log: "  Creating boot.img, system.img, and vendor.img system partition offsets...", progress: 92, delay: 450 },
      { log: "[5/6] Bundling AOSP target OTA files list into Lumia_MSM8992_OTA.zip...", progress: 96, delay: 500 },
      { log: "[6/6] Build finished! Flashable Android ROM ZIP generated.", progress: 100, delay: 300 }
    ];

    let currentStep = 0;
    
    const executeStep = () => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        setCompileLogs(prev => [...prev, `[BUILD] ${step.log}`]);
        setCompilationProgress(step.progress);
        
        if (playHapticSound) {
          playHapticSound(500 + step.progress * 3, 0.02, 'sine');
        }

        currentStep++;
        setTimeout(executeStep, step.delay);
      } else {
        setIsCompiling(false);
        setCompileSuccess(true);
        if (playHapticSound) playHapticSound(880, 0.15, 'sine');
      }
    };

    executeStep();
  };

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
            setActiveTab('aosp-code');
            if (playHapticSound) playHapticSound(600, 0.03, 'sine');
          }}
          className={`px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all rounded-none whitespace-nowrap ${
            activeTab === 'aosp-code' 
              ? `${activeTheme.bgClass} text-white font-bold` 
              : 'bg-zinc-950 hover:bg-zinc-900 text-gray-400'
          }`}
        >
          AOSP KOTLIN / RUST WORKSPACE
        </button>
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
        <button
          onClick={() => {
            setActiveTab('twrp-flasher');
            if (playHapticSound) playHapticSound(600, 0.03, 'sine');
          }}
          className={`px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all rounded-none whitespace-nowrap ${
            activeTab === 'twrp-flasher' 
              ? 'bg-purple-800 text-white font-bold animate-pulse' 
              : 'bg-zinc-950 hover:bg-zinc-900 text-purple-400/80 border border-purple-950/40'
          }`}
        >
          ⚡ TWRP RECOVERY FLASHER
        </button>
      </div>

      {/* Main Body Panel */}
      <div className="flex-1 min-h-0 bg-zinc-950 border border-zinc-900 p-4 relative rounded-none flex flex-col justify-between">
        
        {/* VIEW 0: AOSP Kotlin / Rust ROM DevSuite Workspace */}
        {activeTab === 'aosp-code' && (
          <div className="h-full flex flex-col lg:flex-row gap-4 min-h-0 rounded-none overflow-hidden">
            
            {/* Left Side: ROM Compiler Console & File tree */}
            <div className="lg:w-2/5 flex flex-col justify-between gap-4 shrink-0 min-h-0 rounded-none">
              
              {/* Box A: Project Structure Files tree */}
              <div className="bg-black border border-zinc-900 p-4 rounded-none flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3 rounded-none">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">AOSP ROM Workspace Tree</span>
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/20 px-2 py-0.5 border border-cyan-900/50 rounded-none">SOURCE IN SYNC</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Inspect the authentic system-level source files residing in your workspace under <code className="text-white">/aosp_src/</code>. These can be compiled here and exported directly to physical hardware!
                  </p>

                  <div className="space-y-1 rounded-none font-mono text-xs">
                    <button
                      onClick={() => {
                        setSelectedCodeFile('kotlin-launcher');
                        if (playHapticSound) playHapticSound(500, 0.02, 'sine');
                      }}
                      className={`w-full text-left p-2.5 flex items-center gap-2.5 transition-colors border rounded-none ${
                        selectedCodeFile === 'kotlin-launcher'
                          ? `${activeTheme.borderClass} bg-zinc-900 text-white font-bold`
                          : 'border-zinc-900 hover:bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-purple-400" />
                      <div className="truncate rounded-none">
                        <span className="text-[9px] text-zinc-600 block leading-none">JETPACK COMPOSE UI</span>
                        <span>launcher/MainActivity.kt</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCodeFile('rust-lights');
                        if (playHapticSound) playHapticSound(500, 0.02, 'sine');
                      }}
                      className={`w-full text-left p-2.5 flex items-center gap-2.5 transition-colors border rounded-none ${
                        selectedCodeFile === 'rust-lights'
                          ? `${activeTheme.borderClass} bg-zinc-900 text-white font-bold`
                          : 'border-zinc-900 hover:bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <Cpu className="w-4 h-4 text-orange-400" />
                      <div className="truncate rounded-none">
                        <span className="text-[9px] text-zinc-600 block leading-none">RUST BINDER HAL</span>
                        <span>hal/lights_hal/src/main.rs</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCodeFile('rust-audio');
                        if (playHapticSound) playHapticSound(500, 0.02, 'sine');
                      }}
                      className={`w-full text-left p-2.5 flex items-center gap-2.5 transition-colors border rounded-none ${
                        selectedCodeFile === 'rust-audio'
                          ? `${activeTheme.borderClass} bg-zinc-900 text-white font-bold`
                          : 'border-zinc-900 hover:bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <Volume2 className="w-4 h-4 text-blue-400" />
                      <div className="truncate rounded-none">
                        <span className="text-[9px] text-zinc-600 block leading-none">RUST ALSA STREAMER</span>
                        <span>hal/audio_hal/src/main.rs</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedCodeFile('board-config');
                        if (playHapticSound) playHapticSound(500, 0.02, 'sine');
                      }}
                      className={`w-full text-left p-2.5 flex items-center gap-2.5 transition-colors border rounded-none ${
                        selectedCodeFile === 'board-config'
                          ? `${activeTheme.borderClass} bg-zinc-900 text-white font-bold`
                          : 'border-zinc-900 hover:bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <div className="truncate rounded-none">
                        <span className="text-[9px] text-zinc-600 block leading-none">AOSP SNAPDRAGON CONFIG</span>
                        <span>device/BoardConfig.mk</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-900 text-[9px] text-zinc-500 font-sans leading-relaxed">
                  Export this entire Workspace workspace via the <strong className="text-zinc-400">Settings</strong> menu to get these exact source files as a flashable build skeleton!
                </div>
              </div>

              {/* Box B: Simulated AOSP Compilation Engine Terminal */}
              <div className="bg-black border border-zinc-900 p-4 rounded-none flex-1 min-h-0 flex flex-col justify-between">
                <div className="flex-1 min-h-0 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3 shrink-0 rounded-none">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">AOSP OTA Build Engine</span>
                    <span className="animate-pulse text-[9px] font-mono text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> COMPILER IDLE</span>
                  </div>

                  {/* Terminal stdout logs */}
                  <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-950 p-2.5 border border-zinc-900 text-[10px] font-mono leading-relaxed space-y-1 mb-3 min-h-[140px] max-h-[180px] rounded-none">
                    {compileLogs.length === 0 ? (
                      <div className="text-zinc-600 text-center py-12 select-none">
                        No active compilation. Click the build button below to start compiling your Rust &amp; Compose ROM target!
                      </div>
                    ) : (
                      compileLogs.map((log, idx) => (
                        <div key={idx} className="text-zinc-300 animate-fadeIn">
                          {log}
                        </div>
                      ))
                    )}
                    <div ref={compileTerminalEndRef} />
                  </div>
                </div>

                <div className="space-y-3 shrink-0 rounded-none">
                  {isCompiling && (
                    <div className="space-y-1.5 rounded-none">
                      <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                        <span>COMPILING ROM IMAGES:</span>
                        <span className={`font-bold ${activeTheme.textClass}`}>{compilationProgress}%</span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1 rounded-none overflow-hidden border border-zinc-800">
                        <div className={`h-full bg-cyan-400 ${activeTheme.bgClass} transition-all duration-300`} style={{ width: `${compilationProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {compileSuccess && !isCompiling && (
                    <div className="bg-green-950/20 text-green-400 p-2.5 border border-green-900/60 text-[11px] font-mono flex items-start gap-2 animate-fadeIn rounded-none">
                      <Check className="w-4 h-4 shrink-0" />
                      <div>
                        <strong className="block">ROM IMAGE COMPILED SUCCESSFULLY!</strong>
                        <span>Build file generated: <code className="text-white">/aosp_src/Lumia_MSM8992_OTA.zip</code> ready to deploy to TWRP/fastboot.</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={runAospROMCompilation}
                    disabled={isCompiling}
                    className={`w-full py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all rounded-none ${
                      isCompiling 
                        ? 'border-zinc-800 text-zinc-500 bg-zinc-950 cursor-not-allowed' 
                        : `${activeTheme.borderClass} ${activeTheme.bgClass} text-white hover:brightness-110`
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
                    {isCompiling ? "COMPILING TARGET ROM..." : "COMPILE FULL LUMIA AOSP IMAGE"}
                  </button>
                </div>
              </div>

            </div>

            {/* Right Side: Scrollable Code Editor */}
            <div className="flex-1 bg-black border border-zinc-900 p-4 flex flex-col justify-between min-h-0 rounded-none overflow-hidden">
              <div className="flex flex-col h-full min-h-0 justify-between">
                <div className="border-b border-zinc-900 pb-2 mb-3 shrink-0 flex items-center justify-between rounded-none">
                  <div>
                    <span className="text-[9px] font-mono text-cyan-400 tracking-wider uppercase block">AOSP SOURCE TREE VIEWER</span>
                    <h2 className="text-sm font-mono font-bold tracking-tight text-white uppercase">
                      {selectedCodeFile === 'kotlin-launcher' && "launcher/MainActivity.kt"}
                      {selectedCodeFile === 'rust-lights' && "hal/lights_hal/src/main.rs"}
                      {selectedCodeFile === 'rust-audio' && "hal/audio_hal/src/main.rs"}
                      {selectedCodeFile === 'board-config' && "device/BoardConfig.mk"}
                    </h2>
                  </div>
                  <span className="text-[9px] font-mono bg-zinc-900 px-2 py-0.5 text-zinc-500 border border-zinc-800 rounded-none">READ ONLY</span>
                </div>

                {/* Main scrollable editor window */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto no-scrollbar bg-zinc-950 border border-zinc-900/60 p-4 font-mono text-[11.5px] leading-relaxed text-cyan-300 rounded-none">
                  {selectedCodeFile === 'kotlin-launcher' && (
                    <pre className="text-purple-300">
                      <code>{`package com.nokia.lumia.launcher

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// Lumia Metro Themes
enum class LumiaTheme(val color: Color, val name: String) {
    CYAN(Color(0xFF00ABEC), "Lumia Cyan"),
    MAGENTA(Color(0xFFD80073), "Lumia Magenta"),
    LIME(Color(0xFF8CBF26), "Lumia Lime")
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LumiaOSTheme {
                LumiaLauncherScreen()
            }
        }
    }
}

@Composable
fun LumiaLauncherScreen() {
    var activeTheme by remember { mutableStateOf(LumiaTheme.CYAN) }
    var isAppDrawerOpen by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .padding(horizontal = 16.dp, vertical = 24.dp)
    ) {
        AnimatedContent(
            targetState = isAppDrawerOpen,
            transitionSpec = {
                if (targetState) {
                    slideInHorizontally(initialOffsetX = { it }) + fadeIn() with
                    slideOutHorizontally(targetOffsetX = { -it / 2 }) + fadeOut()
                } else {
                    slideInHorizontally(initialOffsetX = { -it / 2 }) + fadeIn() with
                    slideOutHorizontally(targetOffsetX = { it }) + fadeOut()
                }
            }
        ) { openDrawer ->
            if (openDrawer) {
                AppDrawerScreen(activeTheme, onBack = { isAppDrawerOpen = false })
            } else {
                HomeScreenTiles(activeTheme, onOpenDrawer = { isAppDrawerOpen = true })
            }
        }
    }
}`}</code>
                    </pre>
                  )}

                  {selectedCodeFile === 'rust-lights' && (
                    <pre className="text-amber-300">
                      <code>{`//! AOSP Hardware Abstraction Layer (HAL) for the Nokia Lumia Snapdragon 808 LED Backlight.
//! Implements a modern Binderized Android HAL architecture in Rust.
//! Handles sysfs manipulation of flashlight intensity registers cleanly.

use std::fs::{File, OpenOptions};
use std::io::{Write, Result as IoResult};
use std::path::Path;
use std::sync::{Arc, Mutex};

const SYSFS_LIGHT_BRIGHTNESS: &str = "/sys/class/leds/flashlight/brightness";
const SYSFS_LIGHT_MAX_BRIGHTNESS: &str = "/sys/class/leds/flashlight/max_brightness";

pub struct LumiaLightsHal {
    brightness_path: &'static str,
    max_brightness: u8,
    active_intensity: Arc<Mutex<u8>>,
}

impl LumiaLightsHal {
    pub fn new() -> Self {
        let max_brightness = Self::read_max_brightness().unwrap_or(255);
        Self {
            brightness_path: SYSFS_LIGHT_BRIGHTNESS,
            max_brightness,
            active_intensity: Arc::new(Mutex::new(0)),
        }
    }

    pub fn set_flashlight_intensity(&self, mut value: u8) -> IoResult<()> {
        if value > self.max_brightness {
            value = self.max_brightness;
        }

        // Lock mutex to update active memory map state
        {
            let mut intensity = self.active_intensity.lock().unwrap();
            *intensity = value;
        }

        let path = Path::new(self.brightness_path);
        if path.exists() {
            let mut file = OpenOptions::new()
                .write(true)
                .truncate(true)
                .open(path)?;
            
            writeln!(file, "{}", value)?;
            file.flush()?;
        }
        Ok(())
    }
}`}</code>
                    </pre>
                  )}

                  {selectedCodeFile === 'rust-audio' && (
                    <pre className="text-cyan-300">
                      <code>{`//! AOSP Primary Audio HAL module for Nokia Lumia Snapdragon 808.
//! Implemented in Rust to interface with ALSA kernel mixer nodes safely.

use std::fs::OpenOptions;
use std::io::{Write, Result as IoResult};
use std::path::Path;

const DEV_PCM_OUT: &str = "/dev/snd/pcm_out";

pub struct LumiaAudioHal {
    device_node: &'static str,
    sample_rate: u32,
    channels: u8,
}

impl LumiaAudioHal {
    pub fn new() -> Self {
        Self {
            device_node: DEV_PCM_OUT,
            sample_rate: 44100,
            channels: 2,
        }
    }

    pub fn open_output_stream(&self, frequency: u32, wave: AudioWaveform) -> IoResult<()> {
        let path = Path::new(self.device_node);
        if path.exists() {
            let mut device_file = OpenOptions::new()
                .write(true)
                .open(path)?;

            let mut sample_buffer = Vec::new();
            for t in 0..1024 {
                // Synthesize 16-bit stereo sinusoids...
                let phase = 2.0 * std::f64::consts::PI * (frequency as f64) * (t as f64) / (self.sample_rate as f64);
                let val = (phase.sin() * 32767.0) as i16;
                sample_buffer.extend_from_slice(&val.to_le_bytes());
            }

            device_file.write_all(&sample_buffer)?;
            device_file.flush()?;
        }
        Ok(())
    }
}`}</code>
                    </pre>
                  )}

                  {selectedCodeFile === 'board-config' && (
                    <pre className="text-teal-300">
                      <code>{`# BoardConfig.mk for Nokia Lumia MSM8992 AOSP Custom Build
# Defines low-level SoC features, partition mapping, and kernel variables.

TARGET_BOARD_PLATFORM := msm8992
TARGET_BOOTLOADER_BOARD_NAME := lumia

# Core Architecture Settings (Qualcomm Snapdragon 808 64-bit Hexa-Core)
TARGET_ARCH := arm64
TARGET_ARCH_VARIANT := armv8-a
TARGET_CPU_ABI := arm64-v8a

# File System Partition Sizes (Lumia 32GB Internal storage specs)
BOARD_BOOTIMAGE_PARTITION_SIZE := 33554432     # 32MB boot
BOARD_RECOVERYIMAGE_PARTITION_SIZE := 33554432 # 32MB recovery
BOARD_SYSTEMIMAGE_PARTITION_SIZE := 3221225472   # 3.0GB system

# Compile Rust HAL components into Android system binaries
TARGET_USES_RUST := true
BOARD_HAL_LIGHTS_RUST_BIN := lights.primary.lumia
BOARD_HAL_AUDIO_RUST_BIN := audio.primary.lumia`}</code>
                    </pre>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

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

        {/* VIEW 5: TWRP Recovery Flasher */}
        {activeTab === 'twrp-flasher' && (
          <div className="h-full flex flex-col bg-zinc-950 border border-purple-950 p-4 font-mono text-xs rounded-none select-none">
            {/* TWRP Header banner */}
            <div className="flex items-center justify-between border-b border-purple-900 pb-2 mb-4 shrink-0 rounded-none bg-purple-950/20 px-3 py-1.5 border border-purple-900/50">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping inline-block" />
                ▲ TEAM WIN RECOVERY PROJECT (TWRP) v3.0.2-0
              </span>
              <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">LUMIA MSM8992 EDITION</span>
            </div>

            {/* TWRP Main View Stage */}
            {twrpStep === 'menu' && (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div className="text-center py-3 border border-purple-900 bg-purple-950/10 mb-4 rounded-none px-4">
                  <p className="text-purple-300 font-bold text-sm mb-1 uppercase">TWRP Boot Loader Environment</p>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Flash your compiled Lumia ROM OTA image or wipe partitions here. To sync files, build your custom system image first in the <strong className="text-white">AOSP WORKSPACE</strong>.
                  </p>
                </div>

                {/* Grid of 8 classic TWRP big purple actions */}
                <div className="flex-1 grid grid-cols-2 gap-4 items-center">
                  <button
                    onClick={() => {
                      setTwrpStep('select-file');
                      if (playHapticSound) playHapticSound(600, 0.05, 'sine');
                    }}
                    className="h-20 bg-purple-900 hover:bg-purple-800 border border-purple-700 hover:border-purple-600 transition-all text-white font-bold text-center flex flex-col items-center justify-center gap-1 uppercase tracking-wider rounded-none"
                  >
                    <Folder className="w-5 h-5 text-purple-200" />
                    <span>Install</span>
                  </button>

                  <button
                    onClick={() => {
                      if (playHapticSound) playHapticSound(450, 0.08, 'triangle');
                      setTwrpLogs(prev => [...prev, `[TWRP] Partition Wipe: Dalvik-Cache cleared`, `[TWRP] Partition Wipe: /cache formatted`]);
                      alert("Dalvik Cache, /cache, and system logs have been fully wiped!");
                    }}
                    className="h-20 bg-zinc-900 hover:bg-zinc-800 border border-purple-950 hover:border-purple-900 transition-all text-purple-300 font-bold text-center flex flex-col items-center justify-center gap-1 uppercase tracking-wider rounded-none"
                  >
                    <RefreshCw className="w-5 h-5 text-purple-400" />
                    <span>Wipe</span>
                  </button>

                  <button
                    onClick={() => alert("Creating simulated system backup to /sdcard/TWRP/BACKUPS/... done!")}
                    className="h-20 bg-zinc-900 hover:bg-zinc-800 border border-purple-950 hover:border-purple-900 transition-all text-purple-300 font-bold text-center flex flex-col items-center justify-center gap-1 uppercase tracking-wider rounded-none"
                  >
                    <Binary className="w-5 h-5 text-purple-400" />
                    <span>Backup</span>
                  </button>

                  <button
                    onClick={() => alert("No backup archives detected on /sdcard.")}
                    className="h-20 bg-zinc-900 hover:bg-zinc-800 border border-purple-950 hover:border-purple-900 transition-all text-purple-300 font-bold text-center flex flex-col items-center justify-center gap-1 uppercase tracking-wider rounded-none"
                  >
                    <Zap className="w-5 h-5 text-purple-400" />
                    <span>Restore</span>
                  </button>

                  <button
                    onClick={() => alert("Simulated partitions: /system, /vendor, /data, /boot auto-mounted as Read/Write.")}
                    className="h-20 bg-zinc-900 hover:bg-zinc-800 border border-purple-950 hover:border-purple-900 transition-all text-purple-300 font-bold text-center flex flex-col items-center justify-center gap-1 uppercase tracking-wider rounded-none"
                  >
                    <Layers className="w-5 h-5 text-purple-400" />
                    <span>Mount</span>
                  </button>

                  <button
                    className="h-20 bg-zinc-900 opacity-50 cursor-not-allowed border border-purple-950 text-purple-400/50 font-bold text-center flex flex-col items-center justify-center gap-1 uppercase tracking-wider rounded-none"
                  >
                    <Sliders className="w-5 h-5" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setTwrpLogs(prev => [...prev, `[TWRP ADB-SIDELOAD] Shell listening...`]);
                      alert("TWRP recovery command console opened in background. Ready to receive ADB.");
                    }}
                    className="h-20 bg-zinc-900 hover:bg-zinc-800 border border-purple-950 hover:border-purple-900 transition-all text-purple-300 font-bold text-center flex flex-col items-center justify-center gap-1 uppercase tracking-wider rounded-none"
                  >
                    <Terminal className="w-5 h-5 text-purple-400" />
                    <span>Advanced</span>
                  </button>

                  <button
                    onClick={() => {
                      if (playHapticSound) playHapticSound(500, 0.05, 'sine');
                      runDeviceReboot();
                    }}
                    className="h-20 bg-red-950/80 hover:bg-red-900/80 border border-red-900 hover:border-red-700 transition-all text-red-200 font-bold text-center flex flex-col items-center justify-center gap-1 uppercase tracking-wider rounded-none"
                  >
                    <Power className="w-5 h-5 text-red-300" />
                    <span>Reboot</span>
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-900/50 text-[10px] text-zinc-500 flex justify-between rounded-none">
                  <span>MTP STACK: ACTIVE</span>
                  <span>BATTERY LEVEL: 100%</span>
                </div>
              </div>
            )}

            {twrpStep === 'select-file' && (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-purple-300 font-bold uppercase rounded-none border-b border-purple-900 pb-1.5">
                    <Folder className="w-4 h-4 text-purple-400" />
                    <span>Navigate: /sdcard/aosp_src/</span>
                  </div>

                  <div className="bg-black/50 border border-purple-900/50 divide-y divide-purple-950 rounded-none max-h-72 overflow-y-auto no-scrollbar">
                    {/* Parent Dir */}
                    <div 
                      onClick={() => {
                        setTwrpStep('menu');
                        if (playHapticSound) playHapticSound(500, 0.03, 'sine');
                      }}
                      className="p-3 hover:bg-purple-950/10 cursor-pointer flex items-center gap-2 text-zinc-400 transition-colors"
                    >
                      <Folder className="w-4 h-4" />
                      <span>.. (Up one level)</span>
                    </div>

                    {/* Stock Backup */}
                    <div className="p-3 opacity-50 flex items-center gap-2 text-zinc-500 justify-between">
                      <span className="flex items-center gap-2">
                        <Binary className="w-4 h-4 text-purple-600" />
                        <span>backup_stock_win_phone.win</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold text-zinc-600 bg-zinc-900 px-1.5 py-0.5 border border-zinc-800">Win10 Back</span>
                    </div>

                    {/* GAPPS */}
                    <div className="p-3 opacity-50 flex items-center gap-2 text-zinc-500 justify-between">
                      <span className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-purple-600" />
                        <span>gapps_arm64.zip</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold text-zinc-600 bg-zinc-900 px-1.5 py-0.5 border border-zinc-800">GApps v11</span>
                    </div>

                    {/* Lumia AOSP zip */}
                    <div 
                      onClick={() => {
                        if (!compileSuccess) {
                          alert("Warning: You must compile the Lumia OTA zip in the 'AOSP WORKSPACE' tab first to synchronize changes!");
                          return;
                        }
                        setTwrpStep('swipe-flash');
                        if (playHapticSound) playHapticSound(600, 0.05, 'sine');
                      }}
                      className={`p-3 cursor-pointer flex items-center gap-2 justify-between transition-colors ${
                        compileSuccess 
                          ? 'hover:bg-purple-900/20 text-white font-bold border border-purple-500/30' 
                          : 'opacity-40 text-zinc-500'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-purple-400" />
                        <span className={compileSuccess ? 'text-purple-300' : ''}>Lumia_MSM8992_OTA.zip</span>
                      </span>
                      <span>
                        {compileSuccess ? (
                          <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/20 px-2 py-0.5 border border-emerald-900/50">Ready to Flash</span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-950/20 px-2 py-0.5 border border-amber-900/50">Not Built</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => {
                      setTwrpStep('menu');
                      if (playHapticSound) playHapticSound(500, 0.03, 'sine');
                    }}
                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-purple-900 py-3 text-purple-300 font-bold uppercase text-center tracking-wider rounded-none"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {twrpStep === 'swipe-flash' && (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div className="space-y-4">
                  <div className="border border-purple-900 bg-purple-950/20 p-4 rounded-none space-y-2">
                    <p className="text-purple-300 font-bold text-sm border-b border-purple-900 pb-1.5 uppercase">Lumia ZIP Package Details</p>
                    <div className="space-y-1 text-xs">
                      <p><span className="text-zinc-500">File:</span> <strong className="text-white">Lumia_MSM8992_OTA.zip</strong></p>
                      <p><span className="text-zinc-500">Target:</span> <strong className="text-white">Nokia Lumia 950 (AOSP Port)</strong></p>
                      <p><span className="text-zinc-500">Kernel:</span> <strong className="text-white">Linux Kernel v4.14.117+ (Custom ARM64)</strong></p>
                      <p><span className="text-zinc-500">Vendor HALs:</span> <strong className="text-white">Rust lights.lumia &amp; audio.lumia</strong></p>
                      <p><span className="text-zinc-500">System Launcher:</span> <strong className="text-white">Kotlin / Compose Metro Launcher</strong></p>
                    </div>
                  </div>

                  <div className="border border-purple-900 p-3 bg-black rounded-none">
                    <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer text-xs">
                      <input type="checkbox" defaultChecked className="accent-purple-600 rounded-none w-4 h-4 border border-purple-900" />
                      <span>Verify ZIP package signature (recommended)</span>
                    </label>
                  </div>
                </div>

                {/* Tactile Slider confirming flash */}
                <div className="space-y-4">
                  <p className="text-center text-[10px] text-purple-400 font-bold uppercase tracking-wider animate-pulse">
                    Slide / Drag the arrow right to confirm flash
                  </p>

                  <div className="relative w-full h-14 bg-zinc-900 border border-purple-900 flex items-center justify-between rounded-none overflow-hidden px-1">
                    {/* Sliding track colored purple based on position */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-purple-800 transition-all" 
                      style={{ width: `${swipePosition}%` }} 
                    />

                    {/* Interactive drag slider handle */}
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={swipePosition}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSwipePosition(val);
                        if (val >= 100) {
                          runTwrpFlashing();
                        }
                      }}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />

                    <div className="absolute left-4 pointer-events-none text-purple-300 font-bold uppercase tracking-wider text-xs">
                      Swipe to Flash Custom ROM
                    </div>

                    <div 
                      className="absolute w-12 h-12 bg-purple-700 hover:bg-purple-600 border border-purple-500 flex items-center justify-center text-white font-black rounded-none transition-all"
                      style={{ left: `calc(${swipePosition}% * 0.84 + 4px)` }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setTwrpStep('select-file');
                      setSwipePosition(0);
                      if (playHapticSound) playHapticSound(500, 0.03, 'sine');
                    }}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-purple-900 py-2.5 text-purple-300 font-bold uppercase text-center tracking-wider rounded-none"
                  >
                    Back to file list
                  </button>
                </div>
              </div>
            )}

            {twrpStep === 'flashing' && (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div className="border border-purple-900 p-3 bg-purple-950/10 mb-4 rounded-none flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-purple-400 block uppercase font-bold tracking-wider">Flashing OTA ZIP File</span>
                    <span className="text-white font-bold text-xs">Installing Lumia_MSM8992_OTA.zip...</span>
                  </div>
                  <span className="text-purple-300 font-bold text-base">{twrpProgress}%</span>
                </div>

                {/* TWRP installation console */}
                <div className="flex-1 bg-black p-3 border border-purple-900 font-mono text-[10px] leading-relaxed overflow-y-auto no-scrollbar space-y-1 min-h-0 rounded-none mb-4">
                  {twrpLogs.map((log, idx) => (
                    <div key={idx} className="text-zinc-300">
                      <span className="text-purple-500 font-bold">I:</span> {log}
                    </div>
                  ))}
                  <div ref={twrpTerminalEndRef} />
                </div>

                {/* Live progress indicator bar */}
                <div className="w-full h-2 bg-zinc-900 border border-purple-900 overflow-hidden rounded-none mb-1">
                  <div className="h-full bg-purple-600 transition-all duration-150" style={{ width: `${twrpProgress}%` }} />
                </div>
              </div>
            )}

            {twrpStep === 'done' && (
              <div className="flex-1 flex flex-col justify-between min-h-0">
                <div className="text-center py-6 border border-emerald-900/50 bg-emerald-950/10 mb-4 rounded-none px-4 space-y-2">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 font-black text-xl mb-1">
                    ✓
                  </div>
                  <p className="text-emerald-400 font-bold text-sm uppercase">Installation Succeeded!</p>
                  <p className="text-zinc-400 text-xs leading-relaxed max-w-sm mx-auto">
                    The custom ROM with custom Kotlin Jetpack Compose Metro Launcher, Rust system lights_hal &amp; audio_hal modules, and Snapdragon 808 device profiles was successfully installed.
                  </p>
                </div>

                {/* Flashing post actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      if (playHapticSound) playHapticSound(600, 0.05, 'sine');
                      runDeviceReboot();
                    }}
                    className="w-full bg-purple-700 hover:bg-purple-600 border border-purple-500 py-3 text-white font-bold uppercase text-center tracking-wider rounded-none flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(128,0,128,0.3)]"
                  >
                    <Power className="w-4 h-4 text-white" />
                    <span>Reboot System ROM</span>
                  </button>

                  <button
                    onClick={() => {
                      setTwrpStep('menu');
                      setSwipePosition(0);
                      if (playHapticSound) playHapticSound(500, 0.03, 'sine');
                    }}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-purple-900 py-2.5 text-purple-300 font-bold uppercase text-center tracking-wider rounded-none"
                  >
                    Return to Main Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 4. REBOOT DEVICE FULL BLACK SCREEN OVERLAY */}
      {isRebooting && (
        <div className="absolute inset-0 bg-black z-[999] flex flex-col items-center justify-center font-sans">
          {rebootStep === 'off' && (
            <div className="animate-pulse text-zinc-800 font-mono text-[10px] tracking-widest uppercase">
              REBOOTING...
            </div>
          )}

          {rebootStep === 'logo' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.94 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ duration: 0.8 }}
              className="text-center space-y-4"
            >
              {/* Classic Nokia Style White Logo with elegant font */}
              <h1 className="text-white font-extrabold text-3xl tracking-[12px] uppercase font-sans">
                NOKIA
              </h1>
              <p className="text-zinc-500 font-light text-xs tracking-[4px] uppercase font-mono">
                Lumia
              </p>
            </motion.div>
          )}

          {rebootStep === 'dots' && (
            <div className="text-center space-y-8 flex flex-col items-center">
              {/* Windows Phone signature dots progress animation */}
              <div className="flex gap-2.5 items-center justify-center">
                {[0, 1, 2, 3, 4].map((dot) => (
                  <div 
                    key={dot}
                    className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-[dot-fly_1.6s_infinite_ease-in-out]"
                    style={{ animationDelay: `${dot * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-cyan-400 font-bold text-[10px] font-mono tracking-widest uppercase">
                Upgrading system partition blocks...
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
