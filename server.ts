import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

import Database from "better-sqlite3";
import dotenv from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 3000);
const JWT_SECRET = process.env.JWT_SECRET ?? "super-secret-change-me";
const TOKEN_TTL_SECONDS = 60 * 60; // 1h

const db = new Database("veritas.db");
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS form_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    age INTEGER NOT NULL,
    message TEXT,
    accepted_terms INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

type ApiError = {
  status: number;
  code: string;
  message: string;
};

type AuthPayload = {
  sub: number;
  email: string;
  iat: number;
  exp: number;
};

const requestCount = new Map<string, { count: number; startTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 100;

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64").toString("utf-8");
}

function signToken(payload: Omit<AuthPayload, "iat" | "exp">): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const completePayload: AuthPayload = {
    ...payload,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(completePayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${signature}`;
}

function verifyToken(token: string): AuthPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw <ApiError>{ status: 401, code: "INVALID_TOKEN", message: "Token malformado." };
  }

  const [encodedHeader, encodedPayload, providedSignature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (providedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw <ApiError>{ status: 401, code: "INVALID_TOKEN", message: "Assinatura do token inválida." };
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthPayload;
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw <ApiError>{ status: 401, code: "TOKEN_EXPIRED", message: "Token expirado." };
  }

  return payload;
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const passwordSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, passwordSalt, 100_000, 64, "sha512").toString("hex");
  return { hash, salt: passwordSalt };
}

function validateRegistrationInput(body: unknown): { name: string; email: string; password: string } {
  if (!body || typeof body !== "object") {
    throw <ApiError>{ status: 400, code: "INVALID_BODY", message: "Corpo da requisição inválido." };
  }

  const name = String((body as Record<string, unknown>).name ?? "").trim();
  const email = String((body as Record<string, unknown>).email ?? "").trim().toLowerCase();
  const password = String((body as Record<string, unknown>).password ?? "");

  if (name.length < 3) {
    throw <ApiError>{ status: 422, code: "INVALID_NAME", message: "Nome deve ter ao menos 3 caracteres." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw <ApiError>{ status: 422, code: "INVALID_EMAIL", message: "E-mail inválido." };
  }

  if (password.length < 8) {
    throw <ApiError>{ status: 422, code: "WEAK_PASSWORD", message: "Senha deve ter ao menos 8 caracteres." };
  }

  return { name, email, password };
}

function validateLoginInput(body: unknown): { email: string; password: string } {
  if (!body || typeof body !== "object") {
    throw <ApiError>{ status: 400, code: "INVALID_BODY", message: "Corpo da requisição inválido." };
  }

  const email = String((body as Record<string, unknown>).email ?? "").trim().toLowerCase();
  const password = String((body as Record<string, unknown>).password ?? "");

  if (!email || !password) {
    throw <ApiError>{ status: 422, code: "MISSING_CREDENTIALS", message: "Informe e-mail e senha." };
  }

  return { email, password };
}

function validateFormInput(body: unknown) {
  if (!body || typeof body !== "object") {
    throw <ApiError>{ status: 400, code: "INVALID_BODY", message: "Corpo da requisição inválido." };
  }

  const fullName = String((body as Record<string, unknown>).fullName ?? "").trim();
  const email = String((body as Record<string, unknown>).email ?? "").trim().toLowerCase();
  const ageRaw = (body as Record<string, unknown>).age;
  const message = String((body as Record<string, unknown>).message ?? "").trim();
  const acceptedTerms = Boolean((body as Record<string, unknown>).acceptedTerms);

  const age = Number(ageRaw);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (fullName.length < 3) {
    throw <ApiError>{ status: 422, code: "INVALID_FULL_NAME", message: "Nome completo inválido." };
  }
  if (!emailRegex.test(email)) {
    throw <ApiError>{ status: 422, code: "INVALID_EMAIL", message: "E-mail inválido." };
  }
  if (!Number.isInteger(age) || age < 18 || age > 120) {
    throw <ApiError>{ status: 422, code: "INVALID_AGE", message: "Idade deve ser um inteiro entre 18 e 120." };
  }
  if (message.length > 500) {
    throw <ApiError>{ status: 422, code: "MESSAGE_TOO_LONG", message: "Mensagem deve ter no máximo 500 caracteres." };
  }
  if (!acceptedTerms) {
    throw <ApiError>{ status: 422, code: "TERMS_REQUIRED", message: "É necessário aceitar os termos." };
  }

  return { fullName, email, age, message, acceptedTerms };
}

function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-XSS-Protection", "0");
  next();
}

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();

  const current = requestCount.get(ip);
  if (!current || now - current.startTime > RATE_LIMIT_WINDOW_MS) {
    requestCount.set(ip, { count: 1, startTime: now });
    return next();
  }

  current.count += 1;
  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: "RATE_LIMIT_EXCEEDED",
      message: "Muitas requisições. Tente novamente em instantes.",
    });
  }

  return next();
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Token de autenticação não informado.",
    });
  }

  const token = authorization.replace("Bearer ", "").trim();
  try {
    const payload = verifyToken(token);
    (req as Request & { user?: AuthPayload }).user = payload;
    return next();
  } catch (error) {
    const apiError = error as ApiError;
    return res.status(apiError.status ?? 401).json({
      error: apiError.code ?? "UNAUTHORIZED",
      message: apiError.message ?? "Não autorizado.",
    });
  }
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: "100kb" }));
  app.use(securityHeaders);
  app.use(rateLimiter);

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "Veritas API",
      timestamp: new Date().toISOString(),
    });
  });

  app.post("/api/auth/register", (req, res, next) => {
    try {
      const { name, email, password } = validateRegistrationInput(req.body);
      const existingUser = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: number } | undefined;
      if (existingUser) {
        throw <ApiError>{ status: 409, code: "EMAIL_IN_USE", message: "E-mail já cadastrado." };
      }

      const { hash, salt } = hashPassword(password);
      const insert = db
        .prepare("INSERT INTO users (name, email, password_hash, password_salt) VALUES (?, ?, ?, ?)")
        .run(name, email, hash, salt);

      res.status(201).json({
        id: insert.lastInsertRowid,
        name,
        email,
        message: "Usuário registrado com sucesso.",
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      const { email, password } = validateLoginInput(req.body);
      const user = db
        .prepare("SELECT id, email, password_hash, password_salt FROM users WHERE email = ?")
        .get(email) as { id: number; email: string; password_hash: string; password_salt: string } | undefined;

      if (!user) {
        throw <ApiError>{ status: 401, code: "INVALID_CREDENTIALS", message: "Credenciais inválidas." };
      }

      const { hash } = hashPassword(password, user.password_salt);
      if (hash !== user.password_hash) {
        throw <ApiError>{ status: 401, code: "INVALID_CREDENTIALS", message: "Credenciais inválidas." };
      }

      const token = signToken({ sub: user.id, email: user.email });
      res.json({ accessToken: token, tokenType: "Bearer", expiresIn: TOKEN_TTL_SECONDS });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/forms/validate", authMiddleware, (req, res, next) => {
    try {
      const payload = validateFormInput(req.body);
      res.json({ valid: true, payload });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/forms/submit", authMiddleware, (req, res, next) => {
    try {
      const payload = validateFormInput(req.body);
      const user = (req as Request & { user?: AuthPayload }).user;
      if (!user) {
        throw <ApiError>{ status: 401, code: "UNAUTHORIZED", message: "Usuário não autenticado." };
      }

      const insert = db
        .prepare(
          "INSERT INTO form_submissions (user_id, full_name, email, age, message, accepted_terms) VALUES (?, ?, ?, ?, ?, ?)",
        )
        .run(user.sub, payload.fullName, payload.email, payload.age, payload.message, Number(payload.acceptedTerms));

      res.status(201).json({
        id: insert.lastInsertRowid,
        message: "Formulário salvo com sucesso.",
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/forms", authMiddleware, (req, res) => {
    const user = (req as Request & { user?: AuthPayload }).user;
    const rows = db
      .prepare(
        `SELECT id, full_name AS fullName, email, age, message, accepted_terms AS acceptedTerms, created_at AS createdAt
         FROM form_submissions
         WHERE user_id = ?
         ORDER BY created_at DESC`,
      )
      .all(user?.sub) as Array<Record<string, unknown>>;

    res.json({ total: rows.length, data: rows });
  });

  app.use((error: ApiError, req: Request, res: Response, next: NextFunction) => {
    if (!error) return next();

    const status = error.status ?? 500;
    const code = error.code ?? "INTERNAL_SERVER_ERROR";
    const message = error.message ?? "Erro inesperado no servidor.";

    if (status >= 500) {
      console.error(error);
    }

    res.status(status).json({ error: code, message });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Veritas API running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Erro ao iniciar o servidor:", error);
  process.exit(1);
});
