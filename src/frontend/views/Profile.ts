import { generateProfileImage } from '../../utils/Avatar.js';
import AbstractView from '../../utils/AbstractView.js';
import UserService from '../services/UserService.js';
import Card from '../components/Card.js'

export default class Profile extends AbstractView
{
	private userId: string;

	constructor(params: URLSearchParams)
    {
		super();
		this.userId = params.get('id') || 'unknown';
	}

	async getHtml(): Promise<string>
    {
		const userIdNum = Number(this.userId);
		const userData = isNaN(userIdNum) ? null : await UserService.getUserById(userIdNum);
		const profileImageSvg = userData ? generateProfileImage(userData, 200, 200) : '';

		if (userData)
        {
			const profileCard = await new Card().renderCard(
            {
                contentBlocks:
                [
                    {
                        type: 'heading',
                        props:
                        {
                            text: `Profile: ${userData.displayname}`,
                            level: 1,
                            className: 'text-2xl font-bold text-center mb-4'
                        }
                    },
                    {
                        type: 'container',
                        props:
                        {
                            className: 'flex flex-col items-center gap-2 mt-4',
                            html: `
                                <div>${profileImageSvg}</div>
                                <h2>${userData.displayname}</h2>
                                <p class="text-muted">@${userData.username}</p>
                            `
                        }
                    },
                    {
                        type: 'stat',
                        props:
                        {
                            label: 'Display Name',
                            value: userData.displayname ?? ''
                        }
                    },
                    {
                        type: 'stat',
                        props:
                        {
                            label: 'Username',
                            value: userData.username ?? ''
                        }
                    },
                    {
                        type: 'stat',
                        props:
                        {
                            label: 'Email',
                            value: userData.email ?? ''
                        }
                    },
                    {
                        type: 'stat',
                        props:
                        {
                            label: 'User ID',
                            value: userData.id?.toString() ?? ''
                        }
                    },
                    {
                        type: 'buttongroup',
                        props:
                        {
                            layout: 'stack',
                            align: 'center',
                            buttons:
                            [
                                {
                                    id: 'edit-profile',
                                    text: 'Edit Profile',
                                    href: `/users/edit/${this.userId}`,
                                    className: 'btn btn-primary',
                                },
                                {
                                    id: 'back-to-list',
                                    text: 'Back to User List',
                                    href: '/user-mangement',
                                    className: 'btn btn-secondary',
                                }
                            ]
                        }
                    }
                ]                
			});
			return this.render(profileCard);
		}
        else
        {
			const errorCard = await new Card().renderCard(
            {
				contentBlocks:
                [
                    {
                        type: 'heading',
                        props:
                        {
                            text: 'User Profile',
                            level: 1,
                            className: 'text-2xl font-bold text-center mb-4'
                        }
                    },
                    {
                        type: 'container',
                        props:
                        {
                            className: 'alert alert-warning text-center',
                            html: 'User not found or error loading user data.'
                        }
                    }
                ]                
			});
			return this.render(errorCard);
		}
	}
}
