import { AppDataSource } from "../DataSource.js";
import { UserModel } from "../models/UserModel.js";
import { JWTPayload, RegisterCredentials, UserCredentials, AuthTokens } from "../../types/auth.js";
import { generateJWT, hashPW, verifyPW } from "../middleware/security.js";
import jwt from "jsonwebtoken";

export class UserService {
    //get user table from db
    private userRepo = AppDataSource.getRepository(UserModel);

    /**
     * Initialize master user from environment variables during application startup
     *
     * Why again??
     */

    //Checks if user exists, throw error if yes, otherwise create user in db
    async createUser(userData: RegisterCredentials & { password: string }, requestingUserRole?: string) {
        const existingUser = await this.userRepo.findOne({
            where: [
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
            throw new Error('Master user can only be created through environment variables'); // never publish this info
        }

        // Check permissions for creating privileged roles <--- but you dont allocate a role here?
        if (userData.role === 'admin' &&
            (!requestingUserRole || (requestingUserRole !== 'admin' && requestingUserRole !== 'master'))) {
            throw new Error('Unzureichende Berechtigungen zum Erstellen von Admin-Benutzern');
        }

        const user = this.userRepo.create(userData);
        return await this.userRepo.save(user);
    }

    //find User by email (maybe when trying to reset password to send confirmation mail of reset link or smthin)
    async findEmailAcc(email: string) {
        return await this.userRepo.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'role']
        });
    }

    //give back all users
    async findAll() {
        return await this.userRepo.find();
    }

    //find User by Id
    async findId(id: number) {
        return await this.userRepo.findOneBy({ id });
    }

    // updates User with new Info

    // user update with information instead of save in this
    async updateUser(user: UserModel, requestingUserRole?: string) {
        // Get the current user data to check if we're trying to modify a master
        const currentUser = await this.userRepo.findOneBy({ id: user.id });

        if (!currentUser) {
            throw new Error('User not found');
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

        return await this.userRepo.save(user);
    }

    // Removes the user from DB
    async removeUser(userData: RegisterCredentials) {
        const existingUser = await this.userRepo.findOne({
            where: [
                { email: userData.email },
                { username: userData.username }
            ]
        });

        if (!existingUser) {
            throw new Error("User doesnt exist, and therefore cannot be removed.");
        }

        // Prevent master deletion
        if (existingUser.role === 'master') {
            throw new Error('Master user cannot be deleted');
        }

        return await this.userRepo.delete(existingUser);

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

        const accessToken = generateJWT(payload)
        // const refreshToken = this.generateRefreshToken(user.id)

        // this.updateRefreshToken(user.id, refreshToken)

        return {
            accessToken,
            // refreshToken
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
    async register(credentials: RegisterCredentials, requestingUserRole?: string) {
        console.log("register call");

        const hashedPW = await hashPW(credentials.password);

        const user = await this.createUser({
            ...credentials,
            password: hashedPW
        }, requestingUserRole);

        //generate security token to hand back to user because successfully registered
        return this.generateTokens(user);
    }

    async login(credentials: UserCredentials) {
        const user = await this.findEmailAcc(credentials.email);
        if (!user || !await verifyPW(credentials.password, user.password)) {
            throw new Error('INvalid login data');
        }

        // if (user.twoFAEnabled)
        // {}

		return this.generateTokens(user);
	}
}


// export async function register2FA();

