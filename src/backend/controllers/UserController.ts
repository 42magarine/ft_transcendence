import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "../services/UserService.js";
import { RegisterCredentials, UserCredentials } from "../../types/auth.js";
import { verifyJWT } from "../middleware/security.js";
import { UserModel } from "../models/UserModel.js";
import { saveAvatar, deleteAvatar } from "../services/FileService.js";

export class UserController {
	private userService: UserService;

	constructor(userService: UserService) {
		this.userService = userService;
	}

	async register(request: FastifyRequest, reply: FastifyReply) {
		try {
			console.log("Register endpoint called");

			// Prüfen, ob es sich um einen Multipart-Request handelt
			if (!request.isMultipart()) {
				console.log("Processing JSON request");

				// Bei JSON-Anfragen das Body direkt verwenden
				const userData = request.body as RegisterCredentials;

				// Überprüfen, ob der Benutzer bereits angemeldet ist und seine Rolle erhalten
				let requestingUserRole: string | undefined;
				const token = request.cookies.accessToken;

				if (token) {
					try {
						const payload = await verifyJWT(token);
						if (payload && payload.role) {
							requestingUserRole = payload.role;
						}
					} catch (error) {
						// Ohne Berechtigungen fortfahren
					}
				}

				// Verhindern der Registrierung von Master-Benutzern über die API
				if (userData && userData.role === 'master') {
					return reply.code(403).send({ error: 'Master user can only be created through environment variables' });
				}

				// Benutzer mit Rollenüberprüfung registrieren
				await this.userService.register(userData, requestingUserRole);
				return reply.code(201).send({ message: "Registration successful" });
			}

			console.log("Processing multipart request");

			// Bei Multipart-Anfragen die Teile verarbeiten
			const userData: RegisterCredentials & { avatar?: string } = {
				username: "",
				email: "",
				password: "",
				displayname: "",
			};

			let avatarData = null;

			// Multipart-Form-Daten verarbeiten
			const parts = request.parts();

			for await (const part of parts) {
				console.log(`Processing part: ${part.type}, fieldname: ${part.fieldname}`);

				if (part.type === 'file' && part.fieldname === 'avatar') {
					// Avatar-Datei speichern
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
					// Form-Felder verarbeiten
					console.log(`Field ${part.fieldname}: ${part.value}`);
					(userData as any)[part.fieldname] = part.value;
				}
			}

			// Avatar-Pfad hinzufügen, falls vorhanden
			if (avatarData) {
				userData.avatar = avatarData;
			}

			console.log("Processed user data:", userData);

			// Überprüfen, ob alle erforderlichen Felder vorhanden sind
			if (!userData.username || !userData.email || !userData.password) {
				return reply.code(400).send({ error: 'Missing required fields' });
			}

			// Überprüfen, ob der Benutzer bereits angemeldet ist und seine Rolle erhalten
			let requestingUserRole: string | undefined;
			const token = request.cookies.accessToken;

			if (token) {
				try {
					const payload = await verifyJWT(token);
					if (payload && payload.role) {
						requestingUserRole = payload.role;
					}
				} catch (error) {
					// Ohne Berechtigungen fortfahren
				}
			}

			// Verhindern der Registrierung von Master-Benutzern über die API
			if (userData.role === 'master') {
				return reply.code(403).send({ error: 'Master user can only be created through environment variables' });
			}

			// Benutzer mit Rollenüberprüfung registrieren
			await this.userService.register(userData, requestingUserRole);
			return reply.code(201).send({ message: "Registration successful" });
		}
		catch (error) {
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
			const { password, ...userData } = user;
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
}