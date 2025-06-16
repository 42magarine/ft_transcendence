import QRCode from 'qrcode';
import speakeasy from 'speakeasy';
import { OAuth2Client } from 'google-auth-library';

import { AppDataSource } from "../DataSource.js";
import { MatchModel, UserModel } from "../models/MatchModel.js";
import { JWTPayload, RegisterCredentials, LoginCredentials, AuthTokens } from "../../interfaces/userManagementInterfaces.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashPW, verifyPW } from "../middleware/security.js";
import { deleteAvatar } from "../services/FileService.js";
import { EmailService } from "../services/EmailService.js";

export class UserService {
    private userRepo = AppDataSource.getRepository(UserModel);
    private matchRepo = AppDataSource.getRepository(MatchModel);
    private emailService = new EmailService();
    private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    async findAllUsers(): Promise<UserModel[]> {
        const users = await this.userRepo.find();
        return users;
    }

    async findUserByUsername(username: string): Promise<UserModel | null> {
        const user = await this.userRepo.findOneBy({ username });
        return user;
    }

    async findUserByEmail(email: string): Promise<UserModel | null> {
        const user = await this.userRepo.findOneBy({ email });
        return user;
    }

    async findUserById(id: number | null): Promise<UserModel | null> {
        if (id == null) {
            return null;
        }

        const user = await this.userRepo.findOneBy({ id });
        return user;
    }

    async createUser(userData: RegisterCredentials & { password: string, avatar?: string }): Promise<UserModel> {
        try {
            const existingEmail = await this.findUserByEmail(userData.email);
            if (existingEmail) {
                throw new Error('Email already exists');
            }

            const existingUsername = await this.findUserByUsername(userData.username);
            if (existingUsername) {
                throw new Error('Username already exists');
            }

            let user: RegisterCredentials;

            // Create user with verification token and emailVerified=false
            if (!userData.emailVerified) {
                const verificationToken = this.emailService.generateToken();

                await this.emailService.sendVerificationEmail(
                    userData.email,
                    userData.username,
                    verificationToken
                );

                user = this.userRepo.create({
                    ...userData,
                    role: 'user',
                    emailVerified: false,
                    verificationToken: verificationToken
                });
            }
            else {
                user = this.userRepo.create({
                    ...userData,
                    role: 'user',
                });
            }
            // console.log(user);
            const savedUser = await this.userRepo.save(user);
            return savedUser;

        }
        catch (error: any) {
            if (error.message === 'Email already exists' || error.message === 'Username already exists') {
                throw error;
            }
            throw new Error('Failed to create user');
        }
    }

    async updateUser(user: UserModel): Promise<UserModel> {
        try {
            const currentUser = await this.findUserById(user.id);
            if (!currentUser) {
                throw new Error('User not found');
            }

            // Check if avatar has changed, delete old avatar if needed
            if (user.avatar !== currentUser.avatar && currentUser.avatar) {
                try {
                    await deleteAvatar(currentUser.avatar);
                }
                catch (error) {
                    console.error('Avatar delete failed:', error);
                    // Continue with update even if avatar deletion fails
                }
            }

            // Master role cannot be changed
            if (currentUser.role === 'master') {
                user.role = 'master';
            }

            await this.userRepo.update(currentUser.id, user);
            const updatedUser = await this.findUserById(currentUser.id);
            if (!updatedUser) {
                throw new Error('Updated user not found');
            }

            return updatedUser;
        }
        catch (error) {
            throw new Error('Failed to update user');
        }
    }

    async deleteUser(userId: number): Promise<boolean> {
        try {
            const user = await this.findUserById(userId);
            if (!user) {
                return false;
            }

            if (user.role === 'master') {
                return false;
            }

            if (user.avatar) {
                try {
                    await deleteAvatar(user.avatar);
                }
                catch (error) {
                    console.error(`Error deleting avatar for user ${userId}:`, error);
                }
            }

            const result = await this.userRepo.delete(userId);
            return result.affected ? result.affected > 0 : false;
        }
        catch (error) {
            throw new Error('Failed to delete user');
        }
    }

