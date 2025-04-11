import AbstractView from '../../utils/AbstractView.js';

export default class Card extends AbstractView {
	constructor(params: URLSearchParams = new URLSearchParams()) {
		super(params);
	}

	async getHtml() {
		// Get title and other props from the component props
		return this.render(`
			<div class="card {{props.className || ''}}">
				<if condition="props.title">
					<div class="card-header">
						<h3>{{props.title}}</h3>
					</div>
				</if>
				<div class="card-body">
					<%%%>
				</div>
				<if condition="props.footer">
					<div class="card-footer">
						{{props.footer}}
					</div>
				</if>

				
			</div>
		`, {});
	}
}