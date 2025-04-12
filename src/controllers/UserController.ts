import { FastifyReply, FastifyRequest } from "fastify";
import { UserModel } from "../models/UserModel.js";

export class UserController {
    static instance: UserController;
    private userModel: UserModel;

    public static getInstance(): UserController {
        if (!UserController.instance) {
            UserController.instance = new UserController();
        }
        return UserController.instance;
    }

    constructor() {
        this.userModel = new UserModel();
    }

    public createUser(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { name, username } = request.body as { name: string, username: string };
            const result = this.userModel.create({ name, username });
            reply.code(201).send(result);
        }
        catch (error) {
            reply.code(400).send({ error: "Failed to create user" });
        }
    }

    public readAllUser(request: FastifyRequest, reply: FastifyReply) {
        try {
            const users = this.userModel.readAll();
            reply.send(users);
        }
        catch (error) {
            reply.code(500).send({ error: "Failed to fetch users" });
        }
    }

    public readOneUser(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const user = this.userModel.readOne(Number(id));
            if (user) {
                reply.send(user);
            }
            else {
                reply.code(404).send({ error: "User not found" });
            }
        }
        catch (error) {
            reply.code(500).send({ error: "Error retrieving user" });
        }
    }

    public updateUser(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const { name, username } = request.body as { name: string, username: string };
            const result = this.userModel.update({ id: Number(id), name, username });
            reply.send(result);
        }
        catch (error) {
            reply.code(400).send({ error: "Failed to update user" });
        }
    }

    public deleteUser(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = request.params as { id: string };
            const result = this.userModel.delete(Number(id));
            reply.send(result);
        }
        catch (error) {
            reply.code(400).send({ error: "Failed to delete user" });
        }
    }
}
