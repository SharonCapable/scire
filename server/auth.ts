import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import type { Express } from "express";

export function setupAuth(app: Express) {
    // Serialize user for session
    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUserById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    // Local Strategy (username/password)
    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const user = await storage.getUserByUsername(username);
                if (!user) {
                    return done(null, false, { message: "Incorrect username." });
                }

                // In production, use bcrypt to compare hashed passwords
                if (user.password !== password) {
                    return done(null, false, { message: "Incorrect password." });
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        })
    );

    // Google OAuth Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: "/auth/google/callback",
                },
                async (accessToken: string, refreshToken: string, profile: any, done: (err: any, user?: any) => void) => {
                    try {
                        // Check if user already exists with this Google ID
                        let user = await storage.getUserByGoogleId(profile.id);

                        if (!user) {
                            // Check if user exists with this email
                            const email = profile.emails?.[0]?.value;
                            if (email) {
                                user = await storage.getUserByEmail(email);
                            }

                            if (!user) {
                                // Create new user
                                user = await storage.createUser({
                                    username: profile.emails?.[0]?.value || `google_${profile.id}`,
                                    email: profile.emails?.[0]?.value,
                                    name: profile.displayName,
                                    picture: profile.photos?.[0]?.value,
                                    googleId: profile.id,
                                    provider: "google",
                                    isAdmin: false,
                                });
                            } else {
                                // Update existing user with Google ID
                                user = await storage.updateUser(user.id, {
                                    googleId: profile.id,
                                    provider: "google",
                                    picture: profile.photos?.[0]?.value,
                                    name: profile.displayName,
                                });
                            }
                        }

                        return done(null, user);
                    } catch (error) {
                        return done(error as Error);
                    }
                }
            )
        );
    }

    // Initialize passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Auth routes
    app.post("/auth/login", passport.authenticate("local"), (req, res) => {
        res.json({ user: req.user });
    });

    app.post("/auth/logout", (req, res) => {
        req.logout((err) => {
            if (err) {
                return res.status(500).json({ error: "Logout failed" });
            }
            res.json({ success: true });
        });
    });

    app.get("/auth/google", passport.authenticate("google", {
        scope: ["profile", "email"]
    }));

    app.get(
        "/auth/google/callback",
        passport.authenticate("google", { failureRedirect: "/login" }),
        (req, res) => {
            // Successful authentication, redirect to dashboard
            res.redirect("/dashboard");
        }
    );

    app.get("/api/auth/user", (req, res) => {
        if (req.isAuthenticated()) {
            res.json({ user: req.user });
        } else {
            res.status(401).json({ error: "Not authenticated" });
        }
    });
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: "Authentication required" });
}
