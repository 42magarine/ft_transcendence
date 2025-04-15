export declare class TemplateEngine {
    private cache;
    private components;
    constructor();
    registerComponent(name: string, component: any): void;
    render(template: string, data?: any): Promise<string>;
    private processIncludes;
    private processComponents;
    private parseProps;
    private processTemplate;
    private processConditionals;
    private processLoops;
    private processProps;
}
