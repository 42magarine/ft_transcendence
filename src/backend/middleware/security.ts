import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../../interfaces/authInterfaces.js";
import { FastifyRequest, FastifyReply } from "fastify";

export function generateAccessToken(payload: JWTPayload): string {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET not set');
    }
    return jwt.sign(payload, secret, { expiresIn: '1h' });
}

export function generateRefreshToken(userId: string): string {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) {
        throw new Error('REFRESH_TOKEN_SECRET not set');
    }
    return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): JWTPayload {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
        throw new Error('ACCESS_TOKEN_SECRET not set');
    }
    return jwt.verify(token, secret) as JWTPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) {
        throw new Error('REFRESH_TOKEN_SECRET not set');
    }
    return jwt.verify(token, secret) as { userId: string };
}

export async function hashPW(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
}

export async function verifyPW(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function authenticateToken(request: FastifyRequest, reply: FastifyReply) {
    try {
        const token = request.cookies.accessToken;
        if (!token) {
            return reply.code(401).send({ error: 'Access token required' });
        }

        const payload = verifyAccessToken(token);
        if (!payload) {
            return reply.code(401).send({ error: 'Invalid Access token' });
        }

        request.user = { id: parseInt(payload.userID, 10), role: payload.role };
    }
    catch (error) {
        return reply.code(403).send({ error: 'Invalid or expired token' });
    }
}

// export async function verify2FA();
// export async function createQRCode2FA();
