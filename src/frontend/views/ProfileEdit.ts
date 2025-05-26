import Title from '../components/Title.js';
import Card from '../components/Card.js';
import Button from '../components/Button.js';
import AbstractView from '../../utils/AbstractView.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import UserService from '../services/UserService.js';

export default class ProfileEdit extends AbstractView {
    private userId: string;

    constructor(params: URLSearchParams) {
        super();
        this.userId = params.get('id') || 'unknown';
    }

    async getHtml(): Promise<string> {
        let userData = null;

        try {
            const userResponse = await fetch(`/api/users/${this.userId}`);
            if (userResponse.ok) {
                userData = await userResponse.json();
            } else {
                console.error('Failed to fetch user data from API');
            }
        } catch (error) {
            console.error('API request error:', error);
        }

        const title = new Title({
            title: userData ? `Edit Profile: ${userData.displayname}` : 'Edit Profile',
        });
        const titleSection = await title.getHtml();

        const card = new Card();
        let profileImageSvg = '';
        let cardBody = '';

        if (userData) {
            profileImageSvg = generateProfileImage(userData, 200, 200);

            cardBody = `
				<div class="profile-header">
					<div class="profile-avatar-container">${profileImageSvg}</div>
				</div>
				<div class="profile-details space-y-4">
					<div class="detail-row">
						<label class="label">Display Name:</label>
						<input class="input" type="text" name="displayname" value="${userData.displayname}" />
					</div>
					<div class="detail-row">
						<label class="label">Username:</label>
						<input class="input" type="text" name="username" value="${userData.username}" />
					</div>
					<div class="detail-row">
						<label class="label">Email:</label>
						<span class="value">${userData.email}</span>
					</div>
                    <div class="detail-row">
                        <label class="label">Email Verified:</label>
                        <select class="input" name="emailVerified">
                            <option value="true" ${userData.emailVerified ? 'selected' : ''}>Yes</option>
                            <option value="false" ${!userData.emailVerified ? 'selected' : ''}>No</option>
                        </select>
                    </div>
                                        <div class="detail-row">
						<label class="label">2FA:</label>
						<span class="value">${userData.twoFAEnabled}</span>
					</div>
					<div class="detail-row">
						<label class="label">New Password:</label>
						<input class="input" type="password" name="password" placeholder="Leave blank to keep current password" />
					</div>
                    <div class="detail-row" id="confirm-password-row" style="display: none;">
                        <label class="label">Confirm Password:</label>
                        <input class="input" type="password" name="confirmPassword" placeholder="Repeat new password" />
                    </div>
				</div>
			`;
        } else {
            cardBody = `<div class="alert alert-warning">User not found or error loading user data.</div>`;
        }

        const cardHtml = await card.renderCard({
            title: 'User Profile',
            body: `<form id="edit-profile-form">${cardBody}
				<div class="text-center mt-6">
					<button type="submit" class="btn btn-success">Update Profile</button>
					<button id="delete-user-btn" type="button" class="btn btn-danger">Delete Profile</button>
				</div>
			</form>`
        });

        const button = new Button();
        const buttonGroup = await button.renderGroup({
            layout: 'stack',
            align: 'center',
            buttons: [
                {
                    id: 'back-to-list',
                    text: 'Back to User List',
                    href: '/user-mangement',
                    className: 'btn btn-primary'
                }
            ]
        });

        return this.render(`
			<div class="container">
				${titleSection}
				${cardHtml}
				${buttonGroup}
			</div>
		`);
    }

    async mount(): Promise<void> {
        const form = document.getElementById('edit-profile-form') as HTMLFormElement | null;
        if (form) {
            // Toggle confirmPassword visibility based on password input
            const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement;
            const confirmRow = document.getElementById('confirm-password-row');

            if (passwordInput && confirmRow) {
                passwordInput.addEventListener('input', () => {
                    if (passwordInput.value.trim().length > 0) {
                        confirmRow.style.display = 'block';
                    } else {
                        confirmRow.style.display = 'none';
                        const confirmInput = confirmRow.querySelector('input[name="confirmPassword"]') as HTMLInputElement;
                        if (confirmInput) confirmInput.value = ''; // clear the field
                    }
                });
            }

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const payload: any = Object.fromEntries(formData.entries());

                const password = payload.password as string;
                const confirmPassword = payload.confirmPassword as string;
                payload.emailVerified = (formData.get('emailVerified') === 'true');
                if (password) {
                    if (password !== confirmPassword) {
                        //alert"Passwords do not match.");
                        return;
                    }
                    // Include both in payload
                    payload.password = password;
                    payload.confirmPassword = confirmPassword;
                }
                else {
                    // Remove both if empty
                    delete payload.password;
                    delete payload.confirmPassword;
                }

                try {
                    const success = await UserService.updateUser(this.userId, payload);
                    if (success) {
                        //alert'Profile updated successfully.');
                        window.location.href = `/users/${this.userId}`;
                    }
                    else {
                        //alert'Failed to update profile.');
                    }
                }
                catch (error) {
                    console.error('Update failed:', error);
                    //alert'An error occurred while updating.');
                }
            });

            const deleteButton = document.getElementById('delete-user-btn');
            if (deleteButton) {
                deleteButton.addEventListener('click', async () => {
                    const confirmed = confirm('Are you sure you want to delete this user? This action cannot be undone.');
                    if (!confirmed)
                        return;

                    try {
                        const success = await UserService.deleteUser(Number(this.userId));
                        if (success) {
                            alert('User deleted successfully.');
                            window.location.href = '/user-mangement';
                        }
                    }
                    catch (error) {
                        console.error('Delete failed:', error);
                    }
                });
            }

        }
        else {
            console.warn("Edit profile form not found");
        }
    }
}
