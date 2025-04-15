// export class UserController {
//     static instance: UserController;
//     public static getInstance(): UserController {
//         if (!UserController.instance) {
//             UserController.instance = new UserController(new UserModel());
//         }
//         return UserController.instance;
//     }
//     constructor(private userModel: UserModel) { }
//     public createUser(user: { name: string, username: string }) {
//         return this.userModel.create(user);
//     }
//     public readAllUser() {
//         const user = this.userModel.readAll();
//         return user;
//         // if (user) {
//         //     return user;
//         // }
//         // else {
//         //     return notify("Digga User nicht da Bruda!!!");
//         // }
//     }
//     public readOneUser(id: number) {
//         return this.userModel.readOne(id);
//     }
//     public updateUser(user: { id: number, name: string, username: string }) {
//         return this.userModel.update(user);
//     }
//     public deleteUser(id: number) {
//         return this.userModel.delete(id);
//     }
// }
export class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async register(request, reply) {
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
            reply.code(201).send("registration success woooo");
        }
        catch (error) {
            console.error('registration error:', error);
            const message = error instanceof Error ? error.message : 'Registration failed';
            reply.code(400).send({
                error: message.includes('exists') ? 'User already exists' : 'Registration failed'
            });
        }
    }
    async login(request, reply) {
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
}
