import { TemplateEngine } from "./TemplateEngine.js"

export default abstract class AbstractView {
    protected params: URLSearchParams;
    protected routeParams: Record<string, string>
    protected title?: string;
    protected description: string;
    protected templateEngine: TemplateEngine;
    protected props: Record<string, any>;
    public initEvents: (() => void) | null = null;
    public destroyEvents: (() => void) | null = null;
    public mount?(): void | Promise<void>;

    constructor(routeParams: Record<string, string> = {}, queryParams: URLSearchParams = new URLSearchParams(window.location.search)) {
        this.routeParams = routeParams;
        this.params = queryParams;
        this.props = {
            ...Object.fromEntries(queryParams.entries()),
            ...routeParams
        };

        this.title = 'Transcendence';
        this.description = '';
        this.templateEngine = new TemplateEngine();

        this.setTitle(this.title);
        this.setDescription(this.description);
    }

    setTitle(title: string): void {
        document.title = title;
        const metaTitle = document.querySelector('meta[name="title"]');
        if (metaTitle) {
            metaTitle.setAttribute('content', title);
        }
    }

    setDescription(description: string): void {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', description);
        }
        else if (description) {
            const meta = document.createElement('meta');
            meta.name = 'description';
            meta.content = description;
            document.head.appendChild(meta);
        }
    }

    async render(template: string, data: any = {}): Promise<string> {
        const mergedData = { ...data, props: this.props };
        return this.templateEngine.render(template, mergedData);
    }

    renderWithProps(props: Record<string, any> = {}): Promise<string> {
        this.props = props;
        return this.getHtml();
    }

    abstract getHtml(): Promise<string>;

    async afterRender(): Promise<void> { }

    destroy(): void { }
}
