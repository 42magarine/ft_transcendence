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
	role?: string; // Role property (optional during registration)
	avatar?: string; // Avatar path (optional during registration)
}

export interface JWTPayload {
	userID: string;
	email: string;
	role: string; // Role is required in the JWT payload
}

export interface AuthTokens {
	accessToken: string;
}

// Available roles as enum for type safety
export enum UserRole {
	USER = 'user',
	ADMIN = 'admin',
	MASTER = 'master'
}