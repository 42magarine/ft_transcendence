import AbstractView from "./AbstractView.js";

export default class extends AbstractView {
	constructor() {
		super();
		this.setTitle("Transcendence");
		document.getElementById('login-button').classList.remove('make-opaque');
		sessionStorage.removeItem('opponent_name');
	}

	getHtml = async () => {
		return `
		<div class="window">
			<div class="menu-topbar">
				<div class="title">Menu</div>
			</div>
			<div class="content">
				<a class="a-large-button" href="/pong-menu" data-link>Pong</a>
			</div>
		</div>
		`
	}

	afterRender = async () => {
		if (navigator.onLine && getLoggedIn()) {
			await getPlayerData();
			await checkLoginStatus();
			updateLoginState();
		}
	}
}