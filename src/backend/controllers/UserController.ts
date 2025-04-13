import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "../services/UserService.js";
import { RegisterCredentials, UserCredentials } from "../../types/auth.js";

export class UserController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    async register(request: FastifyRequest<{ Body: RegisterCredentials }>, reply: FastifyReply) {
        try {
            console.log("test register");
            const tokens = await this.userService.register(request.body);
            reply.setCookie('accessToken', tokens.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 15 * 60 * 1000
            });
            reply.code(201).send("registration success woooo")
        }
        catch (error) {
            console.error('registration error:', error);
            const message = error instanceof Error ? error.message : 'Registration failed';
            reply.code(400).send({
                error: message.includes('exists') ? 'User already exists' : 'Registration failed'
            });
        }
    }

    async login(request: FastifyRequest<{ Body: UserCredentials }>, reply: FastifyReply) {
        try {
            const result = await this.userService.login(request.body);
            // if ('requiresTwoFactor' in result) {
            //     reply.code(200).send({
            //         requiresTwoFactor: true,
            //         tempToken: result.tempToken // -> send info back to frontend for requesting 2FA. -> Should maybe redirect to 2FA page / blocking pop up -> will need to send another request to verify2FA
            //     });
            // } else {
            reply.setCookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
                maxAge: 15 * 60 * 1000
            });
            // reply.setCookie('refreshToken', result.refreshToken,  {
            //     httpOnly: true,
            //     secure: process.env.NODE_ENV === 'production',
            //     sameSite: 'strict',
            //     path: '/api/auth/refresh',
            //     maxAge: 7 * 24 * 60 * 60 * 1000
            //     });
            // reply.code(200).send('Login successful');
            // }
        }
        catch (error) {
            reply.code(400).send({ error: 'Bad Login request' });
        }
    }

    // async logout(request: FastifyRequest, reply: FastifyReply) {
    //     const userId = request.user?.userID;
    //     if (userId) {
    //         const userIdNumber = parseInt(userId, 10);
    //         await this.userService.getUserService().updateRefreshToken(userIdNumber, null);
    //     }
    // reply.clearCookie('accessToken', { path: '/' });
    // // reply.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    // reply.code(200).send('Logout successful');
}



// import { FastifyReply, FastifyRequest } from "fastify";
// import { UserModel } from "../models/UserModel.js";

// export class UserController {
//     static instance: UserController;
//     private userModel: UserModel;

//     public static getInstance(): UserController {
//         if (!UserController.instance) {
//             UserController.instance = new UserController();
//         }
//         return UserController.instance;
//     }

//     constructor() {
//         this.userModel = new UserModel();
//     }

//     public createUser(request: FastifyRequest, reply: FastifyReply) {
//         try {
//             const { name, username } = request.body as { name: string, username: string };
//             const result = this.userModel.create({ name, username });
//             reply.code(201).send(result);
//         }
//         catch (error) {
//             reply.code(400).send({ error: "Failed to create user" });
//         }
//     }

//     public readAllUser(request: FastifyRequest, reply: FastifyReply) {
//         try {
//             const users = this.userModel.readAll();
//             reply.send(users);
//         }
//         catch (error) {
//             reply.code(500).send({ error: "Failed to fetch users" });
//         }
//     }

//     public readOneUser(request: FastifyRequest, reply: FastifyReply) {
//         try {
//             const { id } = request.params as { id: string };
//             const user = this.userModel.readOne(Number(id));
//             if (user) {
//                 reply.send(user);
//             }
//             else {
//                 reply.code(404).send({ error: "User not found" });
//             }
//         }
//         catch (error) {
//             reply.code(500).send({ error: "Error retrieving user" });
//         }
//     }

//     public updateUser(request: FastifyRequest, reply: FastifyReply) {
//         try {
//             const { id } = request.params as { id: string };
//             const { name, username } = request.body as { name: string, username: string };
//             const result = this.userModel.update({ id: Number(id), name, username });
//             reply.send(result);
//         }
//         catch (error) {
//             reply.code(400).send({ error: "Failed to update user" });
//         }
//     }

//     public deleteUser(request: FastifyRequest, reply: FastifyReply) {
//         try {
//             const { id } = request.params as { id: string };
//             const result = this.userModel.delete(Number(id));
//             reply.send(result);
//         }
//         catch (error) {
//             reply.code(400).send({ error: "Failed to delete user" });
//         }
//     }
// }
