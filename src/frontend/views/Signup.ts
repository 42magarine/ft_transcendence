import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Modal from '../components/Modal.js';
import __ from '../services/LanguageService.js';
import Router from '../../utils/Router.js';
import { generateTextVisualization } from '../../utils/Avatar.js';
import { User } from '../../interfaces/userManagementInterfaces.js';

export default class Signup extends AbstractView {
	constructor() {
		super();
	}

	async getHtml(): Promise<string> {
		const signupCard = await new Card().renderCard({
			title: __('Signup'),
			formId: 'signup-form',
			prefix: '<div class="signup-avatar flex justify-center mb-4"></div>',
			contentBlocks: [
				{
					type: 'inputgroup',
					props: {
						inputs: [
							{ name: 'avatar', type: 'file', placeholder: __('Avatar') },
							{ name: 'name', type: 'text', placeholder: __('Name') },
							{ name: 'username', type: 'text', placeholder: __('Username') },
							{ name: 'email', type: 'email', placeholder: __('E-Mail') },
							{ name: 'password', type: 'password', placeholder: __('Password'), withConfirm: true }
						]
					}
				},
				{
					type: 'input',
					props: {
						name: 'enableTwoFactor',
						type: 'checkbox',
						placeholder: __('Enable 2FA (Requires Mobile App)')
					}
				},
				{
					type: 'twofactor',
					props: {}
				},
				{
					type: 'buttongroup',
					props: {
						layout: 'stack',
						align: 'center',
						buttons: [
							{
								text: __('Sign up'),
								type: 'submit',
								className: 'btn btn-primary'
							},
							{
								id: 'login-redirect',
								type: 'text-with-button',
								text: __('Login'),
								textBefore: __('Already have an account?'),
								href: '/login',
								align: 'center'
							}
						]
					}
				}
			]
		});

		return this.render(signupCard);
	}

	async mount(): Promise<void> {
		this.setupSignupForm();
	}

