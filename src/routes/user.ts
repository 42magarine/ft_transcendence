import { FastifyInstance } from "fastify";
import { UserController } from "../backend/controllers/UserController.js";
import { UserService } from "../backend/services/UserService.js";

export default async function (fastify: FastifyInstance) {
    const userService = new UserService();
    const userController = new UserController(userService);

    // Authentication routes
    fastify.get('/auth/me', userController.getCurrentUser.bind(userController));
    fastify.post('/auth/logout', userController.logout.bind(userController));
    fastify.post('/users/auth/google', userController.loginWithGoogle.bind(userController));

    // User management routes
    fastify.get('/users/', userController.getAll.bind(userController));
    fastify.get('/users/:id', userController.getById.bind(userController));
    fastify.get('/users/delete/:id', userController.deleteById.bind(userController));
    fastify.post('/users/register', userController.register.bind(userController));
    fastify.post('/users/login', userController.login.bind(userController));

    // Email verification routes
    fastify.get('/verify-email/:token', userController.verifyEmail.bind(userController));
    fastify.post('/resend-verification', userController.resendVerificationEmail.bind(userController));
    fastify.get('/generate-qr', userController.generateQR.bind(userController));
    fastify.post('/users/verify-two-factor', userController.verifyTwoFactor.bind(userController));

    // Password reset routes
    fastify.post('/request-password-reset', userController.requestPasswordReset.bind(userController));
    fastify.get('/reset-password/:token', userController.checkResetToken.bind(userController));
    fastify.post('/reset-password/:token', userController.resetPassword.bind(userController));
}
