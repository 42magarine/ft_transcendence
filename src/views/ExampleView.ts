import AbstractView from "./AbstractView";

export default class MenuView extends AbstractView {
	constructor() {
		super();
		this.setTitle("Transcendence");
		const loginButton = document.getElementById('login-button');
		if (loginButton) {
			loginButton.classList.remove('make-opaque');
		}
		sessionStorage.removeItem('opponent_name');
	}

	getHtml = async (): Promise<string> => {
		return `
		<div class="window">
			<div class="menu-topbar">
				<div class="title">Menu</div>
			</div>
			<div class="content">
				<a class="a-large-button" href="/pong-menu" data-link>Pong</a>
			</div>
		</div>
		`;
	}

	afterRender = async (): Promise<void> => {
		if (navigator.onLine && this.isLoggedIn) {
			await getPlayerData();
			await checkLoginStatus();
			updateLoginState();
		}
	}
}