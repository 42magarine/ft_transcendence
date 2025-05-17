import { table } from "console";

/**
 * Creates a scrollable tbody while preserving cell widths
 * @param tableId - The ID of the table element
 * @param maxHeight - Maximum height for the scrollable area (e.g., '300px')
 */
function makeScrollableTbody(tableId: string, maxHeight: string): void {
    // Strict type checking
    if (typeof tableId !== 'string' || typeof maxHeight !== 'string') {
        throw new TypeError('tableId and maxHeight must be strings');
    }

    // Get the table element
    const table = document.getElementById(tableId) as HTMLTableElement;
    if (!table) {
        throw new Error(`Table with ID "${tableId}" not found`);
    }

    // Get the thead and tbody elements
    const thead = table.querySelector('thead') as HTMLTableSectionElement;
    const tbody = table.querySelector('tbody') as HTMLTableSectionElement;

    if (!thead || !tbody) {
        throw new Error(`Table must have both thead and tbody elements`);
    }

    // Apply styles to the table
    table.style.tableLayout = 'fixed';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    // Make the tbody scrollable (vertical only)
    tbody.style.display = 'block';
    tbody.style.overflowY = 'auto';  // Only vertical scrolling
    tbody.style.overflowX = 'hidden'; // Prevent horizontal scrolling
    tbody.style.maxHeight = maxHeight;

    // Make the thead stick to the top
    thead.style.display = 'block';
    thead.style.overflowX = 'hidden'; // Prevent horizontal scrolling

    // First, get all cells in the first row of thead to measure and preserve their width
    const headerRow = thead.rows[0];
    if (!headerRow) {
        throw new Error('Table has no header rows');
    }

    const headerCells = headerRow.cells;
    const cellWidths: string[] = [];
    const totalWidth = headerRow.offsetWidth;

    // Calculate the percentage width of each column based on the header
    for (let i = 0; i < headerCells.length; i++) {
        // Store original width percentage to maintain proportions
        const widthPercentage = (headerCells[i].offsetWidth / totalWidth) * 100;
        cellWidths.push(`${widthPercentage}%`);
    }

    // Apply the calculated percentage widths to all cells
    const applyWidthsToCells = (row: HTMLTableRowElement): void => {
        const cells = row.cells;
        for (let i = 0; i < cells.length && i < cellWidths.length; i++) {
            cells[i].style.width = cellWidths[i];
            cells[i].style.minWidth = cellWidths[i];
            cells[i].style.maxWidth = cellWidths[i];
        }
    };

    // Apply to header cells
    for (let i = 0; i < thead.rows.length; i++) {
        applyWidthsToCells(thead.rows[i]);
    }

    // Apply to body cells
    for (let i = 0; i < tbody.rows.length; i++) {
        applyWidthsToCells(tbody.rows[i]);
    }

    // Fix the width of the thead to match tbody (accounting for scrollbar)
    const scrollbarWidth = tbody.offsetWidth - tbody.clientWidth;
    thead.style.paddingRight = `${scrollbarWidth}px`;

    // Set display on all rows to address potential layout issues
    const allRows = table.querySelectorAll('tr');
    allRows.forEach((row: HTMLTableRowElement) => {
        row.style.display = 'table';
        row.style.width = '100%';
        row.style.tableLayout = 'fixed';
    });
}

class ScrollableTable {
    private table: HTMLTableElement;
    private thead: HTMLTableSectionElement;
    private tbody: HTMLTableSectionElement;
    private resizeObserver: ResizeObserver;
    private maxHeight: string;
    private originalColumnWidths: string[] = [];

