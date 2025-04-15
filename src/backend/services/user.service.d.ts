import { UserModel } from "../models/User.Model.js";
import { RegisterCredentials, UserCredentials, AuthTokens } from "../../types/auth.types.js";
export declare class UserService {
    private userRepo;
    createUser(userData: RegisterCredentials & {
        password: string;
    }): Promise<UserModel>;
    findEmailAcc(email: string): Promise<UserModel | null>;
    findId(id: number): Promise<UserModel | null>;
    updateUser(user: UserModel): Promise<UserModel>;
    removeUser(userData: RegisterCredentials): Promise<import("typeorm").DeleteResult | undefined>;
    private generateTokens;
    private generateRefreshToken;
    register(credentials: RegisterCredentials): Promise<AuthTokens>;
    login(credentials: UserCredentials): Promise<AuthTokens>;
}
