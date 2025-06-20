export default function renderGoogleSignInButton(align = 'center') {
    return `
        <div class="${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}">
            <div id="g_id_onload"
                data-client_id="671485849622-fgg1js34vhtv9tsrifg717hti161gvum.apps.googleusercontent.com"
                data-callback="handleGoogleLogin"
                data-auto_prompt="false">
            </div>
            <div class="g_id_signin"
                data-type="standard"
                data-size="medium"
                data-theme="filled_blue"
                data-text="signin_with"
                data-shape="rectangular"
                data-logo_alignment="left">
            </div>
        </div>
    `;
}
