export default function checkEnvVars() {
    const requiredVars: string[] = [
        'COOKIE_SECRET',
        'ACCESS_TOKEN_SECRET',
        'REFRESH_TOKEN_SECRET',
        'EMAIL_HOST',
        'EMAIL_PORT',
        'EMAIL_SERVICE',
        'EMAIL_USER',
        'EMAIL_PASSWORD',
        'MASTER_USER_EMAIL',
        'MASTER_USER_PASSWORD',
        'GOOGLE_CLIENT_ID',
        'NGROK_AUTHTOKEN',
        'NGROK_URL'
    ];

    const missingVars: string[] = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
        console.error("Please check your .env file and make sure it is being loaded correctly.");
        process.exit(1);
    }
    else {
        console.log("All required environment variables are loaded.");
    }
}
