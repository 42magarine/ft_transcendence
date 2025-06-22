import { generateProfileImage } from '../../utils/Avatar.js';
import AbstractView from '../../utils/AbstractView.js';
import UserService from '../services/UserService.js';
import Card from '../components/Card.js';

export default class Profile extends AbstractView {
    private userId: string;

    constructor(routeParams: Record<string, string> = {}, params: URLSearchParams = new URLSearchParams()) {
        super(routeParams, params);
        this.userId = routeParams["id"];
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

        const profileCard = await new Card().renderCard({
            contentBlocks: [
                {
                    type: 'heading',
                    props: {
                        text: `${window.ls.__('Profile')}: ${userData.username}`,
                        level: 1,
                        className: 'text-2xl font-bold text-center mb-4'
                    }
                },
                {
                    type: 'avatar',
                    props: {
                        src: generateProfileImage(userData, 200, 200),
                        size: 200,
                        className: 'mb-4'
                    }
                },
                {
                    type: 'stat',
                    props: {
                        label: window.ls.__('Name'),
                        value: userData.name ?? ''
                    }
                },
                {
                    type: 'stat',
                    props: {
                        label: window.ls.__('Username'),
                        value: userData.username ?? ''
                    }
                },
                {
                    type: 'stat',
                    props: {
                        label: window.ls.__('Email'),
                        value: userData.email ?? ''
                    }
                },
                {
                    type: 'stat',
                    props: {
                        label: window.ls.__('User ID'),
                        value: userData.id?.toString() ?? ''
                    }
                },
                {
                    type: 'stat',
                    props: {
                        checkbox: true,
                        label: window.ls.__('Email Verified'),
                        value: userData.emailVerified === true ? 'true' : 'false'
                    }
                },
                {
                    type: 'stat',
                    props: {
                        checkbox: true,
                        label: window.ls.__('Two Factor Verified'),
                        value: userData.emailVerified === true ? 'true' : 'false'
                    }
                },
                {
                    type: 'stat',
                    props: {
                        checkbox: true,
                        label: window.ls.__('Google Sign-In'),
                        value: userData.googleSignIn === true ? 'true' : 'false'
                    }
                },
                {
                    type: 'buttongroup',
                    props: {
                        layout: 'group',
                        buttons: [
                            {
                                id: 'edit-profile',
                                text: window.ls.__('Edit Profile'),
                                href: `/users/edit/${this.userId}`
                            },
                            {
                                id: 'back-to-list',
                                text: isMaster ? window.ls.__('Back to User List') : window.ls.__('Back to Homepage'),
                                href: isMaster ? '/user-mangement' : `/`,
                                color: 'red'
                            }
                        ]
                    }
                }
            ]
        });
        return this.render(profileCard);
    }
}
