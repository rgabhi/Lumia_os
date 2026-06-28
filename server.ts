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

    const ai = getGeminiClient();
    
    // Construct system instructions with real Lumia OS contexts
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

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        tools: [{
          functionDeclarations: [
            broadcastIntentFunction,
            changeAccentColorFunction,
            toggleSystemSettingFunction
          ]
        }],
        toolConfig: { includeServerSideToolInvocations: true }
      }
    });

    const text = response.text || "";
    const functionCalls = response.functionCalls || null;

    res.json({
      text,
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