    constructor(table: HTMLTableElement, maxHeight: string) {
        this.maxHeight = maxHeight;

        if (!table) {
            throw new Error(`Table element not found`);
        }
        this.table = table;

        // Get the thead and tbody elements
        const thead = this.table.querySelector('thead');
        const tbody = this.table.querySelector('tbody');

        if (!thead || !tbody) {
            throw new Error(`Table must have both thead and tbody elements`);
        }

        this.thead = thead as HTMLTableSectionElement;
        this.tbody = tbody as HTMLTableSectionElement;

        // Store the original column widths before making any changes
        this.storeOriginalColumnWidths();

        // Initialize resize observer to handle dynamic content changes
        this.resizeObserver = new ResizeObserver(() => this.adjustTable());
        this.resizeObserver.observe(this.table);

        // Set up initial styles
        this.setupTableStyles();

        // Apply initial sizes
        this.adjustTable();

        // Handle window resize
        window.addEventListener('resize', () => this.adjustTable());
    }

    private storeOriginalColumnWidths(): void {
        const headerRow = this.thead.rows[0];
        if (!headerRow) return;

        const headerCells = headerRow.cells;
        const totalWidth = headerRow.offsetWidth;

        // Store the original width percentages
        for (let i = 0; i < headerCells.length; i++) {
            // Get computed width or offsetWidth
            const computedStyle = window.getComputedStyle(headerCells[i]);
            const width = headerCells[i].offsetWidth;
            const widthPercentage = (width / totalWidth) * 100;

            // If the element has a specific width set in CSS, use that instead
            if (computedStyle.width !== 'auto') {
                this.originalColumnWidths.push(computedStyle.width);
            } else {
                // Otherwise use calculated percentage
                this.originalColumnWidths.push(`${widthPercentage}%`);
            }
        }
    }

    private setupTableStyles(): void {
        // Table styles
        this.table.style.tableLayout = 'fixed';
        this.table.style.width = '100%';
        this.table.style.borderCollapse = 'collapse';

        // Make the tbody scrollable (vertical only)
        this.tbody.style.display = 'block';
        this.tbody.style.overflowY = 'auto';    // Only vertical scrolling
        this.tbody.style.overflowX = 'hidden';  // Prevent horizontal scrolling
        this.tbody.style.maxHeight = this.maxHeight;

        // Make the thead stick to the top
        this.thead.style.display = 'block';
        this.thead.style.overflowX = 'hidden';  // Prevent horizontal scrolling
    }

    private adjustTable(): void {
        // Calculate scrollbar width
        const scrollbarWidth = this.tbody.offsetWidth - this.tbody.clientWidth;

        // Apply the original widths (maintaining proportions)
        this.applyCellWidths(this.originalColumnWidths);

        // Fix the width of the thead to match tbody (accounting for scrollbar)
        this.thead.style.paddingRight = `${scrollbarWidth}px`;

        // Set display properties on all rows
        const allRows = this.table.querySelectorAll('tr');
        allRows.forEach((row) => {
            const tableRow = row as HTMLTableRowElement;
            tableRow.style.display = 'table';
            tableRow.style.width = '100%';
            tableRow.style.tableLayout = 'fixed';
        });
    }

    private applyCellWidths(cellWidths: string[]): void {
        // Function to apply to rows
        const applyToRow = (row: HTMLTableRowElement): void => {
            const cells = row.cells;
            for (let i = 0; i < cells.length && i < cellWidths.length; i++) {
                cells[i].style.width = cellWidths[i];
                cells[i].style.minWidth = cellWidths[i];
                cells[i].style.maxWidth = cellWidths[i];
                // Prevent content from expanding cells
                cells[i].style.overflow = 'hidden';
                cells[i].style.textOverflow = 'ellipsis';
                cells[i].style.whiteSpace = 'nowrap';
            }
        };

        // Apply to all rows
        for (let i = 0; i < this.thead.rows.length; i++) {
            applyToRow(this.thead.rows[i]);
        }

        for (let i = 0; i < this.tbody.rows.length; i++) {
            applyToRow(this.tbody.rows[i]);
        }
    }

    // Public method to update max height
    public updateMaxHeight(newMaxHeight: string): void {
        this.maxHeight = newMaxHeight;
        this.tbody.style.maxHeight = this.maxHeight;
    }

    // Clean up method
    public destroy(): void {
        this.resizeObserver.disconnect();
        window.removeEventListener('resize', () => this.adjustTable());
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
