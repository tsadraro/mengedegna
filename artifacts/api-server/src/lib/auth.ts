import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomBytes, randomInt } from "crypto";

const SESSION_SECRET = process.env["SESSION_SECRET"];
if (!SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET environment variable is required but not set. " +
      "Set it to a long, random string before starting the server.",
  );
}
const JWT_SECRET: string = SESSION_SECRET;
const JWT_EXPIRES_IN = "30d";

export interface JwtPayload {
  userId: string;
  appId: string;
  email: string;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateOtp(): string {
  return randomInt(100000, 1000000).toString();
}

export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}
