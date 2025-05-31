import AbstractView from '../../utils/AbstractView.js';
import { TitleProps } from '../../interfaces/componentInterfaces.js';

export default class Title extends AbstractView
{
    private titleText: string;
    private subtitleText?: string;

    constructor({ title, subtitle }: TitleProps)
    {
        super();
        this.titleText = title;
        this.subtitleText = subtitle;
    }

    async getHtml(): Promise<string>
    {

        return this.render(`
			<section class="w-full text-center pt-24 pb-16 px-4 mb-12">
				<div class="space-y-6">
					<h1 class="text-6xl md:text-7xl font-black tracking-tight drop-shadow-2xl">
						${this.titleText}
					</h1>
					${this.subtitleText
                ? `<p class="text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed">
									${this.subtitleText}
								</p>`
                : ''
            }
				</div>
			</section>
		`);
    }
}
