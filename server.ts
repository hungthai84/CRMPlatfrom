import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser, getSessionLogsByEmail, syncSessionLog, clearSessionLogsByEmail } from "./src/db/helpers.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use((req, res, next) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // API Route for AI Chat Assistant
  app.post("/api/chat", async (req, res) => {
    try {
      const { prompt, context } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is missing" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are Power Service CRM Copilot, an AI assistant. You help users navigate the CRM, answer questions about their data, and provide insights. Use the following context to inform your answer: ${context}`,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

  // DB Synchronization and Verification Endpoints
  app.post("/api/users/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const email = req.user.email || 'unknown@example.com';
      const user = await getOrCreateUser(req.user.uid, email);
      res.json({ success: true, user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sessions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const email = req.user.email || 'unknown@example.com';
      const logs = await getSessionLogsByEmail(email);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sessions/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const email = req.user.email || 'unknown@example.com';
      const { sessionId, loginTime, logoutTime, activeTime, status } = req.body;
      
      if (!sessionId || !loginTime) {
        return res.status(400).json({ error: "Missing required session synchronization data." });
      }

      const log = await syncSessionLog({
        sessionId,
        email,
        loginTime,
        logoutTime,
        activeTime,
        status,
      });
      res.json({ success: true, log });
    } catch (error: any) {
      console.error("Session sync route error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sessions/clear", requireAuth, async (req: AuthRequest, res) => {
    try {
      const email = req.user.email || 'unknown@example.com';
      await clearSessionLogsByEmail(email);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
