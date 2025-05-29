export interface ShapeOptions
{
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    rotate?: number;
}

export interface TextVisualizationOptions
{
    width: number;
    height: number;
    backgroundColor?: string;
    useShapes?: boolean;
    maxShapes?: number;
    colorPalette?: string[];
    showText?: boolean;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
}

export interface PatternResult
{
    pattern: string;
    rect: string;
}
