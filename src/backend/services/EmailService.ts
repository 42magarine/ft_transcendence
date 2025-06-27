import nodemailer from 'nodemailer';
import crypto from 'crypto';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html: string;
}

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        // Create transporter using environment variables
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT || '587'),
            secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    // Generate a random token for verification or password reset
    generateToken(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    // Send email using the configured transporter
    async sendEmail(options: EmailOptions): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: `"Transcendence App" <${process.env.EMAIL_USER}>`,
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            });
        }
        catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }

    // Send verification email for new account
    async sendVerificationEmail(email: string, token: string, username: string): Promise<void> {
        var baseUrl = process.env.NGROK_URL || 'http://localhost:3000';
        if (baseUrl && !baseUrl.startsWith('http')) {
            baseUrl = `https://${baseUrl}`;
        }
        const verificationLink = `${baseUrl}/api/verify-email/${token}`;


        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a1a2f; color: white; padding: 20px; border-radius: 8px;">
                <h2 style="color: white; text-align: center; margin-bottom: 30px;">Welcome to Transcendence!</h2>
                <p>Hello ${username},</p>
                <p>Please verify your account by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #155dfc; color: white; padding: 15px 25px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Account</a>
                </div>
                <p>If you did not request this, please ignore this email.</p>
                <p style="margin-top: 30px; border-top: 1px solid #2a3a4f; padding-top: 15px;">Thank you,<br>The Transcendence Team</p>
            </div>
        `;


        await this.sendEmail({
            to: email,
            subject: 'Verify Your Transcendence Account',
            text: `Hello ${username},\n\nPlease verify your account by clicking the link: ${verificationLink}\n\nIf you did not request this, please ignore this email.\n`,
            html: htmlContent
        });

        console.log('✅ Email sent successfully');
    }

    // Send password reset email
    async sendPasswordResetEmail(email: string, token: string, username: string): Promise<void> {
        var baseUrl = process.env.NGROK_URL || 'http://localhost:3000';

        if (baseUrl && !baseUrl.startsWith('http')) {
            baseUrl = `https://${baseUrl}`;
        }
        // Changed to use frontend route instead of API endpoint
        const resetLink = `${baseUrl}/password-reset/${token}`;

        await this.sendEmail({
            to: email,
            subject: 'Password Reset for Transcendence',
            text: `Hello ${username},\n\nYou requested a password reset. Please click the following link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a1a2f; color: white; padding: 20px; border-radius: 8px;">
                    <h2 style="color: white; text-align: center; margin-bottom: 30px;">Password Reset Request</h2>
                    <p>Hello ${username},</p>
                    <p>You requested a password reset. Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #155dfc; color: white; padding: 15px 25px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
                    </div>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you did not request this, please ignore this email.</p>
                    <p style="margin-top: 30px; border-top: 1px solid #2a3a4f; padding-top: 15px;">Thank you,<br>The Transcendence Team</p>
                </div>
            `
        });
    }
}
