import AbstractView from '../../utils/AbstractView.js';
import { TableProps } from '../../interfaces/abstractViewInterfaces.js';
import Button from './Button.js';

export default class Table extends AbstractView
{
	constructor(params: URLSearchParams = new URLSearchParams())
	{
		super(params);
	}

	async renderTable({ id = '', title = '', height = '400px', data, columns }: TableProps): Promise<string>
	{
		const buttonRenderer = new Button();

		const thead = columns.map(col => `<th>${col.label}</th>`).join('');

		const tbody = await Promise.all(data.map(async row =>
		{
			const cells = await Promise.all(columns.map(async col =>
			{
				if (col.buttons)
				{
					const buttons = col.buttons(row);
					const group = await buttonRenderer.renderGroup({
						layout: 'group',
						buttons
					});
					return `<td class="text-right">${group}</td>`;
				}
				else if (col.render)
                    {
                        const value = col.render(row);
                        const truncated = value.length > 15 ? value.slice(0, 15) + '…' : value;
                        return `<td title="${value}">${truncated}</td>`;
                    }
                    else
                    {
                        const value = String(row[col.key] ?? '');
                        const truncated = value.length > 15 ? value.slice(0, 15) + '…' : value;
                        return `<td title="${value}">${truncated}</td>`;
                    }

			}));

			return `<tr>${cells.join('')}</tr>`;
		}));

		return this.render(`
			<div class="table-container">
				<div style="overflow-x: auto; overflow-y: auto; max-height: ${height};">
					${title ? `<h2 class="text-xl font-semibold mb-2">${title}</h2>` : ''}
					<table id="${id}" class="list" data-height="${height}">
						<thead class="sticky">
							<tr>${thead}</tr>
						</thead>
						<tbody>
							${tbody.join('\n')}
						</tbody>
					</table>
				</div>
			</div>
		`);
	}

	async getHtml(): Promise<string>
	{
		return this.render(`<div class="table-component">No direct table view.</div>`);
	}
}
