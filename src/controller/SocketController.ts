import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { GameController } from './GameController.js';

// Define our own WebSocket connection interface
interface SocketConnection {
	socket: WebSocket;
}

/**
 * Controller for WebSocket connections
 */
export class SocketController {
	private static instance: SocketController;
	private fastify: FastifyInstance | null = null;
	private connections: Set<SocketConnection> = new Set();
	private gameController: GameController;

	private constructor() {
		this.gameController = GameController.getInstance();
	}

	/**
	 * Get singleton instance
	 */
	public static getInstance(): SocketController {
		if (!SocketController.instance) {
			SocketController.instance = new SocketController();
		}
		return SocketController.instance;
	}

	/**
	 * Set the Fastify instance
	 */
	public setFastify(fastify: FastifyInstance): void {
		this.fastify = fastify;
	}

	/**
	 * Set up a new WebSocket connection
	 */
	public setupWebSocket(connection: { socket: WebSocket }): void {
		console.log('New WebSocket connection');

		// Add connection to set
		this.connections.add(connection);

		// Set up event handlers
		connection.socket.on('message', (message: Buffer) => {
			this.handleMessage(connection, message);
		});

		connection.socket.on('close', () => {
			console.log('WebSocket connection closed');
			this.connections.delete(connection);
		});

		// Send initial game state
		this.sendGameState(connection);
	}

	/**
	 * Handle an incoming message
	 */
	private handleMessage(connection: SocketConnection, message: Buffer): void {
		try {
			const data = JSON.parse(message.toString());

			// Handle different message types
			switch (data.type) {
				case 'makeMove':
					if (typeof data.index === 'number') {
						const result = this.gameController.makeMove(data.index);
						this.broadcastGameState();
					}
					break;

				case 'resetGame':
					this.gameController.resetGame();
					this.broadcastGameState();
					break;

				default:
					console.log('Unknown message type:', data.type);
			}
		} catch (error) {
			console.error('Error handling WebSocket message:', error);
		}
	}

	/**
	 * Send current game state to a specific connection
	 */
	private sendGameState(connection: SocketConnection): void {
		const gameState = this.gameController.getGameState();

		connection.socket.send(JSON.stringify({
			type: 'gameUpdate',
			gameState
		}));
	}

	/**
	 * Broadcast game state to all connections
	 */
	public broadcastGameState(): void {
		const gameState = this.gameController.getGameState();

		this.connections.forEach(connection => {
			if (connection.socket.readyState === 1) { // OPEN
				connection.socket.send(JSON.stringify({
					type: 'gameUpdate',
					gameState
				}));
			}
		});
	}
}