import { createClerkClient, verifyToken } from "@clerk/backend";
import { storage } from "./storage";
import type { Express, Request, Response, NextFunction } from "express";

// Initialize Clerk client
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Extend Express Request to include auth information
declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string;
                sessionId: string;
            };
            user?: any;
        }
    }
}

// Middleware to verify Clerk session and attach user
async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const sessionToken = req.headers.authorization?.replace("Bearer ", "");

        if (!sessionToken) {
            return res.status(401).json({ error: "No authorization token provided" });
        }

        // Verify the session token
        const verifiedToken = await verifyToken(sessionToken, {
            secretKey: process.env.CLERK_SECRET_KEY!,
        });

        if (!verifiedToken) {
            return res.status(401).json({ error: "Invalid session" });
        }

        req.auth = {
            userId: verifiedToken.sub,
            sessionId: verifiedToken.sid || "",
        };

        // Get or create user in our database
        let user = await storage.getUserByClerkId(verifiedToken.sub);

        if (!user) {
            // Fetch user details from Clerk
            const clerkUser = await clerkClient.users.getUser(verifiedToken.sub);

            // Create user in our database
            user = await storage.createUser({
                username: clerkUser.emailAddresses[0]?.emailAddress || `user_${verifiedToken.sub}`,
                email: clerkUser.emailAddresses[0]?.emailAddress,
                name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || undefined,
                picture: clerkUser.imageUrl,
                clerkId: verifiedToken.sub,
                provider: "clerk",
                isAdmin: false,
                onboardingCompleted: false,
            });
        }

        req.user = user;
        next();
    } catch (error: any) {
        console.error("Auth error:", error);
        return res.status(401).json({ error: "Authentication failed" });
    }
}

// Optional auth - doesn't fail if no token, just sets user if available
async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const sessionToken = req.headers.authorization?.replace("Bearer ", "");

        if (!sessionToken) {
            return next();
        }

        const verifiedToken = await verifyToken(sessionToken, {
            secretKey: process.env.CLERK_SECRET_KEY!,
        });

        if (verifiedToken) {
            req.auth = {
                userId: verifiedToken.sub,
                sessionId: verifiedToken.sid || "",
            };

            let user = await storage.getUserByClerkId(verifiedToken.sub);

            if (!user) {
                const clerkUser = await clerkClient.users.getUser(verifiedToken.sub);

                user = await storage.createUser({
                    username: clerkUser.emailAddresses[0]?.emailAddress || `user_${verifiedToken.sub}`,
                    email: clerkUser.emailAddresses[0]?.emailAddress,
                    name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || undefined,
                    picture: clerkUser.imageUrl,
                    clerkId: verifiedToken.sub,
                    provider: "clerk",
                    isAdmin: false,
                    onboardingCompleted: false,
                });
            }

            req.user = user;
        }

        next();
    } catch (error) {
        // Continue without auth on error
        next();
    }
}

export function setupAuth(app: Express) {
    // Get current user endpoint
    app.get("/api/auth/user", optionalAuth, async (req, res) => {
        if (req.user) {
            res.json({ user: req.user });
        } else {
            res.status(401).json({ error: "Not authenticated" });
        }
    });

    // Sync user from Clerk (called after sign-in/sign-up)
    app.post("/api/auth/sync", async (req, res) => {
        try {
            const sessionToken = req.headers.authorization?.replace("Bearer ", "");

            if (!sessionToken) {
                return res.status(401).json({ error: "No authorization token provided" });
            }

            const verifiedToken = await verifyToken(sessionToken, {
                secretKey: process.env.CLERK_SECRET_KEY!,
            });

            if (!verifiedToken) {
                return res.status(401).json({ error: "Invalid session" });
            }

            // Fetch user details from Clerk
            const clerkUser = await clerkClient.users.getUser(verifiedToken.sub);

            // Get or create user in our database
            let user = await storage.getUserByClerkId(verifiedToken.sub);

            if (!user) {
                // Check if user exists by email
                const email = clerkUser.emailAddresses[0]?.emailAddress;
                if (email) {
                    user = await storage.getUserByEmail(email);
                }

                if (!user) {
                    // Create new user
                    user = await storage.createUser({
                        username: clerkUser.emailAddresses[0]?.emailAddress || `user_${verifiedToken.sub}`,
                        email: clerkUser.emailAddresses[0]?.emailAddress,
                        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || undefined,
                        picture: clerkUser.imageUrl,
                        clerkId: verifiedToken.sub,
                        provider: "clerk",
                        isAdmin: false,
                        onboardingCompleted: false,
                    });
                } else {
                    // Link existing user with Clerk ID
                    user = await storage.updateUser(user.id, {
                        clerkId: verifiedToken.sub,
                        provider: "clerk",
                        picture: clerkUser.imageUrl,
                        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || user.name,
                    });
                }
            } else {
                // Update user info from Clerk
                user = await storage.updateUser(user.id, {
                    picture: clerkUser.imageUrl,
                    name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || user.name,
                    email: clerkUser.emailAddresses[0]?.emailAddress || user.email,
                });
            }

            res.json({ user });
        } catch (error: any) {
            console.error("Sync error:", error);
            res.status(500).json({ error: error.message || "Failed to sync user" });
        }
    });

    // Set user role endpoint (for onboarding)
    app.post("/api/auth/role", requireAuth, async (req, res) => {
        try {
            const { role } = req.body;
            const userId = req.user.id;

            if (!role || !["student", "educator"].includes(role)) {
                return res.status(400).json({ error: "Invalid role. Must be 'student' or 'educator'" });
            }

            const updatedUser = await storage.updateUser(userId, {
                role,
                isAdmin: role === "educator",
                onboardingCompleted: true,
            });

            if (!updatedUser) {
                return res.status(404).json({ error: "User not found" });
            }

            res.json({ user: updatedUser });
        } catch (error: any) {
            console.error("Role update error:", error);
            res.status(500).json({ error: error.message || "Failed to set role" });
        }
    });

    // Clerk webhook endpoint for user events
    app.post("/api/webhooks/clerk", async (req, res) => {
        const { type, data } = req.body;

        try {
            switch (type) {
                case "user.deleted":
                    // Handle user deletion
                    const userToDelete = await storage.getUserByClerkId(data.id);
                    if (userToDelete) {
                        await storage.deleteUser(userToDelete.id);
                    }
                    break;

                case "user.updated":
                    // Handle user update
                    const userToUpdate = await storage.getUserByClerkId(data.id);
                    if (userToUpdate) {
                        await storage.updateUser(userToUpdate.id, {
                            email: data.email_addresses?.[0]?.email_address,
                            name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || undefined,
                            picture: data.image_url,
                        });
                    }
                    break;
            }

            res.json({ received: true });
        } catch (error) {
            console.error("Webhook error:", error);
            res.status(500).json({ error: "Webhook processing failed" });
        }
    });
}

export { requireAuth, optionalAuth };
