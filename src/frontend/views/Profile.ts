import Card from '../components/Card.js';
import { generateProfileImage } from '../../utils/Avatar.js';
import AbstractView from '../../utils/AbstractView.js';
import UserService from '../services/UserService.js';
import type { ContentBlock } from '../../interfaces/abstractViewInterfaces.js';

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

        let contentBlocks: ContentBlock[];

        if (userData)
        {
            contentBlocks =
            [
                {
                    type: 'html',
                    props:
                    {
                        html: `
                            <h1 class="text-2xl font-bold text-center mb-4">Profile: ${userData.displayname}</h1>
                        `
                    }
                },
                {
                    type: 'html',
                    props:
                    {
                        html: `
                            <div class="flex flex-col items-center gap-2 mt-4">
                                <div>${profileImageSvg}</div>
                                <h2>${userData.displayname}</h2>
                                <p class="text-muted">@${userData.username}</p>
                            </div>
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
                                className: 'btn btn-primary'
                            },
                            {
                                id: 'back-to-list',
                                text: 'Back to User List',
                                href: '/user-mangement',
                                className: 'btn btn-secondary'
                            }
                        ]
                    }
                }
            ];
        }
        else
        {
            contentBlocks =
            [
                {
                    type: 'html',
                    props:{
                        html: `
                            <h1 class="text-2xl font-bold text-center mb-4">User Profile</h1>
                            <div class="alert alert-warning text-center">
                                User not found or error loading user data.
                            </div>
                        `
                    }
                }
            ];
        }

        const unifiedCard = await new Card().renderCard(
        {
            contentBlocks
        });

        return this.render(`${unifiedCard}`);
    }
}
