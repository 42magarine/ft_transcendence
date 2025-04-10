import AbstractView from '../../utils/AbstractView.js';

export default class UserManagement extends AbstractView {
    constructor(params: URLSearchParams = new URLSearchParams()) {
        super(params);
        this.setTitle('Transcendence - Home');
    }

    async getHtml() {
        return this.render(`
            <h1>ft_transcendence - User Management</h1>
        `, {});
    }
}
