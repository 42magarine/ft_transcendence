import AbstractView from '../../utils/AbstractView.js';
import { TableProps, ContentBlock } from '../../interfaces/abstractViewInterfaces.js';
import Button from './Button.js';

export default class Table extends AbstractView {
    constructor(params: URLSearchParams = new URLSearchParams()) {
        super(params);
    }

    async renderTable({ id, title = '', height = '300px', data, rowLayout }: TableProps): Promise<string> {
        const tableId = id;

        const rowsHtml = await Promise.all(data.map(async (row) => {
            const cellBlocks = rowLayout(row); // expected to return one block per column

            const cells = await Promise.all(cellBlocks.map(async (block) => {
                const cellContent = await this.renderBlock(block);
                return `<td class="px-4 py-2 border-b border-white/10 text-white">${cellContent}</td>`;
            }));

            return `<tr class="hover:bg-white/5 transition">${cells.join('')}</tr>`;
        }));

        return this.render(`
			<div class="table-container">
				${title ? `<h2 class="text-xl font-semibold mb-2 text-white">${title}</h2>` : ''}
				<div class="overflow-y-auto rounded-md" style="max-height: ${height};">
					<table id="${tableId}" class="w-full table-fixed border-collapse text-sm text-white">
						<thead class="sticky top-0 bg-black/70 z-10 backdrop-blur-md">
							<tr>
								<!-- You can customize these headers as needed -->
								<th class="px-4 py-2 text-left font-semibold">Lobby</th>
								<th class="px-4 py-2 text-left font-semibold">ID</th>
								<th class="px-4 py-2 text-left font-semibold">Max</th>
								<th class="px-4 py-2 text-left font-semibold">Players</th>
								<th class="px-4 py-2 text-left font-semibold">Status</th>
								<th class="px-4 py-2 text-left font-semibold" colspan="2">Actions</th>
							</tr>
						</thead>
						<tbody>
							${rowsHtml.join('\n')}
						</tbody>
					</table>
				</div>
			</div>
		`);
    }

    private async renderBlock(block: ContentBlock): Promise<string> {
        switch (block.type) {
            case 'label': {
                const Label = (await import('./Label.js')).default;
                return await new Label().renderLabel(block.props);
            }
            case 'stat': {
                const Stat = (await import('./Stat.js')).default;
                return await new Stat().renderStat(block.props);
            }
            case 'buttongroup': {
                const Button = (await import('./Button.js')).default;
                return await new Button().renderGroup(block.props);
            }
            default:
                return '';
        }
    }

    async getHtml(): Promise<string> {
        return this.render(`<div class="table-component text-white">No direct table view.</div>`);
    }
}
