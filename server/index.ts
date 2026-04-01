import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { closeDatabase } from "./db";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.disable("x-powered-by");

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
    limit: "1mb",
  }),
);

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

const REDACTED_LOG_KEYS = new Set([
  "token",
  "systemprompt",
  "password",
  "authorization",
  "apikey",
]);

function sanitizeForLog(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 300 ? `${value.slice(0, 300)}...[truncated]` : value;
  }

  if (Array.isArray(value)) {
    const sanitizedItems = value.slice(0, 20).map((item) => sanitizeForLog(item));
    if (value.length > 20) {
      sanitizedItems.push(`[truncated ${value.length - 20} items]`);
    }
    return sanitizedItems;
  }

  if (value && typeof value === "object") {
    const sanitizedObject: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      if (REDACTED_LOG_KEYS.has(key.toLowerCase())) {
        sanitizedObject[key] = "[REDACTED]";
      } else {
        sanitizedObject[key] = sanitizeForLog(nestedValue);
      }
    }
    return sanitizedObject;
  }

  return value;
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const includeResponseBody = process.env.NODE_ENV !== "production";
  let capturedJsonResponse: unknown;

  if (includeResponseBody) {
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (includeResponseBody && capturedJsonResponse !== undefined) {
        logLine += ` :: ${JSON.stringify(sanitizeForLog(capturedJsonResponse))}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  const listenOptions: Parameters<typeof httpServer.listen>[0] = {
    port,
    host: "0.0.0.0",
  };

  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }

  httpServer.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });

  let isShuttingDown = false;
  const shutdown = async (signal: "SIGINT" | "SIGTERM") => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    log(`received ${signal}, shutting down gracefully`);

    await new Promise<void>((resolve) => {
      httpServer.close((err) => {
        if (err) {
          console.error("Error closing HTTP server:", err);
        }
        resolve();
      });
    });

    try {
      await closeDatabase();
    } catch (err) {
      console.error("Error closing database:", err);
    }

    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
})();
