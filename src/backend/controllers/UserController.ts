import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "../services/UserService.js";
import { saveAvatar, deleteAvatar } from "../services/FileService.js";
import { UserModel } from "../models/MatchModel.js";
import { RegisterCredentials, LoginCredentials, GoogleLoginBody, AuthTokens } from "../../interfaces/userInterfaces.js";

export class UserController {
    private _userService: UserService;

    constructor(userService: UserService) {
        this._userService = userService;
    }

    async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
        try {
            const user = await this._userService.findUserById(request.user!.id);
            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            const { password, resetPasswordToken, resetPasswordExpires, verificationToken, ...userData } = user;
            return reply.code(200).send(userData);
        }
        catch (error) {
            return reply.code(500).send({ error: 'Internal server error' });
        }
    }

    async getAllUser(request: FastifyRequest, reply: FastifyReply) {
        try {
            const users = await this._userService.findAllUsers();
            reply.code(200).send(users);
        }
        catch (error) {
            reply.code(500).send({ error: 'Could not fetch all users' });
        }
    }

    async getUserById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const userId = parseInt(request.params.id);
            if (isNaN(userId)) {
                return reply.code(400).send({ error: 'Invalid user ID format' });
            }

            const currentUserId = request.user!.id;
            const currentUserRole = request.user!.role;

            const isOwnAccount = currentUserId === userId;
            const canRead = isOwnAccount || currentUserRole === 'master';
            if (!canRead) {
                return reply.code(403).send({ error: 'Insufficient permissions to read this user' });
            }

            const user = await this._userService.findUserById(userId);
            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }
            reply.code(200).send(user);
        }
        catch (error) {
            reply.code(500).send({ error: 'Could not fetch user' });
        }
    }

    async updateUserById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const userId = parseInt(request.params.id);
            if (isNaN(userId)) {
                return reply.code(400).send({ error: 'Invalid user ID format' });
            }

            const currentUserId = request.user!.id;
            const currentUserRole = request.user!.role;

            const isOwnAccount = currentUserId === userId;
            const canUpdate = isOwnAccount || currentUserRole === 'master';

            if (!canUpdate) {
                return reply.code(403).send({ error: 'Insufficient permissions to update this user' });
            }

            let updates: Partial<UserModel> = {};
            let avatarData = null;

            // Process different request types (multipart or JSON)
            if (request.isMultipart()) {
                // Handle multipart/form-data (file uploads)
                const parts = request.parts();

                for await (const part of parts) {
                    if (part.type === 'file' && part.fieldname === 'avatar') {
                        try {
                            const result = await saveAvatar(part);
                            avatarData = result.publicPath;
                        }
                        catch (error) {
                            return reply.code(400).send({ error: 'Failed to save avatar file' });
                        }
                    }
                    else if (part.type === 'field') {
                        // Add field to updates
                        (updates as any)[part.fieldname] = part.value;
                    }
                }

                // Set the avatar path if a new avatar was uploaded
                if (avatarData) {
                    updates.avatar = avatarData;
                }
            }
            else {
                // Handle JSON request
                updates = request.body as Partial<UserModel>;
            }

            // Create updated user object
            const updatedUser = { id: userId, ...updates } as UserModel;

            const result = await this._userService.updateUser(updatedUser);
            reply.code(200).send({ message: 'User updated successfully', user: result });
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message === 'User not found') {
                    return reply.code(404).send({ error: error.message });
                }
            }
            reply.code(500).send({ error: 'Could not update user' });
        }
    }

    async deleteUserById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const deleteUserId = parseInt(request.params.id);
            if (isNaN(deleteUserId)) {
                return reply.code(400).send({ error: 'Invalid user ID format' });
            }

            const currentUserId = request.user!.id;
            const currentUserRole = request.user!.role;

            const isOwnAccount = currentUserId === deleteUserId;
            const canDelete = isOwnAccount || currentUserRole === 'master';
            if (!canDelete) {
                return reply.code(403).send({ error: 'Insufficient permissions to delete this user' });
            }

            const deleted = await this._userService.deleteUser(deleteUserId);
            if (!deleted) {
                return reply.code(404).send({ error: 'User not found or cannot be deleted' });
            }

            reply.code(200).send({ message: 'User deleted successfully' });
        }
        catch (error) {
            return reply.code(500).send({ error: 'Could not delete user' });
        }
    }

    // Modified login method to handle 2FA
    async login(request: FastifyRequest<{ Body: LoginCredentials }>, reply: FastifyReply) {
        try {
            const result = await this._userService.login(request.body);

            // Check if 2FA is required
            if ('requireTwoFactor' in result && result.requireTwoFactor) {
                // Return information needed for 2FA verification without setting cookies
                return reply.code(200).send({
                    requireTwoFactor: true,
                    userId: result.userId,
                    username: result.username
                });
            }

            // Normal login flow (no 2FA)
            const authTokens = result as AuthTokens;

            reply.setCookie('refreshToken', authTokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Tage
            });

            // Access Token ebenfalls als Cookie (optional) ODER im Response Body
            reply.setCookie('accessToken', authTokens.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 1000 // 1 Stunde
            });

            return reply.code(200).send({
                message: 'Login successful',
                accessToken: authTokens.accessToken
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid login credentials';
            return reply.code(400).send({ error: message });
        }
    }

    async loginWithGoogle(request: FastifyRequest<{ Body: GoogleLoginBody }>, reply: FastifyReply) {
        try {
            const authResult = await this._userService.loginWithGoogle(request.body.token);

            reply.setCookie('accessToken', authResult.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 15 * 60 * 1000
            });
            return reply.code(200).send({ message: 'Login successful' });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Google login failed';
            return reply.code(400).send({ error: message });
        }
    }

    // Fixed verifyTwoFactor method
    async verifyTwoFactor(request: FastifyRequest<{
        Body: {
            userId: number;
            code: string;
        }
    }>, reply: FastifyReply) {
        try {
            const { userId, code } = request.body;

            if (!userId || !code) {
                return reply.code(400).send({ error: 'User ID and verification code are required' });
            }

            // Verify the 2FA code
            const result = await this._userService.verifyTwoFactorCode(userId, code);

            // Set the authentication cookie
            reply.setCookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 15 * 60 * 1000
            });

            return reply.code(200).send({ message: 'Two-factor authentication successful' });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Two-factor authentication failed';
            reply.code(400).send({ error: message });
        }
    }

    // New methods for password reset and email verification
    async requestPasswordReset(request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) {
        try {
            const { email } = request.body;

            if (!email) {
                return reply.code(400).send({ error: 'Email is required' });
            }

            await this._userService.requestPasswordReset(email);

            // Always return success for security reasons, even if email doesn't exist
            return reply.code(200).send({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }
        catch (error) {
            console.error('Password reset request error:', error);
            // For security, don't reveal if the process failed due to user not found
            return reply.code(200).send({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }
    }

    async checkResetToken(request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) {
        try {
            const { token } = request.params;

            if (!token) {
                return reply.code(400).send({ error: 'Reset token is required' });
            }

            await this._userService.verifyResetToken(token);

            return reply.code(200).send({ valid: true });
        }
        catch (error) {
            console.error('Token verification error:', error);
            const message = error instanceof Error ? error.message : 'Invalid token';
            return reply.code(400).send({ error: message, valid: false });
        }
    }

    async resetPassword(request: FastifyRequest<{
        Params: { token: string },
        Body: { password: string, confirmPassword: string }
    }>, reply: FastifyReply) {
        try {
            const { token } = request.params;
            const { password, confirmPassword } = request.body;

            if (!token) {
                return reply.code(400).send({ error: 'Reset token is required' });
            }

            if (!password || !confirmPassword) {
                return reply.code(400).send({ error: 'Password and confirmation are required' });
            }

            if (password !== confirmPassword) {
                return reply.code(400).send({ error: 'Passwords do not match' });
            }

            // Minimum password requirements
            if (password.length < 8) {
                return reply.code(400).send({ error: 'Password must be at least 8 characters long' });
            }

            await this._userService.resetPassword(token, password);

            return reply.code(200).send({ message: 'Password has been reset successfully' });
        }
        catch (error) {
            console.error('Password reset error:', error);
            const message = error instanceof Error ? error.message : 'Failed to reset password';
            return reply.code(400).send({ error: message });
        }
    }

    async verifyEmail(request: FastifyRequest<{ Params: { token: string } }>, reply: FastifyReply) {
        try {
            const { token } = request.params;
            if (!token) {
                return reply.code(400).send({ error: 'Verification token is required' });
            }

            await this._userService.verifyEmail(token);

            // Redirect to login page after successful verification
            return reply.redirect('/login?verified=true');
        }
        catch (error) {
            console.error('Email verification error:', error);
            return reply.code(400).send({ error: 'Invalid verification token' });
        }
    }

    async resendVerificationEmail(request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) {
        try {
            const { email } = request.body;

            if (!email) {
                return reply.code(400).send({ error: 'Email is required' });
            }

            // Find user by email
            const user = await this._userService.findUserByEmail(email);

            if (!user) {
                // Don't reveal if email exists or not
                return reply.code(200).send({
                    message: 'If your account exists, a verification email has been sent.'
                });
            }

            if (user.emailVerified) {
                return reply.code(400).send({ error: 'Email is already verified' });
            }

            // Rest of the logic will be implemented in UserService
            // Here we would regenerate verification token and send email

            return reply.code(200).send({
                message: 'If your account exists, a verification email has been sent.'
            });
        }
        catch (error) {
            console.error('Resend verification error:', error);
            return reply.code(200).send({ message: 'If your account exists, a verification email has been sent.' });
        }
    }

    async register(request: FastifyRequest, reply: FastifyReply) {
        try {
            // Handle multipart form data
            if (request.isMultipart()) {
                const userData: RegisterCredentials & {
                    avatar?: string,
                    secret?: string,
                    tf_one?: string,
                    tf_two?: string,
                    tf_three?: string,
                    tf_four?: string,
                    tf_five?: string,
                    tf_six?: string
                } = {
                    name: "",
                    username: "",
                    email: "",
                    password: ""
                };

                let avatarData = null;

                // Process multipart form data
                const parts = request.parts();

                for await (const part of parts) {
                    if (part.type === 'file' && part.fieldname === 'avatar') {
                        try {
                            const result = await saveAvatar(part);
                            avatarData = result.publicPath;
                        }
                        catch (error) {
                            console.error("Error saving avatar:", error);
                            return reply.code(400).send({ error: 'Failed to save avatar file' });
                        }
                    }
                    else if (part.type === 'field') {
                        (userData as any)[part.fieldname] = part.value;
                    }
                }

                if (avatarData) {
                    userData.avatar = avatarData;
                }

                if (!userData.username || !userData.email || !userData.password) {
                    return reply.code(400).send({ error: 'Missing required fields' });
                }

                // Register user with 2FA data included
                await this._userService.register(userData);

                return reply.code(201).send({
                    message: "Registration successful. Please check your email to verify your account.",
                    twoFAEnabled: userData.secret && userData.tf_one && userData.tf_two && userData.tf_three &&
                        userData.tf_four && userData.tf_five && userData.tf_six ? true : false
                });
            }
            else {
                const userData = request.body as RegisterCredentials & {
                    secret?: string,
                    tf_one?: string,
                    tf_two?: string,
                    tf_three?: string,
                    tf_four?: string,
                    tf_five?: string,
                    tf_six?: string
                };

                // Register user with 2FA data
                await this._userService.register(userData);

                return reply.code(201).send({
                    message: "Registration successful. Please check your email to verify your account.",
                    twoFAEnabled: userData.secret && userData.tf_one && userData.tf_two && userData.tf_three &&
                        userData.tf_four && userData.tf_five && userData.tf_six ? true : false
                });
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Registration failed';

            if (message.includes('exists')) {
                reply.code(400).send({ error: 'User already exists' });
            }
            else if (message.includes('permissions') || message.includes('Master user')) {
                reply.code(403).send({ error: message });
            }
            else {
                reply.code(400).send({ error: 'Registration failed' });
            }
        }
    }

    async refreshToken(request: FastifyRequest, reply: FastifyReply) {
        try {
            const refreshToken = request.cookies.refreshToken;
            if (!refreshToken) {
                return reply.code(401).send({ error: 'Refresh token required' });
            }

            const result = await this._userService.refreshToken(refreshToken);

            reply.setCookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 60 * 60 * 1000  // 1h
            });

            return reply.code(200).send(result);
        }
        catch (error) {
            return reply.code(401).send({ error: 'Refreshing Token failed' });
        }
    }

    async logout(request: FastifyRequest, reply: FastifyReply) {
        reply.clearCookie('accessToken', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        reply.clearCookie('refreshToken', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return reply.code(200).send({ message: 'Logout successful' });
    }

    async generateQR(request: FastifyRequest, reply: FastifyReply) {
        let secAQrCode = await this._userService.generateQR();
        if (!secAQrCode) {
            return reply.code(500).send({ error: "QR generation failed!" });
        }
        return reply.code(200).send(secAQrCode);
    }
}
