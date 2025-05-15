// types/auth.ts

export interface UserCredentials {
    username: string;
    password: string;
}

export interface RegisterCredentials {
    username: string;
    email: string;
    password: string;
    displayname?: string;
    role?: string;
    avatar?: string;
    secret?: string;
    tf_one?: string;
    tf_two?: string;
    tf_three?: string;
    tf_four?: string;
    tf_five?: string;
    tf_six?: string;
}

export interface JWTPayload {
    userID: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken?: string; // Optional for now
    requireTwoFactor?: boolean;
    userId?: number;
    username?: string;
}

export interface TwoFactorVerificationRequest {
    userId: number;
    code: string;
}

// Define 2FA response
export interface TwoFactorResponse {
    qr: string;
    secret: string;
}

// Available roles as enum for type safety
export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    MASTER = 'master'
}
