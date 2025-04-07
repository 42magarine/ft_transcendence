import { WebSocket } from "ws";
import { GameController } from "./GameController.js";

export class WebsocketController {
    private gameController: GameController;
    private clients: Set<WebSocket>;

    constructor() {
        this.gameController = GameController.getInstance();
        this.clients = new Set<WebSocket>();
    }

    public handleConnection = (connection: WebSocket) => {
        console.log("A new client connected!");
        this.clients.add(connection);

        connection.send(JSON.stringify({
            type: "initBoard",
            data: this.gameController.getGameState()
        }));

        connection.on("message", (message) => {
            const data = JSON.parse(message.toString());

            if (data.type === "makeMove") {
                const result = this.gameController.makeMove(data.index);
                this.broadcast(result);
            }

            if (data.type === "resetGame") {
                const result = this.gameController.resetGame();
                this.broadcast(result);
            }
        });

        connection.on("close", () => {
            this.clients.delete(connection);
            console.log("Client disconnected!");
        });
    };

    private broadcast(data: object) {
        const message = JSON.stringify(data);

        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}
