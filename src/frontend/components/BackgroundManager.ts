export function setBackgroundImage(imagePath: string) {
	const app = document.getElementById('app');

	if (app) {
		const img = new Image();
		img.src = imagePath;

		img.onload = () => {
			app.style.backgroundImage = `url('${imagePath}')`;
			app.style.backgroundSize = 'cover';
			app.style.backgroundPosition = 'center';
			app.style.backgroundRepeat = 'no-repeat';
			app.style.transition = 'background-image 0.01s ease-in-out';
		};
	}
}
