import { FastifyInstance } from "fastify";
import { UserController } from "../backend/controllers/UserController.js";
import { UserService } from "../backend/services/user.service.js";

export default async function userRoutes(fastify: FastifyInstance) {
    const userService = new UserService();
    const userController = new UserController(userService)

    fastify.post('/register', userController.register.bind(userController))
    fastify.post('/login', userController.login.bind(userController))
    // fastify.post('/logout', userController.logout.bind(userController))
}

// export default async function (fastify: FastifyInstance) {
//     const userController = UserController.getInstance();

    // Create
    // curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{ "name": "Bob", "username": "bob42" }'
    // fastify.post("/users", async (request, reply) => {
    //     try {
    //         const { name, username } = request.body as { name: string, username: string };
    //         const result = userController.createUser({ name, username });
    //         reply.code(201).send(result);
    //     }
    //     catch (error: any) {
    //         reply.code(400).send({ error: "Failed to create user" });
    //     }
    // });

    // // Read all
    // // curl -X GET http://localhost:3000/api/users
    // fastify.get("/users", async (_request, reply) => {
    //     try {
    //         const users = userController.readAllUser();
    //         reply.send(users);
    //     }
    //     catch (error: any) {
    //         reply.code(500).send({ error: "Failed to fetch users" });
    //     }
    // });

    // // Read one
    // // curl -X GET http://localhost:3000/api/users/2
    // fastify.get("/users/:id", async (request, reply) => {
    //     try {
    //         const { id } = request.params as { id: string };
    //         const user = userController.readOneUser(Number(id));
    //         if (user) {
    //             reply.send(user);
    //         }
    //         else {
    //             reply.code(404).send({ error: "User not found" });
    //         }
    //     }
    //     catch (error: any) {
    //         reply.code(500).send({ error: "Error retrieving user" });
    //     }
    // });

    // // Update
    // // curl -X PUT http://localhost:3000/api/users/4 -H "Content-Type: application/json" -d '{ "name": "Alice", "username": "Alice42" }'
    // fastify.put("/users/:id", async (request, reply) => {
    //     try {
    //         const { id } = request.params as { id: string };
    //         const { name, username } = request.body as { name: string, username: string };
    //         const result = userController.updateUser({ id: Number(id), name, username });
    //         reply.send(result);
    //     }
    //     catch (error: any) {
    //         reply.code(400).send({ error: "Failed to update user" });
    //     }
    // });

    // // Delete
    // // curl -X DELETE http://localhost:3000/api/users/1
    // fastify.delete("/users/:id", async (request, reply) => {
    //     try {
    //         const { id } = request.params as { id: string };
    //         const result = userController.deleteUser(Number(id));
    //         reply.send(result);
    //     }
    //     catch (error: any) {
    //         reply.code(400).send({ error: "Failed to delete user" });
    //     }
    // });
// }
