// ========================
// File: views/Pong.ts
// ========================
import ThemedView from '../theme/themedView.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';
export default class Pong extends ThemedView {
    constructor() {
        super('mechazilla', 'Transcendence - Pong');
    }
    async renderView() {
        const theme = this.getTheme();
        const buttonGroup = await new Button(new URLSearchParams({ theme })).renderGroup({
            layout: 'grid',
            align: 'center',
            buttons: [
                { id: 'startGameButton', text: 'Start Game' },
                { id: 'pauseGameButton', text: 'Pause' },
                { id: 'resumeGameButton', text: 'Resume' },
                { id: 'resetGameButton', text: 'Reset' }
            ]
        });
        const params = new URLSearchParams({ theme: this.getTheme() });
        const gameCard = await new Card(params).renderCard({
            title: 'Pong Arena',
            body: `
				<div class="flex flex-col gap-6 items-center justify-center">
					<canvas id="gameCanvas" width="800" height="600" class="bg-black border-4 border-white rounded-lg shadow-lg"></canvas>
					${buttonGroup}
				</div>
			`
        });
        return this.render(`
			<div class="flex justify-center items-center min-h-[80vh] px-4">
				${gameCard}
			</div>

			<script type="module">
				import('../pong_game.js');
			</script>
		`);
    }
}
/*import AbstractView from '../../utils/AbstractView.js';

export default class Pong extends AbstractView {
    constructor(params: URLSearchParams = new URLSearchParams()) {
        super(params);
        this.setTitle('Transcendence - Pong');
    }

    async getHtml() {
        // Example template with various template engine features
        return this.render(`
            <section class="hero">
                <h1>Welcome to Pong</h1>
                <p>{{ user ? 'Welcome back, ' + user.name : 'Join us today!' }}</p>

                <if condition="user && user.isAdmin">
                <div class="admin-panel">
                    <h3>Admin Panel</h3>
                    <p>You have admin privileges</p>
                </div>
                </if>

                <h2>Featured Games</h2>
                <div class="games-list">
                <for each="featuredGames" as="game">
                    <div class="game-card">
                    <h3>{{ game.title }}</h3>
                    <p>{{ game.description }}</p>
                    <if condition="game.isNew">
                        <span class="badge">New!</span>
                    </if>
                    <a router href="/bier">test</a>
                    </div>
                </for>
                </div>
            </section>
            <section class="hero">
                <h1>Welcome to Pong</h1>
                <p>{{ user ? 'Welcome back, ' + user.name : 'Join us today!' }}</p>

                <if condition="user && user.isAdmin">
                <div class="admin-panel">
                    <h3>Admin Panel</h3>
                    <p>You have admin privileges</p>
                </div>
                </if>

                <h2>Featured Games</h2>
                <div class="games-list">
                <for each="featuredGames" as="game">
                    <div class="card">
                    <h3>{{ game.title }}</h3>
                    <p>{{ game.description }}</p>
                    <if condition="game.isNew">
                        <span class="badge">New!</span>
                    </if>
                    <a router href="/bier">test</a>
                    </div>
                </for>
                </div>
            </section>
        `, {
            user: this.params.get('userId') ? { name: 'John', isAdmin: true } : null,
            featuredGames: [
                { title: 'Pong Extreme', description: 'Classic pong with a twist', isNew: true },
                { title: 'Space Invaders+', description: 'Defend the earth', isNew: false },
                { title: 'Tetris Revolution', description: 'Geometric puzzles', isNew: true }
            ]
        });
    }
}*/ 
