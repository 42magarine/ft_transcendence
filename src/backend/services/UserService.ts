import { AppDataSource } from "../DataSource.js";
import { UserModel } from "../models/UserModel.js";
import { JWTPayload, RegisterCredentials, UserCredentials, AuthTokens } from "../../types/auth.js";
import { generateJWT, hashPW, verifyPW } from "../middleware/security.js";
import jwt from "jsonwebtoken";

export class UserService {
    //get user table from db
    private userRepo = AppDataSource.getRepository(UserModel);

    //Checks if user exists, throw error if yes, otherwise create user in db
    async createUser(userData: RegisterCredentials & { password: string }) {
        const existingUser = await this.userRepo.findOne({
            where: [
                { email: userData.email },
                { username: userData.username }
            ]
        });

        if (existingUser) {
            throw new Error('User already exists')
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

    //find User by Id
    async findId(id: number) {
        return await this.userRepo.findOneBy({ id });
    }

    // updates User with new Info
    async updateUser(user: UserModel) {
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

        if (existingUser) {
            return await this.userRepo.delete(existingUser)
        };
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
    async register(credentials: RegisterCredentials) {
        console.log("register call");

        const hashedPW = await hashPW(credentials.password);

        const user = await this.createUser({
            ...credentials,
            password: hashedPW
        });
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

        //down here comes more security stuff with 2FA, QRCode etc... later
    }
}
