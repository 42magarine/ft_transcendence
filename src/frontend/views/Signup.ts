import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Modal from '../components/Modal.js';
import __ from '../services/LanguageService.js';
import UserService from '../services/UserService.js';
import UserManagementService from '../services/UserManagementService.js';
import Router from '../../utils/Router.js';
import { generateTextVisualization } from '../../utils/Avatar.js';
import { User } from '../../interfaces/userManagementInterfaces.js';

export default class Signup extends AbstractView
{
	constructor()
	{
		super();
	}

	async getHtml(): Promise<string>
	{
		const signupCard = await new Card().renderCard(
		{
			title: __('Signup'),
			formId: 'signup-form',
			prefix: '<div class="signup-avatar"></div>',
			contentBlocks:
			[
				{
					type: 'inputgroup',
					props:
					{
						inputs: [
							{ name: 'avatar', type: 'file', placeholder: __('Avatar') },
							{ name: 'name', type: 'text', placeholder: __('Name') },
							{ name: 'username', type: 'text', placeholder: __('Username') },
							{ name: 'email', type: 'email', placeholder: __('E-Mail') },
							{ name: 'password', type: 'password', placeholder: __('Password'), withConfirm: true },
                            { name: 'repeat-password', type: 'password', placeholder: __('Repeat Password') }, 
							{ name: 'enableTwoFactor', type: 'checkbox', placeholder: __('Enable 2FA (Requires Mobile App)') }
						]
					}
				},
				{
					type: 'twofactor',
					props: {}
				},
				{
					type: 'buttongroup',
					props:
					{
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

	async mount(): Promise<void>
	{
		this.setupSignupForm();
	}

	setupSignupForm(): void
{
	try
	{
		const form = document.getElementById('signup-form') as HTMLFormElement | null;
		if (!form)
			throw new Error('Signup form element not found.');

		const usernameInput = form.querySelector('input[name="username"]') as HTMLInputElement;
		const avatarInput = form.querySelector('input[name="avatar"]') as HTMLInputElement;
		const signupAvatar = form.querySelector('.signup-avatar');

		if (!signupAvatar)
			throw new Error('Signup avatar container not found.');

		if (usernameInput && avatarInput)
		{
			usernameInput.addEventListener('keyup', (e) =>
			{
				if ((avatarInput.value === '' || avatarInput.value == null) && e.target)
				{
					const seed = (e.target as HTMLInputElement).value;
					const seedSvg = generateTextVisualization(seed, {
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

		if (avatarInput)
		{
			avatarInput.addEventListener('change', function ()
			{
				const file = avatarInput.files?.[0];
				if (!file) return;

				if (!file.type.match('image/jpeg') && !file.type.match('image/png'))
				{
					avatarInput.value = '';
					return;
				}

				if (file.size > 2 * 1024 * 1024)
				{
					avatarInput.value = '';
					return;
				}

				const reader = new FileReader();
				reader.onload = function (e)
				{
					if (e.target)
					{
						const img = document.createElement('img');
						img.src = e.target.result as string;
						signupAvatar.innerHTML = '';
						signupAvatar.appendChild(img);
					}
				};
				reader.readAsDataURL(file);
			});
		}

		form.addEventListener('submit', async (e) =>
		{
			e.preventDefault();

			const formData = new FormData(form);
			const password = formData.get('password') as string;
			const repeatPassword = formData.get('repeat-password') as string;

			if (password !== repeatPassword)
			{
				await new Modal().renderInfoModal({
					id: 'modal-password-mismatch',
					title: __('Passwords do not match'),
					message: __('Please ensure both password fields match.')
				});
				return;
			}

			const userData: User = {
				name: formData.get('name') as string || '',
				username: formData.get('username') as string || '',
				email: formData.get('email') as string || '',
				password: password,
				role: 'user',
				tf_one: formData.get('tf_one') as string || '',
				tf_two: formData.get('tf_two') as string || '',
				tf_three: formData.get('tf_three') as string || '',
				tf_four: formData.get('tf_four') as string || '',
				tf_five: formData.get('tf_five') as string || '',
				tf_six: formData.get('tf_six') as string || '',
				secret: formData.get('secret') as string || '',
				status: 'offline'
			};

			const avatarFile = formData.get('avatar') as File;

			try
			{
				let result;
				if (avatarFile && avatarFile.size > 0)
				{
					result = await window.userManagementService.registerUser(userData, avatarFile);
				}
				else
				{
					result = await window.userManagementService.registerUser(userData);
				}

				form.reset();
				Router.redirect('/');
			}
			catch (error)
			{
				console.error('Signup failed:', error);
			}
		});
	}
	catch (err)
	{
		console.error('Signup form setup error:', err);
		new Modal().renderInfoModal({
			id: 'signup-setup-error',
			title: __('Signup Error'),
			message: `${__('An unexpected error occurred while setting up the signup form.')}\n\n${(err as Error).message}`
		});
	}
}
}
