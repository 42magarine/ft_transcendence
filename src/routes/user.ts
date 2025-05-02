import { FastifyInstance } from "fastify";
import { UserController } from "../backend/controllers/UserController.js";
import { UserService } from "../backend/services/UserService.js";

export default async function (fastify: FastifyInstance) {
	const userService = new UserService();
	const userController = new UserController(userService);

	fastify.get('/auth/me', userController.getCurrentUser.bind(userController));
	fastify.post('/auth/logout', userController.logout.bind(userController));
	fastify.get('/users/', userController.getAll.bind(userController));
	fastify.get('/users/:id', userController.getById.bind(userController));
	fastify.get('/users/delete/:id', userController.deleteById.bind(userController));
	fastify.post('/users/register', userController.register.bind(userController));
	fastify.post('/users/login', userController.login.bind(userController));
	// fastify.post('/logout', userController.logout.bind(userController));
}