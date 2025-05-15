import { AppDataSource } from "../DataSource.js";
import { UserModel } from "../models/MatchModel.js";
import { JWTPayload, RegisterCredentials, UserCredentials, AuthTokens } from "../../interfaces/authInterfaces.js";
import { generateJWT, hashPW, verifyPW } from "../middleware/security.js";
import jwt from "jsonwebtoken";
import { deleteAvatar } from "../services/FileService.js";
import { EmailService } from "../services/EmailService.js";

import QRCode from 'qrcode';
import speakeasy from 'speakeasy';

export class UserService {
    // get user table from db
    private userRepo = AppDataSource.getRepository(UserModel);
    private emailService = new EmailService();

    // Checks if user exists, throw error if yes, otherwise create user in db
    async createUser(userData: RegisterCredentials & { password: string, avatar?: string }, requestingUserRole?: string) {
        const existingUser = await this.userRepo.findOne({
            where: [
                { username: userData.username },
                { email: userData.email },
                { username: userData.username }
            ]
        });

        if (existingUser) {
            throw new Error('User already exists');
        }

        // Set default role to 'user' if not provided
        if (!userData.role) {
            userData.role = 'user';
        }

        // Prevent creation of master user through this method
        if (userData.role === 'master') {
            throw new Error('Master user can only be created through environment variables');
        }

        // Check permissions for creating privileged roles
        if (userData.role === 'admin' &&
            (!requestingUserRole || (requestingUserRole !== 'admin' && requestingUserRole !== 'master'))) {
            throw new Error('Unzureichende Berechtigungen zum Erstellen von Admin-Benutzern');
        }

        // Generate verification token for email verification
        const verificationToken = this.emailService.generateToken();

        // Create user with verification token and emailVerified=false
        const user = this.userRepo.create({
            ...userData,
            emailVerified: false,
            verificationToken: verificationToken
        });

        const savedUser = await this.userRepo.save(user);

        // Send verification email
        try {
            await this.emailService.sendVerificationEmail(
                userData.email,
                verificationToken,
                userData.username
            );
        } catch (error) {
            console.error('Failed to send verification email:', error);
            // Continue with user creation even if email fails
        }

        return savedUser;
    }

