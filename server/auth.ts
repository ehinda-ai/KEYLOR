import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { storage } from "./storage";

declare module "express-session" {
  interface SessionData {
    isAuthenticated?: boolean;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "keylor-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  // Route de login
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    
    // Credentials d'administration (à configurer via variables d'environnement)
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Admin";
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Simbar1978@@";
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      req.session.isAuthenticated = true;
      return res.status(200).json({ success: true, user: { username } });
    }
    
    return res.status(401).json({ error: "Identifiants incorrects" });
  });

  // Route de logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Erreur lors de la déconnexion" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ success: true });
    });
  });

  // Route pour vérifier l'état de l'authentification
  app.get("/api/auth/check", (req, res) => {
    if (req.session.isAuthenticated) {
      return res.status(200).json({ authenticated: true, user: { username: "admin" } });
    }
    return res.status(401).json({ authenticated: false });
  });
}

// Middleware pour protéger les routes admin
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.isAuthenticated) {
    return next();
  }
  return res.status(401).json({ error: "Non authentifié" });
}
