// ========================
// File: components/Title.ts
// ========================

import AbstractView from '../../utils/AbstractView.js';
import { themedTitle, themedSubtitle } from '../theme/themeHelpers.js';

interface TitleProps {
	title: string;
	subtitle?: string;
}

export default class Title extends AbstractView {
	private titleText: string;
	private subtitleText?: string;

	constructor(params: URLSearchParams = new URLSearchParams(), { title, subtitle }: TitleProps) {
		super(params);
		this.titleText = title;
		this.subtitleText = subtitle;
	}

	async getHtml(): Promise<string> {
		const theme = this.props?.theme || 'default';
		const titleClass = themedTitle(theme);
		const subtitleClass = themedSubtitle(theme);

		return this.render(`
			<section class="w-full text-center pt-24 pb-16 px-4 mb-12">
				<div class="space-y-6">
					<h1 class="text-6xl md:text-7xl font-black ${titleClass} tracking-tight drop-shadow-2xl">
						${this.titleText}
					</h1>
					${
						this.subtitleText
							? `<p class="text-xl md:text-2xl ${subtitleClass} max-w-2xl mx-auto leading-relaxed">
									${this.subtitleText}
								</p>`
							: ''
					}
				</div>
			</section>
		`);
	}
}
