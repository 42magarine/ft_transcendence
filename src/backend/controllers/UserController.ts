import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "../services/UserService.js";
import { RegisterCredentials, UserCredentials } from "../../types/auth.js";
import { verifyJWT } from "../middleware/security.js";

// Add UserModel interface definition
interface UserModel {
	id?: number;
	username: string;
	email: string;
	password: string;
	role: string;
	// Add any other fields that might be in your user model
}

export class UserController {
	private userService: UserService;

	constructor(userService: UserService) {
		this.userService = userService;
	}

	async register(request: FastifyRequest<{ Body: RegisterCredentials }>, reply: FastifyReply) {
		try {
			// Check if user is authenticated and get their role
			let requestingUserRole: string | undefined;

			// Get the token from cookies
			const token = request.cookies.accessToken;

			// If token exists, verify it and get the role
			if (token) {
				try {
					const payload = await verifyJWT(token);
					if (payload && payload.role) {
						requestingUserRole = payload.role;
					}
				} catch (error) {
					// Token verification failed, but we'll continue with registration
					// just without any privileged roles
				}
			}

			// Prevent registration of master users through API
			if (request.body.role === 'master') {
				return reply.code(403).send({ error: 'Master user can only be created through environment variables' });
			}

			// Register user with role verification
			const tokens = await this.userService.register(request.body, requestingUserRole);
			reply.code(201).send({ message: "Registration successful" });
		}
		catch (error) {
			console.error('Registration error:', error);
			const message = error instanceof Error ? error.message : 'Registration failed';

			// Determine appropriate error message and status code
			if (message.includes('exists')) {
				reply.code(400).send({ error: 'User already exists' });
			} else if (message.includes('permissions') || message.includes('Master user')) {
				reply.code(403).send({ error: message });
			} else {
				reply.code(400).send({ error: 'Registration failed' });
			}
		}
	}

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

	async updateUser(request: FastifyRequest<{ Params: { id: string }, Body: Partial<UserModel> }>, reply: FastifyReply) {
		try {
			const { id } = request.params;
			const updates = request.body as Partial<UserModel>;

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

			// Prevent role changes for master user
			if (currentUser.role === 'master' && updates.role && updates.role !== 'master') {
				return reply.code(403).send({ error: 'Master role cannot be changed' });
			}

			// Prevent setting role to master
			if (updates.role === 'master' && currentUser.role !== 'master') {
				return reply.code(403).send({ error: 'Master role cannot be assigned' });
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

			// Merge updates with current user
			const updatedUser = { ...currentUser, ...updates } as UserModel;

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

	async login(request: FastifyRequest<{ Body: UserCredentials }>, reply: FastifyReply) {
		try {
			const result = await this.userService.login(request.body);
			reply.setCookie('accessToken', result.accessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				path: '/',
				maxAge: 15 * 60 * 1000
			});
			reply.code(200).send({ message: 'Login successful' });
		}
		catch (error) {
			reply.code(400).send({ error: 'Invalid login credentials' });
		}
	}

	async getCurrentUser(request: FastifyRequest, reply: FastifyReply) {
		try {
			// Get the token from cookies
			const token = request.cookies.accessToken;

			if (!token) {
				return reply.code(401).send({ error: 'Not authenticated' });
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
			const { password, ...userData } = user;
			return reply.code(200).send(userData);
		}
		catch (error) {
			console.error('Error getting current user:', error);
			const message = error instanceof Error ? error.message : 'Authentication failed';
			return reply.code(401).send({ error: message });
		}
	}

	/**
	 * Logout the current user
	 */
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
}