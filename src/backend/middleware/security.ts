import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWTPayload } from "../../types/auth.js";
import { FastifyRequest, FastifyReply } from "fastify";

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

export async function verifyPW(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export async function verifyJWT(token: string): Promise<JWTPayload> {
	return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}

export const authenticate = async (request: FastifyRequest, reply : FastifyReply) => {
	try {
		const token = request.cookies.accessToken;
		if(!token) {
			return reply.code(401).send({error: 'Authentication required'});
		}
		const payload = await verifyJWT(token);
		if(!payload) {
			return reply.code(401).send({ error: 'Invalid auth token'});
		}

		request.user = {id: parseInt(payload.userID, 10), role: payload.role};
	}   catch (error) {
			return reply.code(401).send({error: 'Authentication failed'});
		}
};


// export async function verify2FA();

// export async function createQRCode2FA();
