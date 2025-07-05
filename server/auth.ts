import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Anonymous registration utilities
function generateUsername(): string {
  const adjectives = ["brave", "swift", "clever", "bright", "quiet", "bold", "wise", "calm", "sharp", "free"];
  const nouns = ["fox", "eagle", "wolf", "bear", "lion", "hawk", "owl", "deer", "tiger", "shark"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 9999) + 1;
  return `${adjective}${noun}${number}`;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function generateRecoveryPhrase(): string {
  const words = [
    "ocean", "mountain", "forest", "river", "sunset", "thunder", "crystal", "diamond", "silver", "golden",
    "storm", "breeze", "shadow", "light", "dream", "magic", "wonder", "mystic", "cosmic", "stellar",
    "phoenix", "dragon", "wizard", "knight", "castle", "tower", "bridge", "portal", "voyage", "quest"
  ];
  
  const phrase = [];
  for (let i = 0; i < 6; i++) {
    phrase.push(words[Math.floor(Math.random() * words.length)]);
  }
  return phrase.join("-");
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fallback-secret-for-dev",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
      tableName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Try to find user by username first
        let user = await storage.getUserByUsername(username);
        
        // If not found by username and the input looks like an email, try by email
        if (!user && username.includes('@')) {
          user = await storage.getUserByEmail(username);
        }
        
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Anonymous registration endpoint
  app.post("/api/register-anonymous", async (req, res, next) => {
    try {
      let username: string;
      let attempts = 0;
      const maxAttempts = 10;

      // Generate unique username
      do {
        username = generateUsername();
        const existingUser = await storage.getUserByUsername(username);
        if (!existingUser) break;
        attempts++;
      } while (attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        return res.status(500).json({ message: "Unable to generate unique username. Please try again." });
      }

      const password = generatePassword();
      const recoveryPhrase = generateRecoveryPhrase();

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        recoveryPhrase,
        isAnonymous: true,
        role: "client",
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          username: user.username,
          password: password, // Return plain password for user to save
          recoveryPhrase: recoveryPhrase,
          role: user.role,
          isAnonymous: true,
          message: "Anonymous account created! Please save your username, password, and recovery phrase."
        });
      });

    } catch (error) {
      console.error("Anonymous registration error:", error);
      res.status(500).json({ message: "Failed to create anonymous account" });
    }
  });

  // Traditional registration endpoint (keep for admin accounts)
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
        firstName,
        lastName,
        isAnonymous: false,
        role: "client",
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
          id: user.id, 
          username: user.username, 
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role 
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Account recovery endpoint
  app.post("/api/recover-account", async (req, res) => {
    try {
      const { recoveryPhrase } = req.body;

      if (!recoveryPhrase) {
        return res.status(400).json({ message: "Recovery phrase is required" });
      }

      const user = await storage.getUserByRecoveryPhrase(recoveryPhrase);
      if (!user) {
        return res.status(404).json({ message: "Invalid recovery phrase" });
      }

      // Return the username and generate a new password for security
      const newPassword = generatePassword();
      await storage.updateUser(user.id, {
        password: await hashPassword(newPassword),
      });

      res.status(200).json({
        username: user.username,
        newPassword: newPassword,
        recoveryPhrase: user.recoveryPhrase,
        message: "Account recovered! A new password has been generated for security."
      });

    } catch (error) {
      console.error("Account recovery error:", error);
      res.status(500).json({ message: "Account recovery failed" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const user = req.user as SelectUser;
    res.status(200).json({ 
      id: user.id, 
      username: user.username, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      displayPassword: user.displayPassword,
      recoveryPhrase: user.recoveryPhrase,
      isAnonymous: user.isAnonymous
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      // Destroy the session completely
      req.session.destroy((err) => {
        if (err) return next(err);
        // Clear the session cookie
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    res.json({ 
      id: user.id, 
      username: user.username, 
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      displayPassword: user.displayPassword,
      recoveryPhrase: user.recoveryPhrase,
      isAnonymous: user.isAnonymous
    });
  });
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export { hashPassword, comparePasswords, generateUsername, generatePassword, generateRecoveryPhrase };