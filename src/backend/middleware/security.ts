import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../../types/auth.js";

// Token generation functions for JWT/ password hashing

export function generateJWT(payload: JWTPayload): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET ENV variable not set');
    }
    return jwt.sign(payload, secret, { expiresIn: '1h' });
}

export async function hashPW(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
}

// Token authentication / checking functions for JWT / password hash

export async function verifyPW(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}


// export async function verify2FA();

// export async function createQRCode2FA();
