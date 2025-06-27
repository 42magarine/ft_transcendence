import { generateTextVisualization } from "../../utils/Avatar.js";
import Router from '../../utils/Router.js';
import { User, ApiErrorResponse, LoginCredentials, AuthResponse } from "../../interfaces/userManagementInterfaces.js";
import Modal from "../components/Modal.js";

export default class UserManagementService {
    constructor() { }

    async registerUser(userData: User, avatarFile?: File): Promise<string> {
        try {
            let response: Response;
            let finalAvatar: File | undefined = avatarFile;

            // Convert SVG to PNG if necessary
            if (avatarFile?.type === 'image/svg+xml') {
                const svgText = await avatarFile.text();

                // Validate SVG content
                if (!svgText.trim().startsWith('<svg') && !svgText.includes('<svg')) {
                    throw new Error('Invalid SVG file format');
                }

                if (userData.name == "") {
                    throw new Error('Invalid Name');
                }
                // Parse SVG to get dimensions or set defaults
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
                const svgElement = svgDoc.querySelector('svg');

                // Check for parsing errors
                const parserError = svgDoc.querySelector('parsererror');
                if (parserError || !svgElement) {
                    console.error('SVG parsing error:', parserError?.textContent);
                    throw new Error('Invalid SVG content - unable to parse');
                }

                let width = 100;
                let height = 100;

                // Try to get dimensions from SVG attributes
                const widthAttr = svgElement.getAttribute('width');
                const heightAttr = svgElement.getAttribute('height');
                const viewBox = svgElement.getAttribute('viewBox');

                if (widthAttr && heightAttr) {
                    width = parseInt(widthAttr.replace(/px|pt|em|rem|%/, '')) || 100;
                    height = parseInt(heightAttr.replace(/px|pt|em|rem|%/, '')) || 100;
                } else if (viewBox) {
                    const viewBoxParts = viewBox.split(/[\s,]+/).map(Number);
                    if (viewBoxParts.length >= 4) {
                        width = viewBoxParts[2] || 100;
                        height = viewBoxParts[3] || 100;
                    }
                }

                // Ensure reasonable dimensions
                width = Math.min(Math.max(width, 32), 1024);
                height = Math.min(Math.max(height, 32), 1024);

                // Clean up SVG and ensure proper attributes
                svgElement.setAttribute('width', width.toString());
                svgElement.setAttribute('height', height.toString());
                svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

                // Remove potentially problematic elements
                const scripts = svgElement.querySelectorAll('script');
                scripts.forEach(script => script.remove());

                // Create a clean SVG string
                const serializer = new XMLSerializer();
                const cleanSvgString = serializer.serializeToString(svgElement);
                const svgDataUrl = `data:image/svg+xml;base64,${btoa(cleanSvgString)}`;

                finalAvatar = await new Promise<File>((resolve, reject) => {
                    const img = new Image();
                    const timeoutId = setTimeout(() => {
                        reject(new Error('SVG loading timeout - file may be too complex or corrupted'));
                    }, 10000); // 10 second timeout

                    img.onload = () => {
                        clearTimeout(timeoutId);
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');

                            if (ctx) {
                                // Set white background (optional - remove for transparent)
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(0, 0, width, height);

                                // Draw the SVG
                                ctx.drawImage(img, 0, 0, width, height);

                                canvas.toBlob((blob) => {
                                    if (blob) {
                                        const pngFile = new File([blob], avatarFile.name.replace(/\.svg$/, '.png'), {
                                            type: 'image/png'
                                        });
                                        resolve(pngFile);
                                    } else {
                                        reject(new Error('Failed to create PNG blob'));
                                    }
                                }, 'image/png', 0.95);
                            } else {
                                reject(new Error('Could not get canvas context'));
                            }
                        } catch (error) {
                            reject(new Error(`Canvas operation failed: ${error instanceof Error ? error.message : String(error)}`));
                        }
                    };

                    img.onerror = (error) => {
                        clearTimeout(timeoutId);
                        console.error('SVG load error:', error);
                        console.error('SVG content preview:', cleanSvgString.substring(0, 200));
                        reject(new Error('SVG file appears to be corrupted or contains unsupported elements'));
                    };

                    img.src = svgDataUrl;
                });
            }

            const isAvatarValid = finalAvatar &&
                finalAvatar.size > 0 &&
                ['image/jpeg', 'image/png'].includes(finalAvatar.type);

            if (isAvatarValid && finalAvatar) {

                const formData = new FormData();
                Object.entries(userData).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        formData.append(key, String(value));
                    }
                });
                formData.append('avatar', finalAvatar); // TypeScript knows finalAvatar is defined here

                response = await fetch('/api/users/register', {
                    method: 'POST',
                    body: formData
                });
            } else {
                response = await fetch('/api/users/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
            }

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Registration failed');
            }

            Router.update();
            return await response.text();
        } catch (error) {
            console.error('[registerUser] Error:', error);
            await new Modal().renderInfoModal({
                id: 'register-error',
                title: window.ls.__('Registration Failed'),
                message: `${window.ls.__('Could not register the user. Please check your input and try again.')}\n\n${(error as Error).message}`
            });
            throw error;
        }
    }


    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            // ✅ Lies den Response nur EINMAL
            const result = await response.json() as AuthResponse;

            // ✅ Überprüfe erst NACH dem Lesen
            if (!response.ok) {
                throw new Error(result.error || 'Login failed');
            }

            if (result.requireTwoFactor) {
                sessionStorage.setItem('pendingUserId', result.userId?.toString() || '');
                sessionStorage.setItem('pendingUsername', result.username || '');
                Router.redirect('/two-factor');
                return result;
            }

            Router.redirect('/');
            return result;
        } catch (error) {
            throw error;
        }
    }

    async loginWithGoogle(idToken: string) {
        try {
            const response = await fetch('/api/users/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: idToken })
            });

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Google login failed');
            }

            const result = await response.json() as AuthResponse;
            Router.redirect('/');
            return result;
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'google-login-error',
                title: window.ls.__('Google Login Failed'),
                message: `${window.ls.__('There was a problem logging in with Google.')}\n\n${(error as Error).message}`
            });
            throw error;
        }
    }

    async verifyTwoFactor(userId: number, code: string): Promise<AuthResponse> {
        try {
            const response = await fetch('/api/users/verify-two-factor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code })
            });

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Two-factor verification failed');
            }

            const result = await response.json() as AuthResponse;

            sessionStorage.removeItem('pendingUserId');
            sessionStorage.removeItem('pendingUsername');
            Router.update();
            Router.redirect('/');

            return result;
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'twofactor-error',
                title: window.ls.__('2FA Verification Failed'),
                message: `${window.ls.__('Invalid two-factor code.')}\n\n${(error as Error).message}`
            });
            throw error;
        }
    }

    async requestPasswordReset(email: string): Promise<AuthResponse> {
        try {
            const response = await fetch('/api/request-password-reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            return await response.json() as AuthResponse;
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'password-reset-request-error',
                title: window.ls.__('Reset Failed'),
                message: `${window.ls.__('Unable to request password reset.')}\n\n${(error as Error).message}`
            });
            throw error;
        }
    }

    async resetPassword(token: string, password: string, confirmPassword: string): Promise<AuthResponse> {
        try {
            const response = await fetch(`/api/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, confirmPassword })
            });

            if (!response.ok) {
                const errorData = await response.json() as ApiErrorResponse;
                throw new Error(errorData.error || 'Password reset failed');
            }

            return await response.json() as AuthResponse;
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'password-reset-error',
                title: window.ls.__('Reset Failed'),
                message: `${window.ls.__('Could not reset your password.')}\n\n${(error as Error).message}`
            });
            throw error;
        }
    }

    async resendVerificationEmail(email: string): Promise<AuthResponse> {
        try {
            const response = await fetch('/api/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            return await response.json() as AuthResponse;
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'resend-verification-error',
                title: window.ls.__('Verification Failed'),
                message: `${window.ls.__('Could not resend verification email.')}\n\n${(error as Error).message}`
            });
            throw error;
        }
    }

    async logout(): Promise<void> {
        try {
            const response = await fetch('/api/users/logout', {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            Router.redirect('/');
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'logout-error',
                title: window.ls.__('Logout Failed'),
                message: `${window.ls.__('An error occurred during logout.')}\n\n${(error as Error).message}`
            });
            throw error;
        }
    }

    async verifyPasswordResetToken(token: string): Promise<boolean> {
        try {
            const response = await fetch(`/api/reset-password/${token}`);
            const data = await response.json();

            if (!response.ok || !data.valid) {
                throw new Error(data.error || 'Invalid token');
            }

            return true;
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'token-verification-error',
                title: window.ls.__('Invalid Token'),
                message: `${window.ls.__('The password reset link is invalid or expired.')}\n\n${(error as Error).message}`
            });
            throw error;
        }
    }

    async verifyEmail(token: string): Promise<boolean> {
        try {
            const response = await fetch(`/api/verify-email/${token}`);

            if (response.ok) {
                return true;
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Email verification failed');
            }
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'email-verification-error',
                title: window.ls.__('Verification Failed'),
                message: `${window.ls.__('Could not verify your email.')}\n\n${(error as Error).message}`
            });
            throw error;
        }
    }

    async updateProfile(userId: string, payload: Record<string, any>): Promise<boolean> {
        try {
            const response = await fetch(`/api/user/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            return response.ok;
        } catch (error) {
            await new Modal().renderInfoModal({
                id: 'profile-update-error',
                title: window.ls.__('Profile Update Failed'),
                message: `${window.ls.__('Could not update the profile.')}\n\n${(error as Error).message}`
            });
            throw error;
        }
    }
}