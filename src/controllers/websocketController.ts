import { FastifyInstance } from "fastify";
import { WebSocket } from "ws";
import { TicTacToe } from "../models/TicTacToe.js";

export default class WebsocketController {
    private game = new TicTacToe();

    constructor(private fastify: FastifyInstance) { }

    public handleConnection = (connection: WebSocket) => {
        connection.send(JSON.stringify({
            type: "initBoard",
            board: this.game.getBoard(),
        }));

        connection.on("message", (message) => {
            const data = JSON.parse(message.toString());

            if (data.type === "makeMove") {
                const result = this.game.makeMove(data.index);
                this.broadcast(result);
            }

            if (data.type === "resetGame") {
                const result = this.game.resetGame();
                this.broadcast(result);
            }
        });
    };

    private broadcast(data: object) {
        const message = JSON.stringify(data);
        this.fastify.websocketServer.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(message);
            }
        });
    }
}