    // Verify user email with token
    async verifyEmail(token: string): Promise<boolean> {
        const user = await this.userRepo.findOne({ where: { verificationToken: token } });
        if (!user) {
            throw new Error('Invalid verification token');
        }

        // Update user to mark email as verified
        user.emailVerified = true;
        user.verificationToken = undefined; // Clear the token
        await this.userRepo.save(user);

        return true;
    }

    // Request password reset
    async requestPasswordReset(email: string): Promise<boolean> {
        const user = await this.userRepo.findOne({ where: { email } });

        if (!user) {
            throw new Error('User not found');
        }

        // Generate reset token
        const resetToken = this.emailService.generateToken();
        const resetExpires = new Date();
        resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour

        // Save token and expiry to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await this.userRepo.save(user);

        // Send reset email
        try {
            await this.emailService.sendPasswordResetEmail(
                user.email,
                resetToken,
                user.username
            );
            return true;
        }
        catch (error) {
            console.error('Failed to send password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }

    // Verify reset token is valid
    async verifyResetToken(token: string): Promise<UserModel> {
        const user = await this.userRepo.findOne({
            where: { resetPasswordToken: token }
        });

        if (!user) {
            throw new Error('Invalid or expired reset token');
        }

        // Check if token has expired
        const now = new Date();
        if (user.resetPasswordExpires && user.resetPasswordExpires < now) {
            throw new Error('Reset token has expired');
        }

        return user;
    }

    // Reset password with token
    async resetPassword(token: string, newPassword: string): Promise<boolean> {
        // Verify token is valid
        const user = await this.verifyResetToken(token);

        // Hash new password
        const hashedPassword = await hashPW(newPassword);

        // Update user password
        user.password = hashedPassword;
        user.resetPasswordToken = undefined; // Clear reset token
        user.resetPasswordExpires = undefined; // Clear expiry

        await this.userRepo.save(user);
        return true;
    }

    private generateTokens(user: UserModel): AuthTokens {
        const payload: JWTPayload = {
            userId: user.id.toString(),
            role: user.role
        };

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(user.id.toString());

        return { accessToken, refreshToken };
    }

    async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            const { userId } = verifyRefreshToken(refreshToken);
            const user = await this.findUserById(parseInt(userId));
            if (!user) {
                throw new Error('User not found');
            }

            const payload: JWTPayload = {
                userId: user.id.toString(),
                role: user.role
            };
            return { accessToken: generateAccessToken(payload) };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async register(credentials: RegisterCredentials & { avatar?: string, secret?: string }) {
        try {
            const hashedPW = await hashPW(credentials.password);

            // Create user data with potential 2FA settings
            const userData: any = {
                ...credentials,
                password: hashedPW
            };

            // If secret is provided and 2FA token is valid, enable 2FA
            if (credentials.secret) {
                // Get the token from the tf_ fields if they exist
                const token = credentials.tf_one && credentials.tf_two && credentials.tf_three &&
                    credentials.tf_four && credentials.tf_five && credentials.tf_six ?
                    `${credentials.tf_one}${credentials.tf_two}${credentials.tf_three}${credentials.tf_four}${credentials.tf_five}${credentials.tf_six}` : '';

                if (token) {
                    const verified = speakeasy.totp.verify({
                        secret: credentials.secret,
                        encoding: 'base32',
                        token: token
                    });

                    if (verified) {
                        userData.twoFAEnabled = true;
                        userData.twoFASecret = credentials.secret;
                    }
                }
            }
            const user = await this.createUser(userData);
            return this.generateTokens(user);
        }
        catch (error) {
            throw error;
        }
    }

    async login(credentials: LoginCredentials) {
        const user = await this.findUserByEmail(credentials.email);
        if (!user || !await verifyPW(credentials.password, user.password)) {
            throw new Error('Invalid login data');
        }

        // Check if email is verified
        // if (!user.emailVerified) {
        //     throw new Error('Email not verified. Please check your email for verification link.');
        // }

        // Check if 2FA is enabled for this user
        if (user.twoFAEnabled && user.twoFASecret) {
            // Return a response indicating 2FA is required, but without generating a token yet
            return {
                requireTwoFactor: true,
                userId: user.id,
                username: user.username
            };
        }

        // Set user online status to true
        await this.setUserOnline(user.id, true);

        // If no 2FA, proceed with normal login
        return this.generateTokens(user);
    }

    async loginWithGoogle(token: string): Promise<{ accessToken: string }> {
        // Verify the Google ID token
        let payload;
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        }
        catch (error) {
            throw new Error('Invalid Google token');
        }

        // Validate payload structure
        if (!payload || !payload.email) {
            throw new Error('Invalid Google token payload');
        }

        // Try to find user in the database
        let user = await this.findUserByEmail(payload.email);
        if (!user) {
            // Create a new user if not found
            const username = payload.name ?? payload.email;
            const name = username;
            const avatar = payload.picture ?? '';
            const password = "null";  // todo

            user = await this.createUser({
                username,
                email: payload.email,
                password,
                name,
                role: 'user',
                avatar
            });
        }

        // Set user online status to true
        await this.setUserOnline(user.id, true);

        // Generate and return JWTs
        return this.generateTokens(user);
    }

    async logout(userId: number): Promise<void> {
        await this.setUserOnline(userId, false);
    }

    async setUserOnline(userId: number, online: boolean): Promise<void> {
        await this.userRepo.update(userId, { online });
    }

    // Add new method to verify 2FA code
    async verifyTwoFactorCode(userId: number, code: string): Promise<AuthTokens> {
        const user = await this.findUserById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        if (!user.twoFAEnabled || !user.twoFASecret) {
            throw new Error('Two-factor authentication is not enabled for this user');
        }

        // Verify the provided code
        const verified = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: 'base32',
            token: code
        });

        if (!verified) {
            throw new Error('Invalid two-factor authentication code');
        }

        // Code is valid, generate tokens
        return this.generateTokens(user);
    }

