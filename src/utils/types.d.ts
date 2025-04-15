import AbstractView from "./AbstractView.js";
export interface RouteMetadata {
    title?: string;
    description?: string;
    [key: string]: any;
}
export interface Route {
    path: string | RegExp;
    view: new (params?: URLSearchParams) => AbstractView;
    metadata?: RouteMetadata;
}
