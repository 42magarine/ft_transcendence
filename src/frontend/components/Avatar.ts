import { AvatarProps } from '../../interfaces/componentInterfaces.js';

export default function renderAvatar({
	src,
	className = '',
	size = 100,
}: AvatarProps): string {
	// If `src` is a base64-encoded SVG, return it using innerHTML injection instead of an <img> tag
	const isSvgData = src.startsWith('data:image/svg+xml');

	if (isSvgData) {
		// Extract raw SVG from base64
		const rawSvg = atob(src.replace('data:image/svg+xml;base64,', ''));

		return `
			<div class="${className} flex justify-center">
				<div style="width: ${size}px; height: ${size}px;" class="overflow-hidden rounded-full">
					<div style="width: ${size}px; height: ${size}px;" class="w-full h-full rounded-full object-cover">
						${rawSvg}
					</div>
				</div>
			</div>
		`;
	}

	// Default image fallback
	return `
		<div class="${className} flex justify-center">
			<div style="width: ${size}px; height: ${size}px;" class="overflow-hidden rounded-full">
				<img src="${src}" width="${size}" height="${size}" class="object-cover w-full h-full rounded-full" />
			</div>
		</div>
	`;
}
