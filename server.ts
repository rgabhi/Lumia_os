import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Define system assistant tool functions
const broadcastIntentFunction: FunctionDeclaration = {
  name: "broadcastIntent",
  description: "Triggers or opens a system-wide application or action on the Lumia device using intent actions.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: "The intent action. Use 'android.intent.action.VIEW' for opening views or files, or 'android.intent.action.DIAL' for calling."
      },
      data: {
        type: Type.STRING,
        description: "The intent data URI. E.g., 'tel:555-0199' to dial, 'mailto:test@metro.com' to mail, 'metro://spotify' for music, 'metro://weather' for weather, 'metro://calendar' for calendar, 'metro://paint' for drawing studio, 'metro://calculator' for calculator, 'metro://maps' for maps navigation, 'metro://settings' for system configurations, 'metro://retro-games' for games."
      },
      extras: {
        type: Type.OBJECT,
        description: "Optional extras or key-value parameters to pass to the intent (e.g. subject, body, or phoneNumber)."
      }
    },
    required: ["action"]
  }
};

const changeAccentColorFunction: FunctionDeclaration = {
  name: "changeAccentColor",
  description: "Changes the Lumia device's visual Accent Color theme instantly.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      color: {
        type: Type.STRING,
        description: "The target accent color. Options: 'cyan', 'magenta', 'lime', 'orange', 'purple'."
      }
    },
    required: ["color"]
  }
};

const toggleSystemSettingFunction: FunctionDeclaration = {
  name: "toggleSystemSetting",
  description: "Toggles or updates system-wide Lumia configurations such as Flashlight, Airplane Mode, Bluetooth, or Sound.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      setting: {
        type: Type.STRING,
        description: "The name of the setting. Options: 'flashlightOn', 'airplaneMode', 'bluetoothEnabled', 'soundEnabled'."
      },
      value: {
        type: Type.BOOLEAN,
        description: "The target boolean value for the toggle."
      }
    },
    required: ["setting", "value"]
  }
};

