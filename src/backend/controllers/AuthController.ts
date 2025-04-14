import { FastifyReply, FastifyRequest } from "fastify";

export class AuthController {
    public signupGet = async (request: FastifyRequest, reply: FastifyReply) => {
        reply.code(200).send("signup GET");
    }

    public signupPost = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { username, password } = request.body as { username: string, password: string };
            console.log(username, password);
            reply.code(200).send("signup POST - success");
        }
        catch (error) {
            reply.code(404).send("signup POST - fail");
        }
    }

    public loginGet = async (request: FastifyRequest, reply: FastifyReply) => {
        reply.code(200).send("login GET");
    }

    public loginPost = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const { username, password } = request.body as { username: string, password: string };
            console.log(username, password);
            reply.code(200).send("login POST - success");
        }
        catch (error) {
            reply.code(404).send("login POST - fail");
        }
    }
}

// JSON to String:
// const jsonString = JSON.stringify(obj);

// String to JSON:
// const obj = JSON.parse(jsonString);
