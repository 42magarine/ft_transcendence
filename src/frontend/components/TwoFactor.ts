export default async function renderTwoFactor() {
    const Input = (await import('./Input.js')).default;
    const tfInputs = await new Input().renderNumericGroup(6, 'tf');

    return `
		<div id="twoFactorInterface" class="hidden">
			<div id="qr-display" class="mb-4"></div>
			<input type="hidden" id="secret" name="secret" />
			${tfInputs}
		</div>
	`;
}
