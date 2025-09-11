import { createServer } from "http";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
import { buildApp, setupWebSocketServer } from "./app.js";
import path from "path";
import { fileURLToPath } from "url";
// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables from the parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });
async function start() {
    // 1) Connect to MongoDB first
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "test", // ensure you hit your 'test' database
        });
        console.log("MongoDB connected to", mongoose.connection.name);
    }
    catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
    // 2) Build your Express + Vite app
    const app = buildApp();
    // Add health check endpoint for Railway
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'medusavr-backend',
            socketio: 'enabled'
        });
    });
    // 4) Create & start the server
    const server = createServer(app);
    // Only setup Vite in development mode (not in Docker production)
    if (process.env.NODE_ENV === "development" && !process.env.DOCKER_ENV) {
        try {
            console.log("Setting up Vite development server...");
            const viteModule = await import("./vite.server.js").catch(() => import("./vite.server"));
            await viteModule.setupVite(app, server);
            console.log("Vite development server setup complete");
        }
        catch (error) {
            console.warn("Vite development server setup failed:", error instanceof Error ? error.message : 'Unknown error');
            console.warn("This is normal in production or Docker environments");
        }
    }
    else {
        console.log("📦 Running in production mode - Vite dev server disabled");
    }
    const port = Number(process.env.PORT) || 5002;
    server.listen(port, "0.0.0.0", () => {
        console.log(`Server listening on http://0.0.0.0:${port}`);
        console.log(`Socket.IO server will be available at ws://0.0.0.0:${port}/socket.io/`);
        console.log('Async image generation service ready');
    });
    // Setup WebSocket server ONCE after server is listening
    setupWebSocketServer(server);
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('SIGTERM received, shutting down gracefully');
        server.close(() => {
            console.log('Server closed');
            mongoose.connection.close().then(() => {
                console.log('MongoDB connection closed');
                process.exit(0);
            });
        });
    });
    process.on('SIGINT', () => {
        console.log('SIGINT received, shutting down gracefully');
        server.close(() => {
            console.log('Server closed');
            mongoose.connection.close().then(() => {
                console.log('MongoDB connection closed');
                process.exit(0);
            });
        });
    });
}
start();