	private setupSignupForm(): void {
		try {
			const form = document.getElementById('signup-form') as HTMLFormElement | null;
			if (!form) throw new Error('Signup form element not found.');

			const enableTwoFactor = form.querySelector("input[name=enableTwoFactor]") as HTMLInputElement | null;
			const twoFactorInterface = document.getElementById("twoFactorInterface");
			const qrDisplay = document.getElementById("qr-display");
			const secHidden = form.querySelector("input[type=hidden][name=secret]") as HTMLInputElement | null;

			// 2FA QR logic
			if (enableTwoFactor && twoFactorInterface && qrDisplay && secHidden) {
				enableTwoFactor.addEventListener("change", async (e: Event) => {
					const checkbox = e.target as HTMLInputElement;
					if (checkbox.checked) {
						console.log('[2FA] classes before:', twoFactorInterface.className);
						twoFactorInterface.classList.remove('hidden');
						twoFactorInterface.style.display = 'block';
						console.log('[2FA] classes after:', twoFactorInterface.className);

						try {
							const response = await fetch('/api/generate-qr');
							if (!response.ok) throw new Error(`QR API error: ${response.status}`);

							const qr_response = await response.json();
							qrDisplay.innerHTML = `<img src="${qr_response.qr}" />`;
							secHidden.value = qr_response.secret;
						} catch (err) {
							console.error('[2FA] Failed to fetch QR:', err);
						}
					} else {
						twoFactorInterface.classList.add('hidden');
						twoFactorInterface.style.display = 'none';
						qrDisplay.innerHTML = '';
						secHidden.value = '';
					}
				});
			}

			const usernameInput = form.querySelector('input[name="username"]') as HTMLInputElement;
			const avatarInput = form.querySelector('input[name="avatar"]') as HTMLInputElement;
			const signupAvatar = form.querySelector('.signup-avatar');

			if (!signupAvatar) throw new Error('Signup avatar container not found.');

			if (usernameInput && !avatarInput?.files?.length) {
				signupAvatar.innerHTML = generateTextVisualization(usernameInput.value || '', {
					width: 100,
					height: 100,
					useShapes: true,
					maxShapes: 50,
					showText: false,
					backgroundColor: '#f0f0f0'
				});
			}

			if (usernameInput && avatarInput) {
				usernameInput.addEventListener('input', () => {
					if (!avatarInput.value) {
						const seedSvg = generateTextVisualization(usernameInput.value, {
							width: 100,
							height: 100,
							useShapes: true,
							maxShapes: 50,
							showText: false,
							backgroundColor: '#f0f0f0'
						});
						signupAvatar.innerHTML = seedSvg;
					}
				});
			}

			if (avatarInput) {
				avatarInput.setAttribute('accept', 'image/jpeg, image/png');

				avatarInput.addEventListener('change', async function () {
					const file = avatarInput.files?.[0];
					if (!file) return;

					if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
						await new Modal().renderInfoModal({
							id: 'invalid-file-type',
							title: __('Invalid File Type'),
							message: __('Only JPG or PNG images are allowed.')
						});
						avatarInput.value = '';
						return;
					}

					if (file.size > 2 * 1024 * 1024) {
						await new Modal().renderInfoModal({
							id: 'file-too-large',
							title: __('File Too Large'),
							message: __('Avatar must be under 2MB.')
						});
						avatarInput.value = '';
						return;
					}

					const reader = new FileReader();
					reader.onload = function (e) {
						if (e.target) {
							const img = document.createElement('img');
							img.src = e.target.result as string;
							img.style.width = '100px';
							img.style.height = '100px';
							img.style.borderRadius = '50%';
							img.style.objectFit = 'cover';
							signupAvatar.innerHTML = '';
							signupAvatar.appendChild(img);
						}
					};
					reader.readAsDataURL(file);
				});
			}

			form.addEventListener('submit', async (e: Event) => {
				e.preventDefault();

				const formData = new FormData(form);
				const password = formData.get('password') as string;

				// 2FA validation check
				const twoFactorCheckbox = form.querySelector('input[name="enableTwoFactor"]') as HTMLInputElement;
				if (twoFactorCheckbox?.checked) {
					const tfFields = ['tf_1', 'tf_2', 'tf_3', 'tf_4', 'tf_5', 'tf_6'];
					const missing = tfFields.some(name => {
						const val = formData.get(name) as string;
						return !val || val.trim() === '';
					});

					if (missing) {
						console.log('modallllll!');
						await new Modal().renderInfoModal({
							id: 'incomplete-2fa',
							title: __('Missing Code'),
							message: __('Please enter all 6 digits of your 2FA code.')
						});
						return;
					}
				}

				const userData: User = {
					name: formData.get('name') as string || '',
					username: formData.get('username') as string || '',
					email: formData.get('email') as string || '',
					password: password,
					role: 'user',
					tf_one: formData.get('tf_1') as string || '',
					tf_two: formData.get('tf_2') as string || '',
					tf_three: formData.get('tf_3') as string || '',
					tf_four: formData.get('tf_4') as string || '',
					tf_five: formData.get('tf_5') as string || '',
					tf_six: formData.get('tf_6') as string || '',
					secret: formData.get('secret') as string || '',
					status: 'offline'
				};

				const avatarFile = formData.get('avatar') as File;

				try {
					let result;
					console.log(userData);
					if (avatarFile && avatarFile.size > 0) {
						result = await window.userManagementService.registerUser(userData, avatarFile);
					} else {
						result = await window.userManagementService.registerUser(userData);
					}
					form.reset();
					Router.update();
					if (result) Router.redirect('/login');
				} catch (error) {
					console.error('Signup failed:', error);
					await new Modal().renderInfoModal({
						id: 'signup-failed',
						title: __('Signup Failed'),
						message: __('Something went wrong while creating your account. Please try again.')
					});
				}
			});
		} catch (err) {
			console.error('Signup form setup error:', err);
			new Modal().renderInfoModal({
				id: 'signup-setup-error',
				title: __('Signup Error'),
				message: `${__('An unexpected error occurred while setting up the signup form.')}\n\n${(err as Error).message}`
			});
		}
	}
}
