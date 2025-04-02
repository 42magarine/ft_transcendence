import React from 'react';

interface GameProps {
	currentPlayer: string;
	board: string[];
}

function Component(props: GameProps) {
	const { currentPlayer, board } = props;

	return (
		<html lang="en">
			<head>
				<meta charSet="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Tic Tac Toe</title>
				<style>
					{`
			body {
			font-family: sans-serif;
			text-align: center;
			margin: 20px;
			}
			.gameBoard {
			display: grid;
			grid-template-columns: repeat(3, 100px);
			grid-gap: 5px;
			margin: 20px auto;
			width: 310px;
			}
			.cell {
			width: 100px;
			height: 100px;
			border: 1px solid #333;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 40px;
			cursor: pointer;
			}
			button {
			padding: 10px 20px;
			font-size: 16px;
			margin-top: 20px;
			cursor: pointer;
			}
		`}
				</style>
			</head>
			<body>
				<h1>Current player: {currentPlayer}</h1>
				<div className="gameBoard">
					{board.map((cell, index) => (
						<div className="cell" data-index={index} key={index}>{cell}</div>
					))}
				</div>
				<button className="restartButton">Restart Game</button>

				<script dangerouslySetInnerHTML={{
					__html: `
			// WebSocket connection
			const socket = new WebSocket(\`ws://\${window.location.host}/ws\`);
			const headerTitle = document.querySelector("h1");
			const cells = document.querySelectorAll(".cell");
			const restartButton = document.querySelector(".restartButton");

			// Handle WebSocket events
			socket.addEventListener("open", () => {
			console.log("Connected to WebSocket server");
			});

			socket.addEventListener("message", (event) => {
			const data = JSON.parse(event.data);
			console.log("Received message:", data);

			if (data.type === "initBoard" || data.type === "resetBoard") {
				updateBoard(data.board);
				updateStatus("Current player: " + (data.player || "x"));
			}
			else if (data.type === "updateBoard") {
				updateBoard(data.board);

				if (data.win) {
				updateStatus(\`\${data.player} wins!\`);
				}
				else if (data.draw) {
				updateStatus("It's a draw!");
				}
				else {
				updateStatus(\`Current player: \${data.player}\`);
				}
			}
			});

			// Update board based on server state
			function updateBoard(board) {
			cells.forEach((cell, index) => {
				cell.textContent = board[index];
			});
			}

			// Update game status message
			function updateStatus(message) {
			headerTitle.textContent = message;
			}

			// Cell click handler
			document.querySelector(".gameBoard").addEventListener("click", (event) => {
			const target = event.target;
			if (target.classList.contains("cell")) {
				const index = Number(target.dataset.index);
				socket.send(JSON.stringify({ type: "makeMove", index }));
			}
			});

			// Restart button handler
			restartButton.addEventListener("click", () => {
			socket.send(JSON.stringify({ type: "resetGame" }));
			});
		`
				}}></script>
			</body>
		</html>
	);
}

export default Component;