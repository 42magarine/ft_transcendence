// Assuming this is your types/auth.ts file
// Adding or updating the role property in your types

export interface UserCredentials {
	username: string;
	email: string;
	password: string;
}

export interface RegisterCredentials extends UserCredentials {
	username: string;
	role?: string; // Role property (optional during registration)
}

export interface JWTPayload {
	userID: string;
	email: string;
	role: string; // Role is required in the JWT payload
}

export interface AuthTokens {
	accessToken: string;
	refreshToken?: string; // Optional for now since refresh tokens aren't implemented yet
}

// Optional: You might want to define available roles as constants or an enum
export enum UserRole {
	USER = 'user',
	ADMIN = 'admin',
	MASTER = 'master'
}