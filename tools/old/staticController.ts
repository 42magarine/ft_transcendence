import { FastifyReply, FastifyRequest } from "fastify";

const serveIndex = async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.sendFile("index.html");
};

const serveHello = async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.sendFile("hello.html");
};

export default {
    serveIndex,
    serveHello
};
