import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { TicTacToe } from "./game.js";

const fastify = Fastify();
fastify.register(fastifyWebsocket);

const game = new TicTacToe();

fastify.register(async function (fastify) {
    fastify.get("/ws", { websocket: true }, (connection) => {
        // connection.socket.send(JSON.stringify({ type: "init", board: game.getBoard(), player: game.getCurrentPlayer() }));

        connection.send(JSON.stringify({ type: "init", board: game.getBoard(), player: game.getCurrentPlayer() }));

        // connection.socket.on("message", (message) => {
        //     const data = JSON.parse(message.toString());

        connection.on("message", (message) => {
            const data = JSON.parse(message.toString());

            if (data.type === "move") {
                const result = game.makeMove(data.index);
                fastify.websocketServer.clients.forEach(client => {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify({ type: "update", ...result }));
                    }
                });
            }

            if (data.type === "reset") {
                const result = game.resetGame();
                fastify.websocketServer.clients.forEach(client => {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify({ type: "reset", ...result }));
                    }
                });
            }
        });
    });
});

// // Serve static frontend
// fastify.register(require("@fastify/static"), {
//     root: require("path").join(__dirname, "../frontend"),
//     prefix: "/",
// });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(__filename);
console.log(__dirname);

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "../"), // Serve static files from the "html" folder
});

fastify.listen({ port: 3000, host: "0.0.0.0" }, () => {
    console.log("Server running on port 3000");
});
