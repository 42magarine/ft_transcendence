export default abstract class AbstractView {
	protected params: URLSearchParams;
	protected title: string;

	constructor(params: URLSearchParams = new URLSearchParams(window.location.search)) {
		this.params = params;
		this.title = 'Transcendence';
		this.setTitle(this.title);
	}

	/**
	 * Set the document title
	 */
	setTitle(title: string): void {
		document.title = title;
	}

	/**
	 * Get the HTML content for this view
	 */
	abstract getHtml(): Promise<string>;

	/**
	 * Called after the HTML is inserted into the DOM
	 */
	async afterRender(): Promise<void> {
		// Default implementation does nothing
		// Child classes can override to attach event listeners, etc.
	}

	/**
	 * Clean up any resources used by this view
	 */
	destroy(): void {
		// Default implementation does nothing
		// Child classes can override to remove event listeners, etc.
	}
}