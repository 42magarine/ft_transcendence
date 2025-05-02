import { AppDataSource } from "../DataSource.js";
import { UserModel } from "../models/UserModel.js";
import { JWTPayload, RegisterCredentials, UserCredentials, AuthTokens } from "../../types/auth.js";
import { generateJWT, hashPW, verifyPW } from "../middleware/security.js";
import jwt from "jsonwebtoken";
import { deleteAvatar } from "../services/FileService.js";

export class UserService {
	// get user table from db
	private userRepo = AppDataSource.getRepository(UserModel);

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

		const user = this.userRepo.create(userData);
		return await this.userRepo.save(user);
	}

	// find User by email (maybe when trying to reset password to send confirmation mail of reset link or smthin)
	async findUnameAcc(username: string) {
		return await this.userRepo.findOne({
			where: { username },
			select: ['id', 'username', 'email', 'password', 'role', 'avatar']
		});
	}

	// find all Users
	async findAll() {
		return await this.userRepo.find();
	}

	// find User by Id
	async findId(id: number) {
		return await this.userRepo.findOneBy({ id });
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
	async register(credentials: RegisterCredentials & { avatar?: string }, requestingUserRole?: string) {
		const hashedPW = await hashPW(credentials.password);

		const user = await this.createUser({
			...credentials,
			password: hashedPW
		}, requestingUserRole);

		// generate security token to hand back to user because successfully registered
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

		return this.generateTokens(user);
	}
}