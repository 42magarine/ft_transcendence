export default abstract class AbstractView {
	protected isLoggedIn: boolean;

	constructor() {
		this.isLoggedIn = getLoggedIn();
	}

	setTitle = (title: string): void => {
		document.title = title;
	}

	abstract getHtml(): Promise<string>;
}