// Import required modules
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TicTacToe } from "./game_logic.js";

// Fix for `__dirname` in ES modules
const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.resolve(path.dirname(__filename), "../");

// Create Fastify instance with logging enabled
const fastify = Fastify({ logger: true });

const game: TicTacToe = new TicTacToe();

// Register the WebSocket plugin to enable WebSocket support.
fastify.register(fastifyWebsocket);

// Define a WebSocket endpoint at /ws
fastify.register(async (fastify) => {
    fastify.get("/ws", { websocket: true }, (connection) => {
        const broadcast = (data: object) => {
            const message = JSON.stringify(data);
            fastify.websocketServer.clients.forEach((client) => {
                if (client.readyState === 1) {
                    client.send(message);
                }
            });
        };

        connection.send(JSON.stringify({
            type: "initBoard",
            board: game.getBoard(),
        }));

        connection.on("message", (message) => {
            const data = JSON.parse(message.toString());

            if (data.type === "makeMove") {
                const result = game.makeMove(data.index);
                broadcast(result);
            }

            if (data.type === "resetGame") {
                const result = game.resetGame();
                broadcast(result);
            }
        });
    });
});

// Register the Fastify Static plugin to serve static files
fastify.register(fastifyStatic, { root: __dirname });

// Serve `index.html` at `/`
fastify.get("/", async (_req, reply) => reply.sendFile("index.html"));

// Serve `hello.html` at `/hello`
fastify.get("/hello", async (_req, reply) => reply.sendFile("hello.html"));

// Start the server
const start = async (): Promise<void> => {
    try {
        await fastify.listen({ port: 3000, host: "0.0.0.0" });
    }
    catch (error) {
        fastify.log.error(error);
        process.exit(1);
    }
};

start();
