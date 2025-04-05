export class TemplateEngine {
	private cache: Map<string, Function> = new Map();

	constructor() { }

	async render(template: string, data: any = {}): Promise<string> {
		// Process includes first
		template = await this.processIncludes(template);

		// Process the template with the data
		return this.processTemplate(template, data);
	}

	private async processIncludes(template: string): Promise<string> {
		const includeRegex = /<include\s+src=['"](.+?)['"]\s*(?:\s+with=['"](.+?)['"]\s*)?\/>/g;
		let match;
		let processedTemplate = template;

		while ((match = includeRegex.exec(template)) !== null) {
			const [fullMatch, src, withData] = match;
			try {
				// Fetch the include template
				const response = await fetch(src);
				if (!response.ok) throw new Error(`Failed to load include: ${src}`);

				let includeTemplate = await response.text();

				// If withData is provided, it should be a property in the main data object
				// This will be handled when processing the template

				processedTemplate = processedTemplate.replace(fullMatch, includeTemplate);
			} catch (error) {
				console.error(`Error processing include ${src}:`, error);
				processedTemplate = processedTemplate.replace(fullMatch, `<!-- Error loading include ${src} -->`);
			}
		}

		return processedTemplate;
	}

	private processTemplate(template: string, data: any): string {
		// Process conditionals
		template = this.processConditionals(template, data);

		// Process loops
		template = this.processLoops(template, data);

		// Process properties
		template = this.processProps(template, data);

		return template;
	}

	private processConditionals(template: string, data: any): string {
		const ifRegex = /<if\s+condition=['"](.+?)['"]\s*>([\s\S]*?)<\/if>/g;
		return template.replace(ifRegex, (match, condition, content) => {
			try {
				// Create a function that evaluates the condition with the data context
				const conditionFn = new Function(...Object.keys(data), `return ${condition};`);
				const result = conditionFn(...Object.values(data));
				return result ? content : '';
			} catch (error) {
				console.error(`Error evaluating condition "${condition}":`, error);
				return `<!-- Error in condition: ${condition} -->`;
			}
		});
	}

	private processLoops(template: string, data: any): string {
		const forRegex = /<for\s+each=['"](.+?)['"]\s+as=['"](.+?)['"]\s*>([\s\S]*?)<\/for>/g;
		return template.replace(forRegex, (match, itemsExpr, itemVar, content) => {
			try {
				// Get the items to iterate over
				const itemsFn = new Function(...Object.keys(data), `return ${itemsExpr};`);
				const items = itemsFn(...Object.values(data));

				if (!Array.isArray(items)) {
					throw new Error(`Expression "${itemsExpr}" does not evaluate to an array`);
				}

				// Process each item
				return items.map(item => {
					// Create a new data context with the loop variable
					const loopData = { ...data, [itemVar]: item };
					// Process the content with the new context
					return this.processTemplate(content, loopData);
				}).join('');
			} catch (error) {
				console.error(`Error processing for loop "${itemsExpr} as ${itemVar}":`, error);
				return `<!-- Error in for loop: ${itemsExpr} as ${itemVar} -->`;
			}
		});
	}

	private processProps(template: string, data: any): string {
		const propRegex = /\{\{(.+?)\}\}/g;
		return template.replace(propRegex, (match, propExpr) => {
			try {
				const propFn = new Function(...Object.keys(data), `return ${propExpr};`);
				const value = propFn(...Object.values(data));
				return value !== undefined && value !== null ? String(value) : '';
			} catch (error) {
				console.error(`Error evaluating property "${propExpr}":`, error);
				return `<!-- Error in property: ${propExpr} -->`;
			}
		});
	}
}