import { FastifyInstance } from "fastify";
import { UserController } from "../backend/controllers/UserController.js";
import { UserService } from "../backend/services/UserService.js";
import { authenticateToken } from "../backend/middleware/security.js";

export default async function (fastify: FastifyInstance) {
    const userService = new UserService();
    const userController = new UserController(userService);

    // Authentication routes
    fastify.post('/api/users/register', userController.register.bind(userController));
    fastify.post('/api/users/login', userController.login.bind(userController));
    fastify.post('/api/users/google', userController.loginWithGoogle.bind(userController));
    fastify.post('/api/users/refresh', userController.refreshToken.bind(userController));

    // Email verification routes
    fastify.get('/api/verify-email/:token', userController.verifyEmail.bind(userController));
    fastify.post('/api/resend-verification', userController.resendVerificationEmail.bind(userController));

    // Password reset routes
    fastify.post('/api/request-password-reset', userController.requestPasswordReset.bind(userController));
    fastify.get('/api/reset-password/:token', userController.checkResetToken.bind(userController));
    fastify.post('/api/reset-password/:token', userController.resetPassword.bind(userController));

    // 2FA verification
    fastify.post('/api/users/verify-two-factor', userController.verifyTwoFactor.bind(userController));
    fastify.get('/api/generate-qr', userController.generateQR.bind(userController));

    // Logout
    fastify.route({
        method: 'POST',
        url: '/api/users/logout',
        preHandler: authenticateToken,
        handler: userController.logout.bind(userController)
    });

    // User Service routes
    fastify.route({
        method: 'GET',
        url: '/api/users/me',
        preHandler: authenticateToken,
        handler: userController.getCurrentUser.bind(userController)
    });

    fastify.route({
        method: 'GET',
        url: '/api/users/',
        preHandler: authenticateToken,
        handler: userController.getAll.bind(userController)
    });

    fastify.route<{ Params: { id: string } }>({
        method: 'GET',
        url: '/api/users/:id',
        preHandler: authenticateToken,
        handler: userController.getById.bind(userController)
    });

    fastify.route<{ Params: { id: string } }>({
        method: 'PUT',
        url: '/api/users/:id',
        preHandler: authenticateToken,
        handler: userController.updateUser.bind(userController)
    });

    fastify.route<{ Params: { id: string } }>({
        method: 'DELETE',
        url: '/api/users/:id',
        preHandler: authenticateToken,
        handler: userController.deleteById.bind(userController)
    });
}
