// /signup     GET     sign up page
// /login      GET     log in page
// /signup     POST    create a new user in db
// /login      POST    authenticate a current user
// /logout     GET     log a user out

// 1. Login page
// 2. Signup page
// 3. Proteced user profile page (if not signed in -> redirect to Login page)

import { FastifyInstance } from "fastify";
import { AuthController } from "../backend/controllers/AuthController.js";

export default async function (fastify: FastifyInstance) {
    const authController = new AuthController;

    fastify.get("/signup", authController.signupGet);
    fastify.post("/signup", authController.signupPost);
    fastify.get("/login", authController.loginGet);
    fastify.post("/login", authController.loginPost);
}
