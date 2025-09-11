//vite.config.js
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import viteConfig from "./vite.config.js";

/**
 * Simple timestamped logger for Express/Vite integration
 */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Sets up Vite in middleware mode for development:
 *  - Creates a Vite server with middlewareMode=true
 *  - Mounts vite.middlewares on the provided Express app
 *  - Serves index.html (with hot-reload query param) for all routes
 */
export async function setupVite(app: Express, server: Server) {
  // Dynamic imports to avoid bundling vite in production
  const { createServer: createViteServer, createLogger } = await import("vite");
  const { nanoid } = await import("nanoid");
  
  const viteLogger = createLogger();
  
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg: any, options: any) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Use Vite's dev server middleware
  app.use(vite.middlewares);

  // For any route, load index.html from disk, inject a nanoid query on main.tsx for HMR cache-busting
  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const clientTemplatePath = path.resolve(
        // Use __dirname for CommonJS
        __dirname,
        "..",
        "client",
        "index.html"
      );

      let template = await fs.promises.readFile(clientTemplatePath, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
