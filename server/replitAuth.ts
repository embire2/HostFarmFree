import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser(async (serializedUser: Express.User, cb) => {
    try {
      // Load the complete user data from database to get the role
      const user = await storage.getUser((serializedUser as any).id);
      if (user) {
        // Merge the session data with the database user data
        cb(null, { ...serializedUser, ...user });
      } else {
        cb(null, serializedUser);
      }
    } catch (error) {
      cb(error, null);
    }
  });

  app.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;
  
  console.log('IsAuthenticated middleware - req.isAuthenticated():', req.isAuthenticated());
  console.log('IsAuthenticated middleware - user:', user ? JSON.stringify(user, null, 2) : 'null');
  console.log('IsAuthenticated middleware - session:', req.session?.id || 'no session');

  if (!req.isAuthenticated() || !user) {
    console.log('Authentication failed - isAuthenticated:', req.isAuthenticated(), 'user exists:', !!user);
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  console.log('✓ Authentication successful - user ID:', user.id, 'role:', user.role);
  console.log('IsAuthenticated middleware - checking token expiry...');
  
  // Skip token refresh logic for local users (they don't have OIDC tokens)
  if (!user.expires_at || !user.refresh_token) {
    console.log('✓ Local user or no token expiry, proceeding...');
    return next();
  }

  const now = Math.floor(Date.now() / 1000);
  console.log('IsAuthenticated middleware - now:', now, 'expires_at:', user.expires_at);
  
  if (now <= user.expires_at) {
    console.log('✓ Token still valid, proceeding...');
    return next();
  }

  console.log('IsAuthenticated middleware - token expired, attempting refresh...');
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    console.log('✗ No refresh token available');
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    console.log('✓ Token refreshed successfully');
    return next();
  } catch (error) {
    console.log('✗ Token refresh failed:', error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
