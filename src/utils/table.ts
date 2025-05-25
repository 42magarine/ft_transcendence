/**
 * Creates a scrollable tbody while keeping it simple
 * @param tableId - The ID of the table element
 * @param maxHeight - Maximum height for the scrollable area (e.g., '300px')
 */
class ScrollableTable {
    private table: HTMLTableElement;
    private thead: HTMLTableSectionElement;
    private tbody: HTMLTableSectionElement;
    private maxHeight: string;

    constructor(table: HTMLTableElement, maxHeight: string) {
        this.table = table;
        this.maxHeight = maxHeight;
        this.thead = table.querySelector('thead') as HTMLTableSectionElement;
        this.tbody = table.querySelector('tbody') as HTMLTableSectionElement;

        if (this.tbody && this.thead) {
            this.setupScrolling();
        }
    }

    private setupScrolling(): void {
        // Set the table container to relative positioning if needed
        const tableContainer = this.table.parentElement;
        if (tableContainer && getComputedStyle(tableContainer).position === 'static') {
            tableContainer.style.position = 'relative';
        }

        // Enable horizontal scrolling for the entire table
        this.table.style.whiteSpace = 'nowrap';
        this.table.style.tableLayout = 'auto';

        // Make container scrollable horizontally
        if (tableContainer) {
            tableContainer.style.overflowX = 'auto';
        }

        // Make tbody scrollable vertically
        this.tbody.style.display = 'block';
        this.tbody.style.maxHeight = this.maxHeight;
        this.tbody.style.overflowY = 'auto';
        this.tbody.style.overflowX = 'hidden';

        // Keep thead visible and non-scrollable
        this.thead.style.display = 'block';

        // Synchronize column widths between thead and tbody
        this.synchronizeColumnWidths();
    }

    private synchronizeColumnWidths(): void {
        // Get all header cells
        const headerCells = this.thead.querySelectorAll('th');
        const firstRow = this.tbody.querySelector('tr');

        if (!firstRow) return;

        const bodyCells = firstRow.querySelectorAll('td');

        // Set fixed widths based on content
        headerCells.forEach((th, index) => {
            const td = bodyCells[index];
            if (td) {
                // Reset styles first
                th.style.width = 'auto';
                td.style.width = 'auto';

                // Get computed styles to include padding
                const thStyle = getComputedStyle(th);
                const tdStyle = getComputedStyle(td);

                // Calculate content width (excluding padding and border)
                const thPaddingLeft = parseFloat(thStyle.paddingLeft);
                const thPaddingRight = parseFloat(thStyle.paddingRight);
                const thBorderLeft = parseFloat(thStyle.borderLeftWidth);
                const thBorderRight = parseFloat(thStyle.borderRightWidth);

                const tdPaddingLeft = parseFloat(tdStyle.paddingLeft);
                const tdPaddingRight = parseFloat(tdStyle.paddingRight);
                const tdBorderLeft = parseFloat(tdStyle.borderLeftWidth);
                const tdBorderRight = parseFloat(tdStyle.borderRightWidth);

                // Get the full width including all spacing
                const thFullWidth = th.getBoundingClientRect().width;
                const tdFullWidth = td.getBoundingClientRect().width;

                // Use the larger width and add a small buffer for safety
                const finalWidth = Math.max(thFullWidth, tdFullWidth) + 1;
                const width = `${finalWidth}px`;

                // Apply the width to header and first row
                th.style.width = width;
                th.style.minWidth = width;
                th.style.maxWidth = width;

                td.style.width = width;
                td.style.minWidth = width;
                td.style.maxWidth = width;

                // Apply to all cells in this column
                this.tbody.querySelectorAll(`tr td:nth-child(${index + 1})`).forEach(cell => {
                    const cellElement = cell as HTMLElement;
                    cellElement.style.width = width;
                    cellElement.style.minWidth = width;
                    cellElement.style.maxWidth = width;
                });
            }
        });
    }
}

document.addEventListener('RouterContentLoaded', () => {
    document.querySelectorAll('table').forEach((table) => {
        const height = table.getAttribute("data-height");
        if (height) {
            new ScrollableTable(table as HTMLTableElement, height);
        }
    });
});