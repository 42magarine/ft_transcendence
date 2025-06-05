declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: number;
            role: string;
        }
    }
}

// USER INTERFACES

export interface User {
    id?: number;
    username: string;
    email: string;
    name?: string;
    password?: string;
    role?: string;
    avatar?: string;
    emailVerified?: boolean;
    tf_one?: string;
    tf_two?: string;
    tf_three?: string;
    tf_four?: string;
    tf_five?: string;
    tf_six?: string;
    secret?: string;
    twoFAEnabled?: string;
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
    name?: string;
    password?: string;
    role?: string;
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

export interface ApiErrorResponse {
    error: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

// AUTH INTERFACES

export interface AuthResponse {
    message?: string;
    error?: string;
    requireTwoFactor?: boolean;
    userId?: number;
    username?: string;
}

export interface QRResponse {
    secret: string,
    qr: string
}

export interface RegisterCredentials {
    name: string;
    username: string;
    email: string;
    password: string;
    role?: string;
    avatar?: string;
    emailVerified?: boolean;
    twoFAEnabled?: boolean;
    secret?: string;
    tf_one?: string;
    tf_two?: string;
    tf_three?: string;
    tf_four?: string;
    tf_five?: string;
    tf_six?: string;
    googleSignIn?: boolean;
}

export interface JWTPayload {
    userId: string;
    role: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    requireTwoFactor?: boolean;
    userId?: number;
    username?: string;
}

export interface GoogleLoginBody {
    token: string;
}

// AVATAR INTERFACES

export interface ShapeOptions {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    rotate?: number;
}

export interface TextVisualizationOptions {
    width: number;
    height: number;
    backgroundColor?: string;
    useShapes?: boolean;
    maxShapes?: number;
    colorPalette?: string[];
    showText?: boolean;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
}

export interface PatternResult {
    pattern: string;
    rect: string;
}
