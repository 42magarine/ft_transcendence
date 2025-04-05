// view/pages/Game.ts
import AbstractView from '../AbstractView.js';

export default class Game extends AbstractView {
	private socket: WebSocket | null = null;
	private gameState: any = null;

	constructor(params?: URLSearchParams) {
		super(params);
		this.setTitle('Game | Transcendence');
	}

	async getHtml(): Promise<string> {
		return `
			<div class="game-container">
				<h1>Tic-Tac-Toe</h1>

				<div class="game-info">
					<div class="player-turn">Current Turn: <span id="current-player">X</span></div>
					<div class="game-status" id="game-status"></div>
				</div>

				<div class="game-board" id="game-board">
					<div class="board-row">
						<div class="board-cell" data-index="0"></div>
						<div class="board-cell" data-index="1"></div>
						<div class="board-cell" data-index="2"></div>
					</div>
					<div class="board-row">
						<div class="board-cell" data-index="3"></div>
						<div class="board-cell" data-index="4"></div>
						<div class="board-cell" data-index="5"></div>
					</div>
					<div class="board-row">
						<div class="board-cell" data-index="6"></div>
						<div class="board-cell" data-index="7"></div>
						<div class="board-cell" data-index="8"></div>
					</div>
				</div>

				<div class="game-controls">
					<button id="reset-game" class="btn btn-danger">Reset Game</button>
					<a href="/" data-link class="btn btn-secondary">Back to Home</a>
				</div>
			</div>
		`;
	}

	async afterRender(): Promise<void> {
		// Set up WebSocket connection
		this.connectWebSocket();

		// Add event listeners
		this.addEventListeners();

		// Get initial game state
		await this.fetchGameState();
	}

	private connectWebSocket(): void {
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${protocol}//${window.location.host}/ws`;

		this.socket = new WebSocket(wsUrl);

		this.socket.onopen = () => {
			console.log('WebSocket connected');
		};

		this.socket.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'gameUpdate') {
				this.updateGameBoard(data.gameState);
			}
		};

		this.socket.onerror = (error) => {
			console.error('WebSocket error:', error);
		};

		this.socket.onclose = () => {
			console.log('WebSocket disconnected');
		};
	}

	private addEventListeners(): void {
		// Add click handlers for game cells
		const gameBoard = document.getElementById('game-board');
		if (gameBoard) {
			gameBoard.addEventListener('click', (e) => {
				const target = e.target as HTMLElement;
				if (target.classList.contains('board-cell') && !target.textContent) {
					const index = parseInt(target.getAttribute('data-index') || '0');
					this.makeMove(index);
				}
			});
		}

		// Add click handler for reset button
		const resetButton = document.getElementById('reset-game');
		if (resetButton) {
			resetButton.addEventListener('click', () => {
				this.resetGame();
			});
		}
	}

	private async fetchGameState(): Promise<void> {
		try {
			const response = await fetch('/api/game/state');
			const data = await response.json();
			this.updateGameBoard(data);
		} catch (error) {
			console.error('Error fetching game state:', error);
		}
	}

	private async makeMove(index: number): Promise<void> {
		try {
			const response = await fetch('/api/game/move', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ index }),
			});
			const data = await response.json();
			this.updateGameBoard(data);
		} catch (error) {
			console.error('Error making move:', error);
		}
	}

	private async resetGame(): Promise<void> {
		try {
			const response = await fetch('/api/game/reset', {
				method: 'POST',
			});
			const data = await response.json();
			this.updateGameBoard(data);
		} catch (error) {
			console.error('Error resetting game:', error);
		}
	}

	private updateGameBoard(gameState: any): void {
		this.gameState = gameState;

		// Update board cells
		const cells = document.querySelectorAll('.board-cell');
		cells.forEach((cell, index) => {
			const cellValue = gameState.board[index];
			cell.textContent = cellValue || '';
		});

		// Update current player
		const currentPlayerElement = document.getElementById('current-player');
		if (currentPlayerElement) {
			currentPlayerElement.textContent = gameState.currentPlayer;
		}

		// Update game status
		const gameStatusElement = document.getElementById('game-status');
		if (gameStatusElement) {
			if (gameState.winner) {
				gameStatusElement.textContent = `Winner: ${gameState.winner}`;
			} else if (gameState.isDraw) {
				gameStatusElement.textContent = 'Game ended in a draw!';
			} else {
				gameStatusElement.textContent = '';
			}
		}
	}

	destroy(): void {
		// Close WebSocket connection
		if (this.socket) {
			this.socket.close();
			this.socket = null;
		}
	}
}