import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
// Token generation functions for JWT/ password hashing
export function generateJWT(payload) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET ENV variable not set');
    }
    return jwt.sign(payload, secret, { expiresIn: '1h' });
}
export async function hashPW(password) {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
}
// Token authentication / checking functions for JWT / password hash
export async function verifyPW(password, hash) {
    return bcrypt.compare(password, hash);
}
export async function verifyJWT(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}
