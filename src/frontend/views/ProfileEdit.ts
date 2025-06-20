import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';
import Modal from '../components/Modal.js';
import __ from '../services/LanguageService.js';
import Router from '../../utils/Router.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import UserService from '../services/UserService.js';

export default class ProfileEdit extends AbstractView {
    private userId: string;
    private originalName: string = '';

    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
        this.userId = routeParams['id'];
    }

    async getHtml(): Promise<string> {
        const userIdNum = Number(this.userId);
        const userData = isNaN(userIdNum) ? null : await UserService.getUserById(userIdNum);
        const currentUser = await UserService.getCurrentUser();
        const isMaster = currentUser!.role === 'master';

        if (!userData) {
            const errorCard = await new Card().renderCard({
                contentBlocks: [
                    {
                        type: 'container',
                        props: {
                            className: 'alert alert-warning text-center',
                            html: window.ls.__('User not found or error loading user data.')
                        }
                    }
                ]
            });
            return this.render(errorCard);
        }

        this.originalName = userData.name ?? '';

        const profileEditCard = await new Card().renderCard({
            formId: 'edit-profile-form',
            title: `${window.ls.__('Edit Profile')}: ${userData.username}`,
            contentBlocks: [
                {
                    type: 'avatar',
                    props: {
                        src: generateProfileImage(userData, 200, 200),
                        size: 200,
                        className: 'mb-4'
                    }
                },
                {
                    type: 'inputgroup',
                    props: {
                        inputs: [
                            { name: 'avatar', type: 'file', placeholder: window.ls.__('Avatar') },
                            { name: 'email', placeholder: window.ls.__('Email'), value: userData.email, type: 'display' },
                            { name: 'username', placeholder: window.ls.__('Username'), value: userData.username, type: 'display' },
                            { name: 'name', placeholder: window.ls.__('Name'), value: userData.name, type: isMaster ? 'display' : 'text' },
                            { name: 'password', type: 'password', placeholder: window.ls.__('Password'), withConfirm: true }
                        ]
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        layout: 'group',
                        align: 'center',
                        buttons: [
                            {
                                id: 'submit-profile',
                                text: window.ls.__('Update Profile'),
                                type: 'submit',
                                className: 'btn btn-green'
                            },
                            {
                                id: 'delete-user-btn',
                                text: window.ls.__('Delete Profile'),
                                type: 'button',
                                className: 'btn btn-red'
                            }
                        ]
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        layout: 'stack',
                        align: 'center',
                        buttons: [
                            {
                                id: 'back-to-list',
                                text: isMaster ? window.ls.__('Back to User List') : window.ls.__('Back to Profile'),
                                href: isMaster ? '/user-mangement' : `/users/${userData.id}`,
                            }
                        ]
                    }
                }
            ]
        });
        return this.render(`${profileEditCard}`);
    }

    async mount(): Promise<void> {
        const form = document.getElementById('edit-profile-form') as HTMLFormElement | null;
        if (!form) return;

        const avatarInput = form.querySelector('input[name="avatar"]') as HTMLInputElement;
        const signupAvatar = form.querySelector('.signup-avatar');
        let avatarRemoved = false;
        let originalAvatarPresent = true;

        if (avatarInput && signupAvatar) {
            avatarInput.setAttribute('accept', 'image/jpeg, image/png');

            avatarInput.addEventListener('change', async function () {
                const file = avatarInput.files?.[0];
                if (!file) {
                    avatarRemoved = true;
                    signupAvatar.innerHTML = '';
                    return;
                }

                avatarRemoved = false;

                if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
                    await new Modal().renderInfoModal({
                        id: 'invalid-file-type',
                        title: window.ls.__('Invalid File Type'),
                        message: window.ls.__('Only JPG or PNG images are allowed.')
                    });
                    avatarInput.value = '';
                    return;
                }

                if (file.size > 2 * 1024 * 1024) {
                    await new Modal().renderInfoModal({
                        id: 'file-too-large',
                        title: window.ls.__('File Too Large'),
                        message: window.ls.__('Avatar must be under 2MB.')
                    });
                    avatarInput.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (e) {
                    if (e.target) {
                        const img = document.createElement('img');
                        img.src = e.target.result as string;
                        img.setAttribute('alt', window.ls.__('Avatar of new User'));
                        img.style.borderRadius = '50%';
                        img.style.objectFit = 'cover';
                        signupAvatar.innerHTML = '';
                        signupAvatar.appendChild(img);
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const password = formData.get('password')?.toString().trim() || '';
            const confirmPassword = formData.get('passwordConfirm')?.toString().trim() || '';

            if (password !== confirmPassword || (!password && confirmPassword) || (password && !confirmPassword)) {
                await new Modal().renderInfoModal({
                    id: 'password-mismatch-modal',
                    title: window.ls.__('Validation Error'),
                    message: window.ls.__('Passwords do not match.')
                });
                return;
            }

            if (!password && !confirmPassword) {
                formData.delete('password');
            }

            formData.delete('passwordConfirm');

            const avatarFile = avatarInput?.files?.[0];

            const name = formData.get('name')?.toString().trim() || '';
            if (name === this.originalName) {
                formData.delete('name');
            }

            if (originalAvatarPresent && avatarRemoved && (!avatarFile || avatarFile.size === 0)) {
                await new Modal().renderInfoModal({
                    id: 'avatar-required-modal',
                    title: window.ls.__('Avatar Required'),
                    message: window.ls.__('You removed the original avatar. Please upload a new one before saving.')
                });
                return;
            }

            if ([...formData.entries()].length === 0) {
                return;
            }

            try {
                const success = await UserService.updateUser(this.userId, formData);
                if (success) {
                    Router.update();
                    Router.redirect(`/users/${this.userId}`);
                }

            }
            catch (error) {
                await new Modal().renderInfoModal({
                    id: 'error-modal',
                    title: window.ls.__('error in user editing'),
                    message: window.ls.__('an unexpecting error occured during user profile editing!')
                });
                return;
            }
        });

        document.getElementById('delete-user-btn')?.addEventListener('click', async () => {
            document.getElementById('confirm-delete-modal')?.remove();
            const modal = new Modal();

            await modal.renderDeleteModal({
                id: 'confirm-delete-modal',
                userId: this.userId,
                onConfirm: async () => {
                    await UserService.deleteUser(Number(this.userId));
                    Router.redirect('/login');
                }
            });

            document.getElementById('confirm-delete-modal')?.classList.remove('hidden');
        });
    }
}
