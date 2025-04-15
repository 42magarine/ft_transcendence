import { JWTPayload } from '../../types/auth.types.js';
export declare function generateJWT(payload: JWTPayload): string;
export declare function hashPW(password: string): Promise<string>;
export declare function verifyPW(password: string, hash: string): Promise<boolean>;
export declare function verifyJWT(token: string): Promise<JWTPayload>;