    async generateQR() {
        const secret = speakeasy.generateSecret();

        const otpauthUrl = secret.otpauth_url;
        const otpauthUrlBase = secret.base32;

        if (otpauthUrl && otpauthUrlBase) {
            const otpauthUrlData = await QRCode.toDataURL(otpauthUrl);
            if (otpauthUrlData) {
                return { qr: otpauthUrlData, secret: otpauthUrlBase };
            }
        }
        return null;
    }

    async findUserFriends(id: number): Promise<UserModel[]> {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['friends']
        });
        return user?.friends || [];
    }

    async addFriend(userId: number, username: string): Promise<void> {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['friends']
        });

        if (!user) {
            throw new Error('User not found');
        }

        const friend = await this.findUserByUsername(username);
        if (!friend) {
            throw new Error('Friend not found');
        }

        if (userId === friend.id) {
            throw new Error('Cannot add yourself as friend');
        }

        const isAlreadyFriend = user.friends.some(f => f.id === friend.id);
        if (isAlreadyFriend) {
            throw new Error('Already friends');
        }

        user.friends.push(friend);
        await this.userRepo.save(user);
    }

    async removeFriend(userId: number, friendId: number): Promise<void> {
        const user = await this.userRepo.findOne({
            where: { id: userId },
            relations: ['friends']
        });

        if (!user) {
            throw new Error('User not found');
        }

        user.friends = user.friends.filter(friend => friend.id !== friendId);
        await this.userRepo.save(user);
    }

    async getAllFinishedMatchesByUserId(userId: number) {
        const userExists = await this.userRepo.exists({ where: { id: userId } })
        if (!userExists) {
            throw new Error("User not found")
        }

        const matchHistory = await this.matchRepo.find({
            where: [
                { player1: { id: userId }, status: 'completed' },
                { player2: { id: userId }, status: 'completed' },
            ],
            relations: ['player1', 'player2', 'winner'],
            order: {
                createdAt: 'DESC',
            },
        });
        return matchHistory;
    }
}
