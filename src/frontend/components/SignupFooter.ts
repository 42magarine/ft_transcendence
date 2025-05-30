// File: components/SignupFooter.js
export default function renderSignupFooter()
{
    return `
        <p>Already have an account? <a router href="/login">log in</a></p>
        <div class="flex justify-center pt-2">
            <button id="google-signup" class="btn btn-google">Sign up with Google</button>
        </div>`;
}