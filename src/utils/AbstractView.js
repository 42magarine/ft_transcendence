import { TemplateEngine } from "./TemplateEngine.js";
export default class AbstractView {
    params;
    title;
    description;
    templateEngine;
    props;
    constructor(params = new URLSearchParams(window.location.search)) {
        this.params = params;
        this.title = 'Transcendence';
        this.description = '';
        this.templateEngine = new TemplateEngine();
        this.props = {};
        this.setTitle(this.title);
        this.setDescription(this.description);
    }
    setTitle(title) {
        document.title = title;
        const metaTitle = document.querySelector('meta[name="title"]');
        if (metaTitle) {
            metaTitle.setAttribute('content', title);
        }
    }
    setDescription(description) {
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
    async render(template, data = {}) {
        const mergedData = { ...data, props: this.props };
        return this.templateEngine.render(template, mergedData);
    }
    renderWithProps(props = {}) {
        this.props = props;
        return this.getHtml();
    }
    getTheme() {
        return 'default';
    }
    async afterRender() { }
    destroy() { }
}
