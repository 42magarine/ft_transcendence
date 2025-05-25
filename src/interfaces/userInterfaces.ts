export interface User {
    id?: number;
    username: string;
    email: string;
    displayname?: string;
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
}

export interface UserList {
    listAvatar: string;
    avatar: string;
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
    username: string;
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
