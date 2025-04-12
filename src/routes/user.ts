import { FastifyInstance } from "fastify";
import { UserController } from "../backend/controllers/UserController.js";
import { UserService } from "../backend/services/user.service.js";

export default async function userRoutes(fastify: FastifyInstance) {
    const userService = new UserService();
    const userController = new UserController(userService);

    fastify.post('/register', userController.register.bind(userController));
    fastify.post('/login', userController.login.bind(userController));
    // fastify.post('/logout', userController.logout.bind(userController));
}

// export default async function (fastify: FastifyInstance) {
//     const userController = UserController.getInstance();

//     // POST to create a user
//     // curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{ "name": "Bob", "username": "bob42" }'
//     fastify.post("/users", (request, reply) => {
//         userController.createUser(request, reply)
//     });

//     // GET all users
//     // curl -X GET http://localhost:3000/api/users
//     fastify.get("/users", (request, reply) => {
//         userController.readAllUser(request, reply)
//     });

//     // GET one user by id
//     // curl -X GET http://localhost:3000/api/users/1
//     fastify.get("/users/:id", (request, reply) => {
//         userController.readOneUser(request, reply)
//     });

//     // PUT to update a user
//     // curl -X PUT http://localhost:3000/api/users/1 -H "Content-Type: application/json" -d '{ "name": "Alice", "username": "Alice42" }'
//     fastify.put("/users/:id", (request, reply) => {
//         userController.updateUser(request, reply)
//     });

//     // DELETE to remove a user
//     // curl -X DELETE http://localhost:3000/api/users/1
//     fastify.delete("/users/:id", (request, reply) => {
//         userController.deleteUser(request, reply)
//     });
// }

// Marvin: Controller APIs
// Mathias: Minimal APIs
