export class TemplateEngine {
    private cache: Map<string, Function> = new Map();
    private components: Map<string, any> = new Map();

    constructor() { }

    registerComponent(name: string, component: any): void {
        this.components.set(name, component);
    }

    async render(template: string, data: any = {}): Promise<string> {
        template = await this.processIncludes(template);

        template = await this.processComponents(template, data);

        return this.processTemplate(template, data);
    }

    private async processIncludes(template: string): Promise<string> {
        const includeRegex = /<include\s+src=['"](.+?)['"]\s*(?:\s+with=['"](.+?)['"]\s*)?\/>/g;
        let match;
        let processedTemplate = template;

        while ((match = includeRegex.exec(template)) !== null) {
            const [fullMatch, src, withData] = match;
            try {
                const response = await fetch(src);
                if (!response.ok) throw new Error(`Failed to load include: ${src}`);

                let includeTemplate = await response.text();

                processedTemplate = processedTemplate.replace(fullMatch, includeTemplate);
            } catch (error) {
                console.error(`Error processing include ${src}:`, error);
                processedTemplate = processedTemplate.replace(fullMatch, `<!-- Error loading include ${src} -->`);
            }
        }

        return processedTemplate;
    }

    private async processComponents(template: string, data: any): Promise<string> {
        const componentRegex = /<([A-Z][a-zA-Z0-9]*)\s*([^>]*)(?:>([\s\S]*?)<\/\1>|\/?>)/g;
        let match;
        let processedTemplate = template;
        let offset = 0;

        while ((match = componentRegex.exec(processedTemplate)) !== null) {
            const [fullMatch, componentName, propsString, children] = match;

            if (!this.components.has(componentName)) {
                console.warn(`Component "${componentName}" is not registered.`);
                continue;
            }

            const props: Record<string, any> = this.parseProps(propsString, data);

            const ComponentClass = this.components.get(componentName);
            const componentInstance = new ComponentClass(new URLSearchParams());

            Object.assign(componentInstance, { props });

            let componentHTML = await componentInstance.getHtml();

            if (children) {
                componentHTML = componentHTML.replace('<%%%>', children);
            }

            const startPos = match.index + offset;
            const endPos = startPos + fullMatch.length;
            processedTemplate = processedTemplate.substring(0, startPos) +
                componentHTML +
                processedTemplate.substring(endPos);

            offset += componentHTML.length - fullMatch.length;

            componentRegex.lastIndex = startPos + componentHTML.length;
        }

        return processedTemplate;
    }

    private parseProps(propsString: string, data: any): Record<string, any> {
        const props: Record<string, any> = {};

        const propRegex = /\s*(?::|@)?([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|({[^}]*})))?/g;
        let propMatch;

        while ((propMatch = propRegex.exec(propsString)) !== null) {
            const [, propName, doubleQuotedValue, singleQuotedValue, expressionValue] = propMatch;

            if (propName) {
                if (expressionValue) {
                    try {
                        const expr = expressionValue.slice(1, -1);
                        const evalFn = new Function(...Object.keys(data), `return ${expr};`);
                        props[propName] = evalFn(...Object.values(data));
                    } catch (error) {
                        console.error(`Error evaluating prop expression "${expressionValue}":`, error);
                        props[propName] = undefined;
                    }
                } else {
                    props[propName] = doubleQuotedValue || singleQuotedValue || true;
                }
            }
        }

        return props;
    }

    private processTemplate(template: string, data: any): string {
        template = this.processConditionals(template, data);

        template = this.processLoops(template, data);

        template = this.processProps(template, data);

        return template;
    }

    private processConditionals(template: string, data: any): string {
        const ifRegex = /<if\s+condition=['"](.+?)['"]\s*>([\s\S]*?)<\/if>/g;
        return template.replace(ifRegex, (match, condition, content) => {
            try {
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
                const itemsFn = new Function(...Object.keys(data), `return ${itemsExpr};`);
                const items = itemsFn(...Object.values(data));

                if (!Array.isArray(items)) {
                    throw new Error(`Expression "${itemsExpr}" does not evaluate to an array`);
                }

                return items.map(item => {
                    const loopData = { ...data, [itemVar]: item };
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
