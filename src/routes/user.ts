import { FastifyInstance } from "fastify";
import { UserController } from "../controllers/UserController.js";

export default async function (fastify: FastifyInstance) {
    const userController = UserController.getInstance();

    // Create
    // curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{ "name": "Bob", "username": "bob42" }'
    fastify.post("/users", async (request, reply) => {
        const { name, username } = request.body as { name: string, username: string };
        try {
            const result = userController.createUser({ name, username });
            reply.code(201).send(result);
        }
        catch (err) {
            reply.code(400).send({ error: "Username already exists" });
        }
    });

    // Read all
    // curl -X GET http://localhost:3000/api/users
    fastify.get("/users", async (_request, reply) => {
        const users = userController.readAllUser();
        reply.send(users);
    });

    // Read one
    // curl -X GET http://localhost:3000/api/users/2
    fastify.get("/users/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        const user = userController.readOneUser(Number(id));
        if (user) {
            reply.send(user);
        }
        else {
            reply.code(404).send({ error: "User not found" });
        }
    });

    // Update
    // curl -X PUT http://localhost:3000/api/users/4 -H "Content-Type: application/json" -d '{ "name": "Alice", "username": "Alice42" }'
    fastify.put("/users/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        const { name, username } = request.body as { name: string, username: string };
        const result = userController.updateUser({ id: Number(id), name, username });
        reply.send(result);
    });

    // Delete
    // curl -X DELETE http://localhost:3000/api/users/1
    fastify.delete("/users/:id", async (request, reply) => {
        const { id } = request.params as { id: string };
        const result = userController.deleteUser(Number(id));
        reply.send(result);
    });
}