    // Verify user email with token
    async verifyEmail(token: string): Promise<boolean> {
        const user = await this.userRepo.findOne({
            where: { verificationToken: token }
        });

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
        } catch (error) {
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

    // find User by email (maybe when trying to reset password to send confirmation mail of reset link or smthin)
    async findUnameAcc(username: string) {
        return await this.userRepo.findOne({
            where: { username },
            select: ['id', 'username', 'email', 'password', 'role', 'avatar', 'emailVerified', 'twoFAEnabled', 'twoFASecret']
        });
    }

    // Find user by email
    async findByEmail(email: string) {
        return await this.userRepo.findOne({
            where: { email }
        });
    }

    // find all Users
    async findAll() {
        return await this.userRepo.find();
    }

    // find User by Id
    async findId(id: number): Promise<UserModel> {
        const user = await this.userRepo.findOneBy({ id })
        if (user == null)
            throw new Error("fuck you");
        return user;
    }

    // updates User with new Info
    async updateUser(user: UserModel, requestingUserRole?: string) {
        // Get the current user data to check if we're trying to modify a master
        const currentUser = await this.userRepo.findOneBy({ id: user.id });

        if (!currentUser) {
            throw new Error('User not found');
        }

        // Check if avatar has changed, delete old avatar if needed
        if (user.avatar !== currentUser.avatar && currentUser.avatar) {
            try {
                console.log(`Deleting old avatar for user ${currentUser.id}: ${currentUser.avatar}`);
                await deleteAvatar(currentUser.avatar);
            } catch (error) {
                console.error(`Error deleting old avatar for user ${currentUser.id}:`, error);
                // Continue with update even if avatar deletion fails
            }
        }

        // Prevent changing master role
        if (currentUser.role === 'master') {
            // Keep original role, prevent any role changes to master
            user.role = 'master';
        }

        // Prevent setting role to master
        if (user.role === 'master' && currentUser.role !== 'master') {
            throw new Error('Master role cannot be assigned through updates');
        }

        // Check permissions for setting admin role
        if (user.role === 'admin' && currentUser.role !== 'admin' &&
            (!requestingUserRole || (requestingUserRole !== 'admin' && requestingUserRole !== 'master'))) {
            throw new Error('Unzureichende Berechtigungen, um Admin-Berechtigungen zu vergeben');
        }

        return await this.userRepo.update(currentUser, user);
    }

    //Decide which one to use, removeUser and deletebyId are similar.
    async deleteById(id: number, requestingUserRole?: string): Promise<boolean> {
        try {
            const user = await this.userRepo.findOne({ where: { id } });

            if (!user) {
                return false;
            }

            // Never allow deletion of master users
            if (user.role === 'master') {
                console.log(`Prevented deletion of master user with ID: ${id}`);
                return false;
            }

            // Only admin or master can delete admin users
            if (user.role === 'admin' && (!requestingUserRole || (requestingUserRole !== 'admin' && requestingUserRole !== 'master'))) {
                console.log(`Prevented deletion of admin user with ID: ${id}`);
                return false;
            }

            // Delete user's avatar if it exists
            if (user.avatar) {
                try {
                    console.log(`Deleting avatar for user ${id}: ${user.avatar}`);
                    await deleteAvatar(user.avatar);
                } catch (error) {
                    console.error(`Error deleting avatar for user ${id}:`, error);
                    // Continue with user deletion even if avatar deletion fails
                }
            }

            const result = await this.userRepo.delete(id);

            return result.affected !== null && result.affected !== undefined && result.affected > 0;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw new Error('Failed to delete user');
        }
    }

    // create a primary jwt token to hand back to user for authentications
    private generateTokens(user: UserModel): AuthTokens {
        const payload: JWTPayload = {
            userID: user.id.toString(),
            email: user.email,
            role: user.role
        };

        const accessToken = generateJWT(payload);

        return {
            accessToken,
        };
    }

    // refresh token generator for later
    private generateRefreshToken(userId: number): string {
        const secret = process.env.REFRESH_TOKEN_SECRET;

        if (!secret) {
            throw new Error("REFRESH_TOKEN_SECRET not set");
        }
        return jwt.sign(
            { userId },
            secret,
            { expiresIn: '7d' }
        );
    }

    // for return type you will need to register a Promise of type token in form of security token you want(jwt,apikey etc..)
    async register(credentials: RegisterCredentials & { avatar?: string, secret?: string }, requestingUserRole?: string) {
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

        const user = await this.createUser(userData, requestingUserRole);
        return this.generateTokens(user);
    }

    async login(credentials: UserCredentials) {
        console.log("login: login " + credentials.username)
        console.log("login: login " + credentials.password)
        const user = await this.findUnameAcc(credentials.username);
        if (!user) {
            console.log("user: null ")
        }
        else {
            console.log("user: login " + user.username)
            console.log("user: login " + user.email)
        }
        if (!user || !await verifyPW(credentials.password, user.password)) {
            throw new Error('Invalid login data');
        }

        // Check if email is verified
        if (!user.emailVerified) {
            throw new Error('Email not verified. Please check your email for verification link.');
        }

        // Check if 2FA is enabled for this user
        if (user.twoFAEnabled && user.twoFASecret) {
            // Return a response indicating 2FA is required, but without generating a token yet
            return {
                requireTwoFactor: true,
                userId: user.id,
                username: user.username
            };
        }

        // If no 2FA, proceed with normal login
        return this.generateTokens(user);
    }

    // Add new method to verify 2FA code
    async verifyTwoFactorCode(userId: number, code: string): Promise<AuthTokens> {
        const user = await this.userRepo.findOneBy({ id: userId });

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
}
