import { app } from "./app";
import { registerRoutes } from "./routes";
import express from "express";
import path from "path";
import fs from "fs";

// Register API routes
console.log("Registering routes...");
// We needs to await this at the top level for Vercel
await registerRoutes(app);
console.log("Routes registered.");

// Serve static files from the build directory
const distPath = path.join(process.cwd(), "dist", "public");

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

export default app;
