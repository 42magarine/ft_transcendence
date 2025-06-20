import { AvatarProps } from '../../interfaces/componentInterfaces.js';

export default function renderAvatar({
	src,
	className = '',
	size = 100,
}: AvatarProps): string {
	return `
        <div class="${className} flex justify-center">
            <div style="width: ${size}px; height: ${size}px;" class="overflow-hidden rounded-full">
                <img src="${src}" width="${size}" height="${size}" class="object-cover w-full h-full rounded-full" />
            </div>
        </div>
    `;
}
