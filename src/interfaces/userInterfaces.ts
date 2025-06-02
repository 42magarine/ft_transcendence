export interface User {
    id?: number;
    username: string;
    email: string;
    displayname?: string;
    password?: string;
    role?: string;
    avatar?: string;
    tf_one?: string;
    tf_two?: string;
    tf_three?: string;
    tf_four?: string;
    tf_five?: string;
    tf_six?: string;
    secret?: string;
    twoFAEnabled?: boolean;
    emailVerified?: boolean;
    listAvatar?: string;
    googleSignIn?: boolean;
    status: 'online' | 'offline';
}

export interface FriendList {
	id?: number;
	username: string;
	status: 'online' | 'offline';
}

export interface UserList {
    listAvatar?: string;
    avatar?: string;
    id?: number;
    username: string;
    email: string;
    displayname?: string;
    password?: string;
    role?: string;
}

export interface ApiErrorResponse {
    error: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    message?: string;
    error?: string;
    requireTwoFactor?: boolean;
    userId?: number;
    username?: string;
}

export interface PasswordResetRequest {
    email: string;
}

export interface PasswordResetConfirm {
    password: string;
    confirmPassword: string;
    token: string;
}

export interface QRResponse {
    secret: string,
    qr: string
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
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    requireTwoFactor?: boolean;
    userId?: number;
    username?: string;
}

export interface TwoFactorVerificationRequest {
    userId: number;
    code: string;
}

export interface TwoFactorResponse {
    qr: string;
    secret: string;
}

export interface GoogleLoginBody {
    token: string;
}

// Available roles as enum for type safety
export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    MASTER = 'master'
}
