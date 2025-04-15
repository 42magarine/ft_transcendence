import { Route } from "./types.js";
import AbstractView from "./AbstractView.js";
export default class Router {
    private routes;
    private currentView;
    constructor(routes: Route[]);
    private initEventListeners;
    navigateTo(url: string): Promise<void>;
    render(): Promise<void>;
    getCurrentView(): AbstractView | null;
}