// API Endpoint for Assistant
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const { messages, systemStatus } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid request payload. Expected 'messages' array." });
    }

    const lastMessage = messages[messages.length - 1]?.content || "";

    const statusContext = systemStatus 
      ? `\nCurrent Device Status:\n- Accent Color: ${systemStatus.accentColor}\n- Airplane Mode: ${systemStatus.airplaneMode ? 'ON' : 'OFF'}\n- Flashlight: ${systemStatus.flashlightOn ? 'ON' : 'OFF'}\n- Bluetooth: ${systemStatus.bluetoothEnabled ? 'ON' : 'OFF'}\n- Sound Effects: ${systemStatus.soundEnabled ? 'ON' : 'OFF'}\n- Wi-Fi: ${systemStatus.wifiConnected ? 'CONNECTED' : 'DISCONNECTED'}\n`
      : "";

    const systemInstruction = `You are "Cortana", the legendary, friendly, and ultra-slick AI Assistant deeply embedded in the Lumia Metro OS.
Your voice is helpful, calm, content-centric, and nostalgic to Windows Phone/Metro aesthetics.
You are extremely integrated into this simulated Lumia operating system. You can perform physical tasks on the user's behalf using your tools!

When asked to do something:
1. "Call [Name]" or "Dial [Number]" -> Call the 'broadcastIntent' tool with action 'android.intent.action.VIEW' and data 'tel:[number]' or 'tel:[contact's number]'.
2. "Open [app]", "Launch [app]", "Open the calculator/paint/maps/spotify/snake/calendar/weather/settings" -> Call 'broadcastIntent' with action 'android.intent.action.VIEW' and data 'metro://[app_id]'. App IDs include: 'paint', 'calculator', 'maps', 'retro-games', 'calendar', 'messages', 'spotify', 'outlook', 'weather', 'settings', 'photos', 'camera', 'phone'.
3. "Change theme to magenta/cyan/lime/orange/purple" -> Call 'changeAccentColor' with the requested color.
4. "Turn on/off the flashlight", "turn on airplane mode", "turn on bluetooth", etc. -> Call 'toggleSystemSetting' with the target setting name and target value.

You have access to the following current simulated device status:${statusContext}

Provide concise, friendly responses, confirming any action you've initiated.`;

    // Map history to Google GenAI SDK parts
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // List of model aliases to try sequentially
    const MODEL_CANDIDATES = ["gemini-2.5-flash", "gemini-2.5-pro"];
    let responseText = "";
    let functionCalls: any[] | null = null;
    let apiCallSuccessful = false;
    let lastErrorMsg = "";

    const ai = getGeminiClient();

    // Check if key is available
    if (process.env.GEMINI_API_KEY) {
      for (const modelName of MODEL_CANDIDATES) {
        try {
          console.log(`Attempting Cortana request using model: ${modelName}`);
          const apiResponse = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              tools: [{
                functionDeclarations: [
                  broadcastIntentFunction,
                  changeAccentColorFunction,
                  toggleSystemSettingFunction
                ]
              }]
            }
          });

          responseText = apiResponse.text || "";
          functionCalls = apiResponse.functionCalls || null;
          apiCallSuccessful = true;
          console.log(`Cortana request SUCCEEDED with model: ${modelName}`);
          break; // Break loop on success
        } catch (err: any) {
          lastErrorMsg = err.message || String(err);
          console.warn(`Model ${modelName} failed or busy: ${lastErrorMsg}`);
        }
      }
    } else {
      console.warn("No GEMINI_API_KEY configured. Falling back to Cortana offline protocol.");
    }

    // Elegant simulated response fallback if ALL API attempts fail (e.g. 503 high demand) or key is missing
    if (!apiCallSuccessful) {
      console.log("Using local offline Cortana rule-based backup parser...");
      const normalized = lastMessage.toLowerCase();
      responseText = "I'm running on Cortana local backup protocol. I can still help you control your Lumia device!";
      
      if (normalized.includes("magenta")) {
        responseText = "Understood. I am changing your device accent color to magenta right away.";
        functionCalls = [{ name: "changeAccentColor", args: { color: "magenta" } }];
      } else if (normalized.includes("cyan")) {
        responseText = "Switching your Lumia theme to cyan.";
        functionCalls = [{ name: "changeAccentColor", args: { color: "cyan" } }];
      } else if (normalized.includes("lime")) {
        responseText = "Setting system accent to lime green.";
        functionCalls = [{ name: "changeAccentColor", args: { color: "lime" } }];
      } else if (normalized.includes("orange")) {
        responseText = "Changing the live tiles to orange.";
        functionCalls = [{ name: "changeAccentColor", args: { color: "orange" } }];
      } else if (normalized.includes("purple")) {
        responseText = "Applying purple theme to your start screen.";
        functionCalls = [{ name: "changeAccentColor", args: { color: "purple" } }];
      } else if (normalized.includes("flashlight")) {
        const target = normalized.includes("off") ? false : true;
        responseText = `Turning the flashlight ${target ? 'on' : 'off'} for you.`;
        functionCalls = [{ name: "toggleSystemSetting", args: { setting: "flashlightOn", value: target } }];
      } else if (normalized.includes("airplane")) {
        const target = normalized.includes("off") || normalized.includes("disable") ? false : true;
        responseText = `Lumia network status: turning Airplane Mode ${target ? 'on' : 'off'}.`;
        functionCalls = [{ name: "toggleSystemSetting", args: { setting: "airplaneMode", value: target } }];
      } else if (normalized.includes("bluetooth")) {
        const target = normalized.includes("off") || normalized.includes("disable") ? false : true;
        responseText = `Bluetooth is now ${target ? 'enabled' : 'disabled'}.`;
        functionCalls = [{ name: "toggleSystemSetting", args: { setting: "bluetoothEnabled", value: target } }];
      } else if (normalized.includes("sound")) {
        const target = normalized.includes("off") || normalized.includes("mute") ? false : true;
        responseText = `System sounds are now ${target ? 'on' : 'muted'}.`;
        functionCalls = [{ name: "toggleSystemSetting", args: { setting: "soundEnabled", value: target } }];
      } else if (normalized.includes("paint") || normalized.includes("draw")) {
        responseText = "Opening the Paint Studio app.";
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: "metro://paint" } }];
      } else if (normalized.includes("calc") || normalized.includes("math")) {
        responseText = "Launching your Calculator.";
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: "metro://calculator" } }];
      } else if (normalized.includes("weather")) {
        responseText = "Opening the Weather app to check the forecast.";
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: "metro://weather" } }];
      } else if (normalized.includes("calendar")) {
        responseText = "Opening calendar schedules.";
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: "metro://calendar" } }];
      } else if (normalized.includes("spotify") || normalized.includes("music") || normalized.includes("song")) {
        responseText = "Starting Spotify Music.";
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: "metro://spotify" } }];
      } else if (normalized.includes("setting")) {
        responseText = "Launching System Settings panel.";
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: "metro://settings" } }];
      } else if (normalized.includes("map") || normalized.includes("navigate") || normalized.includes("direction")) {
        responseText = "Opening Lumia Maps navigation.";
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: "metro://maps" } }];
      } else if (normalized.includes("game") || normalized.includes("snake") || normalized.includes("retro")) {
        responseText = "Opening Retro Snake game hub!";
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: "metro://retro-games" } }];
      } else if (normalized.includes("message") || normalized.includes("chat") || normalized.includes("sms")) {
        responseText = "Opening Messaging center.";
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: "metro://messages" } }];
      } else if (normalized.includes("mail") || normalized.includes("email") || normalized.includes("outlook")) {
        responseText = "Checking your Outlook mail account.";
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: "metro://outlook" } }];
      } else if (normalized.includes("photo") || normalized.includes("gallery") || normalized.includes("image")) {
        responseText = "Opening Lumia Photos Hub.";
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: "metro://photos" } }];
      } else if (normalized.includes("camera") || normalized.includes("picture") || normalized.includes("photo shoot")) {
        responseText = "Launching the Lumia Camera.";
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: "metro://camera" } }];
      } else if (normalized.includes("phone") || normalized.includes("dial") || normalized.includes("call")) {
        const numMatch = lastMessage.match(/\d+[\d-]*\d+/);
        const num = numMatch ? numMatch[0] : "555-0199";
        responseText = `Initiating dialer request for ${num}...`;
        functionCalls = [{ name: "broadcastIntent", args: { action: "android.intent.action.VIEW", data: `tel:${num}` } }];
      } else {
        if (normalized.includes("hello") || normalized.includes("hi") || normalized.includes("hey")) {
          responseText = "Hello! I'm here. Although my neural cloud connection is busy, my local core is fully operational! Ask me to change themes, toggle flashlight, or open any apps.";
        } else if (normalized.includes("who are you") || normalized.includes("your name")) {
          responseText = "I am Cortana, your intelligent companion on this Lumia OS. Currently running in offline protocol mode.";
        } else if (normalized.includes("thank")) {
          responseText = "You're very welcome! Let me know if you need anything else on your Lumia.";
        } else if (normalized.includes("weather")) {
          responseText = "The weather seems bright and clear today on local sensors! Check out the weather app tile for full live details.";
        } else {
          responseText = `Cortana Core: I received "${lastMessage}". (Currently running offline fallback). Try: 'change theme to magenta', 'turn on flashlight', or 'open Paint'.`;
        }
      }
    }

    res.json({
      text: responseText,
      functionCalls
    });
  } catch (err: any) {
    console.error("Gemini assistant API error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Setup Vite Dev Server / Static Asset Handler
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lumia Metro OS Server is running on http://localhost:${PORT}`);
  });
}

startServer();
