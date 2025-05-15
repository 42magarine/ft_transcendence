import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "../services/UserService.js";
import { RegisterCredentials, UserCredentials } from "../../interfaces/authInterfaces.js";
import { verifyJWT } from "../middleware/security.js";
import { UserModel } from "../models/MatchModel.js";
import { saveAvatar, deleteAvatar } from "../services/FileService.js";

export class UserController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    // Existing methods remain...

    // Modified login method to handle 2FA
    // Modified login method to handle 2FA
    async login(request: FastifyRequest<{ Body: UserCredentials }>, reply: FastifyReply) {
        try {
            const result = await this.userService.login(request.body);

            // Check if 2FA is required
            if ('requireTwoFactor' in result && result.requireTwoFactor) {
                // Return information needed for 2FA verification without setting cookies
                return reply.code(200).send({
                    requireTwoFactor: true,
                    userId: result.userId,
                    username: result.username
                });
            }

            // Use type assertion to tell TypeScript that at this point, result is AuthTokens
            const authTokens = result as { accessToken: string };

            // Normal login flow (no 2FA)
            reply.setCookie('accessToken', authTokens.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 15 * 60 * 1000
            });
            return reply.code(200).send({ message: 'Login successful' });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Invalid login credentials';
            reply.code(400).send({ error: message });
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

            // Use code directly since we know it's a string due to request type definition
            // No need for the toString() conversion that was causing errors

            // Verify the 2FA code
            const result = await this.userService.verifyTwoFactorCode(userId, code);

            // Set the authentication cookie
            reply.setCookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 15 * 60 * 1000
            });

            return reply.code(200).send({ message: 'Two-factor authentication successful' });
        } catch (error) {
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

            await this.userService.requestPasswordReset(email);

            // Always return success for security reasons, even if email doesn't exist
            return reply.code(200).send({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        } catch (error) {
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

            await this.userService.verifyResetToken(token);

            return reply.code(200).send({ valid: true });
        } catch (error) {
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

            await this.userService.resetPassword(token, password);

            return reply.code(200).send({ message: 'Password has been reset successfully' });
        } catch (error) {
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

            await this.userService.verifyEmail(token);

            // Redirect to login page after successful verification
            return reply.redirect('/login?verified=true');
        } catch (error) {
            console.error('Email verification error:', error);
            const message = error instanceof Error ? error.message : 'Invalid verification token';
            return reply.code(400).send({ error: message });
        }
    }

    async resendVerificationEmail(request: FastifyRequest<{ Body: { email: string } }>, reply: FastifyReply) {
        try {
            const { email } = request.body;

            if (!email) {
                return reply.code(400).send({ error: 'Email is required' });
            }

            // Find user by email
            const user = await this.userService.findByEmail(email);

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
        } catch (error) {
            console.error('Resend verification error:', error);
            return reply.code(200).send({
                message: 'If your account exists, a verification email has been sent.'
            });
        }
    }

    async register(request: FastifyRequest, reply: FastifyReply) {
        try {
            console.log("Register endpoint called");

            // Handle multipart form data
            if (request.isMultipart()) {
                console.log("Processing multipart request");

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
                    username: "",
                    email: "",
                    password: "",
                    displayname: "",
                };

                let avatarData = null;

                // Process multipart form data
                const parts = request.parts();

                for await (const part of parts) {
                    console.log(`Processing part: ${part.type}, fieldname: ${part.fieldname}`);

                    if (part.type === 'file' && part.fieldname === 'avatar') {
                        try {
                            console.log("Saving avatar file");
                            const result = await saveAvatar(part);
                            avatarData = result.publicPath;
                            console.log(`Avatar saved: ${avatarData}`);
                        } catch (error) {
                            console.error("Error saving avatar:", error);
                            return reply.code(400).send({ error: 'Failed to save avatar file' });
                        }
                    } else if (part.type === 'field') {
                        console.log(`Field ${part.fieldname}: ${part.value}`);
                        (userData as any)[part.fieldname] = part.value;
                    }
                }

                if (avatarData) {
                    userData.avatar = avatarData;
                }

                console.log("Processed user data:", userData);

                if (!userData.username || !userData.email || !userData.password) {
                    return reply.code(400).send({ error: 'Missing required fields' });
                }

                let requestingUserRole: string | undefined;
                const token = request.cookies.accessToken;

                if (token) {
                    try {
                        const payload = await verifyJWT(token);
                        if (payload && payload.role) {
                            requestingUserRole = payload.role;
                        }
                    } catch (error) {
                        // Continue without permissions
                    }
                }

                if (userData.role === 'master') {
                    return reply.code(403).send({ error: 'Master user can only be created through environment variables' });
                }

                // Register user with 2FA data included
                await this.userService.register(userData, requestingUserRole);

                return reply.code(201).send({
                    message: "Registration successful. Please check your email to verify your account.",
                    twoFAEnabled: userData.secret && userData.tf_one && userData.tf_two && userData.tf_three &&
                        userData.tf_four && userData.tf_five && userData.tf_six ? true : false
                });
            } else {
                console.log("Processing JSON request");

                const userData = request.body as RegisterCredentials & {
                    secret?: string,
                    tf_one?: string,
                    tf_two?: string,
                    tf_three?: string,
                    tf_four?: string,
                    tf_five?: string,
                    tf_six?: string
                };

                let requestingUserRole: string | undefined;
                const token = request.cookies.accessToken;

                if (token) {
                    try {
                        const payload = await verifyJWT(token);
                        if (payload && payload.role) {
                            requestingUserRole = payload.role;
                        }
                    } catch (error) {
                        // Continue without permissions
                    }
                }

                if (userData && userData.role === 'master') {
                    return reply.code(403).send({ error: 'Master user can only be created through environment variables' });
                }

                // Register user with 2FA data
                await this.userService.register(userData, requestingUserRole);

                return reply.code(201).send({
                    message: "Registration successful. Please check your email to verify your account.",
                    twoFAEnabled: userData.secret && userData.tf_one && userData.tf_two && userData.tf_three &&
                        userData.tf_four && userData.tf_five && userData.tf_six ? true : false
                });
            }
        } catch (error) {
            console.error('Registration error:', error);
            const message = error instanceof Error ? error.message : 'Registration failed';

            if (message.includes('exists')) {
                reply.code(400).send({ error: 'User already exists' });
            } else if (message.includes('permissions') || message.includes('Master user')) {
                reply.code(403).send({ error: message });
            } else {
                reply.code(400).send({ error: 'Registration failed' });
            }
        }
    }

    async updateUser(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            let updates: Partial<UserModel> = {};
            let avatarData = null;

            if (!id) {
                return reply.code(400).send({ error: 'User ID is required' });
            }

            const userId = parseInt(id, 10);

            if (isNaN(userId)) {
                return reply.code(400).send({ error: 'Invalid user ID format' });
            }

            // Check user permissions
            const token = request.cookies.accessToken;

            if (!token) {
                return reply.code(401).send({ error: 'Authentication required' });
            }

            const payload = await verifyJWT(token);

            if (!payload) {
                return reply.code(401).send({ error: 'Invalid authentication token' });
            }

            // Get current user
            const currentUser = await this.userService.findId(userId);

            if (!currentUser) {
                return reply.code(404).send({ error: 'User not found' });
            }

            // Process different request types (multipart or JSON)
            if (request.isMultipart()) {
                // Handle multipart/form-data (file uploads)
                const parts = request.parts();

                for await (const part of parts) {
                    if (part.type === 'file' && part.fieldname === 'avatar') {
                        try {
                            const result = await saveAvatar(part);
                            avatarData = result.publicPath;
                        } catch (error) {
                            console.error("Error saving avatar:", error);
                            return reply.code(400).send({ error: 'Failed to save avatar file' });
                        }
                    } else if (part.type === 'field') {
                        if (part.fieldname === 'role') {
                            // Special handling for role updates
                            if (currentUser.role === 'master' && part.value !== 'master') {
                                return reply.code(403).send({ error: 'Master role cannot be changed' });
                            }

                            if (part.value === 'master' && currentUser.role !== 'master') {
                                return reply.code(403).send({ error: 'Master role cannot be assigned' });
                            }

                            // Role changes require admin/master permissions
                            if (part.value && part.value !== currentUser.role) {
                                if (payload.role !== 'admin' && payload.role !== 'master') {
                                    return reply.code(403).send({ error: 'Insufficient permissions to change user role' });
                                }
                            }
                        }

                        // Add field to updates
                        (updates as any)[part.fieldname] = part.value;
                    }
                }

                // Set the avatar path if a new avatar was uploaded
                if (avatarData) {
                    updates.avatar = avatarData;
                }
            } else {
                // Handle JSON request
                updates = request.body as Partial<UserModel>;

                // Prevent role changes for master user
                if (currentUser.role === 'master' && updates.role && updates.role !== 'master') {
                    return reply.code(403).send({ error: 'Master role cannot be changed' });
                }

                // Prevent setting role to master
                if (updates.role === 'master' && currentUser.role !== 'master') {
                    return reply.code(403).send({ error: 'Master role cannot be assigned' });
                }
            }

            // Check permissions for updates
            // Users can update their own non-role fields
            // Role changes require admin or master permissions
            if (parseInt(payload.userID, 10) !== userId &&
                payload.role !== 'admin' &&
                payload.role !== 'master') {
                return reply.code(403).send({ error: 'Insufficient permissions to update this user' });
            }

            // If trying to change role, check permissions
            if (updates.role && updates.role !== currentUser.role) {
                if (payload.role !== 'admin' && payload.role !== 'master') {
                    return reply.code(403).send({ error: 'Insufficient permissions to change user role' });
                }
            }

            // Use the actual currentUser which is already of the correct UserModel type
            // and merge with updates
            const updatedUser = { ...currentUser, ...updates };

            // Update user with role verification
            const result = await this.userService.updateUser(updatedUser, payload.role);

            reply.code(200).send({ message: 'User updated successfully', user: result });
        }
        catch (error) {
            console.error('Error updating user:', error);
            const message = error instanceof Error ? error.message : 'Could not update user';
            reply.code(500).send({
                error: message
            });
        }
    }

    async deleteById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;

            if (!id) {
                return reply.code(400).send({ error: 'User ID is required' });
            }

            const userId = parseInt(id, 10);

            if (isNaN(userId)) {
                return reply.code(400).send({ error: 'Invalid user ID format' });
            }

            // Check user permissions
            const token = request.cookies.accessToken;

            if (!token) {
                return reply.code(401).send({ error: 'Authentication required' });
            }

            const payload = await verifyJWT(token);

            if (!payload) {
                return reply.code(401).send({ error: 'Invalid authentication token' });
            }

            // Check if attempting to delete a master user
            const targetUser = await this.userService.findId(userId);
            if (targetUser?.role === 'master') {
                return reply.code(403).send({ error: 'Master user cannot be deleted' });
            }

            // Users can delete their own account, or admins/masters can delete other accounts
            // based on role hierarchy
            if (parseInt(payload.userID, 10) !== userId &&
                payload.role !== 'admin' &&
                payload.role !== 'master') {
                return reply.code(403).send({ error: 'Insufficient permissions to delete this user' });
            }

            const deleted = await this.userService.deleteById(userId, payload.role);

            if (!deleted) {
                return reply.code(404).send({ error: 'User not found or cannot be deleted' });
            }

            reply.code(200).send({ message: 'User deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting user by ID:', error);
            const message = error instanceof Error ? error.message : 'Could not delete user';
            reply.code(500).send({
                error: message
            });
        }
    }

    // Other methods remain unchanged...
    async getAll(request: FastifyRequest, reply: FastifyReply) {
        try {
            // Check user permissions
            const token = request.cookies.accessToken;

            if (!token) {
                return reply.code(401).send({ error: 'Authentication required' });
            }

            const payload = await verifyJWT(token);

            // Only admin or master users can view all users
            if (!payload || (payload.role !== 'admin' && payload.role !== 'master')) {
                return reply.code(403).send({ error: 'Insufficient permissions to view all users' });
            }

            const users = await this.userService.findAll();
            reply.code(200).send(users);
        }
        catch (error) {
            console.error('Error fetching users:', error);
            const message = error instanceof Error ? error.message : 'Could not fetch users';
            reply.code(500).send({ error: message });
        }
    }

    async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
        try {
            const { id } = request.params;

            if (!id) {
                return reply.code(400).send({ error: 'User ID is required' });
            }

            const userId = parseInt(id, 10);

            if (isNaN(userId)) {
                return reply.code(400).send({ error: 'Invalid user ID format' });
            }

            // Check user permissions
            const token = request.cookies.accessToken;
            const payload = token ? await verifyJWT(token) : null;

            // Users can view their own profile or admins/masters can view any profile
            if (!payload ||
                (parseInt(payload.userID, 10) !== userId &&
                    payload.role !== 'admin' &&
                    payload.role !== 'master')) {
                return reply.code(403).send({ error: 'Insufficient permissions' });
            }

            const user = await this.userService.findId(userId);

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            reply.code(200).send(user);
        }
        catch (error) {
            console.error('Error fetching user by ID:', error);
            const message = error instanceof Error ? error.message : 'Could not fetch user';
            reply.code(500).send({
                error: message
            });
        }
    }

    async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
        try {
            // Get the token from cookies
            const token = request.cookies.accessToken;

            if (!token) {
                return reply.code(200).send(null);
            }

            // Verify the token
            const payload = await verifyJWT(token);

            if (!payload || !payload.userID) {
                return reply.code(401).send({ error: 'Invalid token' });
            }

            // Get the user from the database
            const user = await this.userService.findId(parseInt(payload.userID, 10));

            if (!user) {
                return reply.code(404).send({ error: 'User not found' });
            }

            // Return user data without sensitive information
            const { password, resetPasswordToken, resetPasswordExpires, verificationToken, ...userData } = user;
            return reply.code(200).send(userData);
        }
        catch (error) {
            console.error('Error getting current user:', error);
            const message = error instanceof Error ? error.message : 'Authentication failed';
            return reply.code(401).send({ error: message });
        }
    }

    async logout(request: FastifyRequest, reply: FastifyReply) {
        // Clear the access token cookie
        reply.clearCookie('accessToken', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return reply.code(200).send({ message: 'Logout successful' });
    }

    async generateQR(request: FastifyRequest, reply: FastifyReply) {
        let secAQrCode = await this.userService.generateQR();
        if (!secAQrCode) {
            return reply.code(500).send({ error: "QR generation failed!" });
        }
        return reply.code(200).send(secAQrCode);
    }
}
