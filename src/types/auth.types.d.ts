export interface UserCredentials {
    email: string;
    password: string;
}
export interface RegisterCredentials extends UserCredentials {
    username: string;
    displayName: string;
}
export interface TwoFactorInfo {
    secret: string;
    otpauthUrl: string;
    qrCodeUrl: string;
}
export interface JWTPayload {
    userID: string;
    email: string;
    role: string;
    userId?: number;
    type?: string;
}
export interface AuthTokens {
    accessToken: string;
}
