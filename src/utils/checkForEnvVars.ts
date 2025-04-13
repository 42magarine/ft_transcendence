export default function checkEnvironmentVariables() {
    const requiredVars = ['JWT_SECRET', 'COOKIE_SECRET', 'REFRESH_TOKEN_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
        console.error('Please check your .env file and make sure it is being loaded correctly.');
        process.exit(1);
    }
    else {
        console.log('All required environment variables are loaded.');
    }
}
