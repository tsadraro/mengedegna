import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const extraOrigins: string[] = (process.env["ALLOWED_ORIGINS"] ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isOriginAllowed(origin: string): boolean {
  // Replit preview proxy and local dev
  if (
    origin === "http://localhost" ||
    origin === "http://127.0.0.1" ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:")
  ) return true;

  // All Replit dev and deployed domains
  if (origin.endsWith(".replit.dev") || origin.endsWith(".replit.app"))
    return true;

  // Any explicitly listed extra origins
  if (extraOrigins.includes(origin)) return true;

  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server requests (no Origin header)
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
