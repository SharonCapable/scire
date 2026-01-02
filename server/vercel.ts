import { app } from "./app";
import { registerRoutes } from "./routes";
import express from "express";
import path from "path";
import fs from "fs";

// Register API routes
console.log("Registering routes...");
await registerRoutes(app);
console.log("Routes registered.");

// Serve static files from the build directory
const distPath = path.join(process.cwd(), "dist", "public");

if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    // Hande SPA routing
    app.use("*", (_req, res) => {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send("Refreshed (Client build not found)");
        }
    });
}

export default app;
