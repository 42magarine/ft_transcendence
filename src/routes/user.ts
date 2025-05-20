import { FastifyInstance } from "fastify";
import { UserController } from "../backend/controllers/UserController.js";
import { UserService } from "../backend/services/UserService.js";

export default async function (fastify: FastifyInstance) {
    const userService = new UserService();
    const userController = new UserController(userService);

    // Authentication routes
    fastify.get('/api/auth/me', userController.getCurrentUser.bind(userController));
    fastify.post('/api/users/login', userController.login.bind(userController));
    fastify.post('/api/users/auth/google', userController.loginWithGoogle.bind(userController));
    fastify.post('/api/auth/logout', userController.logout.bind(userController));

    // User management routes
    fastify.get('/api/users/', userController.getAll.bind(userController));
    fastify.get('/api/users/:id', userController.getById.bind(userController));
    fastify.get('/api/users/delete/:id', userController.deleteById.bind(userController));
    fastify.post('/api/users/register', userController.register.bind(userController));

    // Email verification routes
    fastify.get('/api/verify-email/:token', userController.verifyEmail.bind(userController));
    fastify.post('/api/resend-verification', userController.resendVerificationEmail.bind(userController));
    fastify.get('/api/generate-qr', userController.generateQR.bind(userController));
    fastify.post('/api/users/verify-two-factor', userController.verifyTwoFactor.bind(userController));

    // Password reset routes
    fastify.post('/api/request-password-reset', userController.requestPasswordReset.bind(userController));
    fastify.get('/api/reset-password/:token', userController.checkResetToken.bind(userController));
    fastify.post('/api/reset-password/:token', userController.resetPassword.bind(userController));
}
