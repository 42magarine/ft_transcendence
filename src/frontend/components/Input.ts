// ========================
// File: components/Input.ts
// ========================

import AbstractView from '../../utils/AbstractView.js';
import { themedInput } from '../theme/themeHelpers.js';

interface InputProps {
  name: string;
  type?: string;
  placeholder?: string;
  value?: string;
  className?: string; // optional override
}

export default class Input extends AbstractView {
  constructor(params: URLSearchParams = new URLSearchParams()) {
    super(params);
  }

  async renderInput({
    name,
    type = 'text',
    placeholder = '',
    value = '',
    className = ''
  }: InputProps): Promise<string> {
    const theme = this.props?.theme || 'default';
    const finalClass = className || themedInput(theme);

    return this.render(`
      <input
        type="${type}"
        name="${name}"
        placeholder="${placeholder}"
        value="${value}"
        class="${finalClass}"
        required
      />
    `);
  }

  async getHtml(): Promise<string> {
    const theme = this.props?.theme || 'default';
    const finalClass = themedInput(theme);

    return this.render(`<input class="${finalClass}" placeholder="Default Input" />`);
  }
}
