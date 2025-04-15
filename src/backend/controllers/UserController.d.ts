import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "../services/user.service.js";
import { RegisterCredentials, UserCredentials } from "../../types/auth.types.js";
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    register(request: FastifyRequest<{
        Body: RegisterCredentials;
    }>, reply: FastifyReply): Promise<void>;
    login(request: FastifyRequest<{
        Body: UserCredentials;
    }>, reply: FastifyReply): Promise<void>;
}
