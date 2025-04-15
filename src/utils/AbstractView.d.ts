import { TemplateEngine } from "./TemplateEngine.js";
export default abstract class AbstractView {
    protected params: URLSearchParams;
    protected title: string;
    protected description: string;
    protected templateEngine: TemplateEngine;
    protected props: Record<string, any>;
    constructor(params?: URLSearchParams);
    setTitle(title: string): void;
    setDescription(description: string): void;
    render(template: string, data?: any): Promise<string>;
    renderWithProps(props?: Record<string, any>): Promise<string>;
    getTheme(): string;
    abstract getHtml(): Promise<string>;
    afterRender(): Promise<void>;
    destroy(): void;
}
