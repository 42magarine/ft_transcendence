import AbstractView from '../../utils/AbstractView.js';
import { TableProps, ContentBlock } from '../../interfaces/componentInterfaces.js';

export default class Table extends AbstractView {
    constructor(params: URLSearchParams = new URLSearchParams()) {
        super(params);
    }

    // Renders the entire table layout
    async renderTable({ id, title = '', height = '300px', data, rowLayout, columns = [] }: TableProps): Promise<string> {
        const tableId = id;
        const rowsHtml: string[] = [];

        // Render table body rows
        for (const row of data) {
            const cellBlocks = rowLayout(row);
            const cells: string[] = [];

            for (const block of cellBlocks) {
                const cellContent = await this.renderBlock(block);
                cells.push(`<td class="px-4 py-2 border-b border-white/10 text-white">${cellContent}</td>`);
            }

            rowsHtml.push(`<tr class="hover:bg-white/5 transition">${cells.join('')}</tr>`);
        }

        // Render column headers from `columns` prop
        let headerHtml = '';
        if (columns.length > 0) {
            const ths: string[] = [];

            for (const col of columns) {
                const colspanAttr = col.colspan ? `colspan="${col.colspan}"` : '';
                ths.push(`<th class="px-4 py-2 text-left font-semibold" ${colspanAttr}>${col.label}</th>`);
            }

            headerHtml = `<thead class="sticky top-0 bg-black/70 z-10 backdrop-blur-md">
                <tr>${ths.join('')}</tr>
            </thead>`;
        }

        return this.render(`
            <div class="table-container">
                ${title ? `<h2 class="text-xl font-semibold mb-2 text-white">${title}</h2>` : ''}
                <div class="overflow-y-auto rounded-md" style="max-height: ${height};">
                    <table id="${tableId}" class="w-full table-fixed border-collapse text-sm text-white">
                        ${headerHtml}
                        <tbody>
                            ${rowsHtml.join('\n')}
                        </tbody>
                    </table>
                </div>
            </div>
        `);
    }

    // Renders an individual block type inside a table cell
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

            case 'button': {
                const Button = (await import('./Button.js')).default;
                return await new Button().renderButton(block.props);
            }

            case 'buttongroup': {
                const Button = (await import('./Button.js')).default;
                return await new Button().renderButtonGroup({ ...block.props, layout: 'group', className: 'inline-flex gap-2' });
            }

            default:
                return '';
        }
    }

    // Fallback rendering if no data is provided
    async getHtml(): Promise<string> {
        return this.render(`<div class="table-component text-white">No direct table view.</div>`);
    }
}
