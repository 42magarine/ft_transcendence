import { FastifyInstance } from "fastify";
import { UserController } from "../backend/controllers/UserController.js";
import { UserService } from "../backend/services/UserService.js";

export default async function (fastify: FastifyInstance) {
	const userService = new UserService();
	const userController = new UserController(userService);

	fastify.get('/users/', userController.getAll.bind(userController));
	fastify.post('/users/register', userController.register.bind(userController));
	fastify.post('/users/login', userController.login.bind(userController));
	// fastify.post('/logout', userController.logout.bind(userController));
}
