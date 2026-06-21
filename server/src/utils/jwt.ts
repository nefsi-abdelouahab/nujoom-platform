import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { UserRole } from "../models/User";

export interface JwtPayload {
  userId: string;
  role: UserRole;
  activeCommitteeId?: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET غير معرّف في متغيرات البيئة");
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, getSecret(), { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}

export function toObjectId(id: string) {
  return new Types.ObjectId(id);
}