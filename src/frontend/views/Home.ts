import UserService from '../services/UserService.js';
import AbstractView from '../../utils/AbstractView.js';
import Card from '../components/Card.js';

declare global {
    interface Window {
        Globe: any;
    }
}


export default class Home extends AbstractView {
    constructor() {
        super();
    }

    async getHtml(): Promise<string> {
        const currentUser = await UserService.getCurrentUser();

        const homeCard = await new Card().renderCard({
            title: currentUser
                ? `👋 ${currentUser.username}, ${window.ls.__('this is Transcendence!')}`
                : window.ls.__('Welcome to Transcendence!'),
            contentBlocks: [
                {
                    type: 'html',
                    props: {
                        html: `8======D -> -> -> ({})`
                    }
                }
            ]
        });

        return this.render(`${homeCard}`);


    }
    async mount(): Promise<void> {
        const globeContainer = document.getElementById('globeViz');
        if (!globeContainer) return;

        // Dynamically load globe.gl if not already present
        if (typeof window.Globe !== 'function') {
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/globe.gl';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load globe.gl'));
                document.head.appendChild(script);
            });
        }

        // Now it's safe to call Globe
        // @ts-ignore
        const world = window.Globe()(globeContainer)
            .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
            .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
            .showAtmosphere(true)
            .atmosphereColor('#3a228a')
            .atmosphereAltitude(0.25)
            .pointOfView({ lat: 20, lng: 10, altitude: 2 }, 4000);

        const canvas = globeContainer.querySelector('canvas');
        if (canvas) {
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.display = 'block';
            canvas.style.pointerEvents = 'auto';
        }

    }




}
