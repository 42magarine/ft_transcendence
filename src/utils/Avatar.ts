import { ShapeOptions, TextVisualizationOptions, PatternResult } from "../interfaces/userManagementInterfaces.js"

function getColorFromString(text: string, index: number = 0): string {
    // Generate a deterministic color based on the string and index
    const charSum = text.split('').reduce((sum, char, i) => {
        // Weight characters differently based on their position
        return sum + char.charCodeAt(0) * (i + 1);
    }, 0);

    const hue = ((charSum + index * 83) % 360); // Use prime number 83 for better distribution
    const saturation = 65 + ((charSum % 20) + index * 3) % 35; // Between 65% and 100%
    const lightness = 45 + ((charSum % 15) + index * 5) % 25; // Between 45% and 70%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function generateColorPalette(text: string, numColors: number = 5): string[] {
    const palette: string[] = [];

    if (!text || text.length === 0) {
        // Fallback to a default palette with blues and purples
        return ['#3498db', '#9b59b6', '#2980b9', '#8e44ad', '#2c3e50'];
    }

    for (let i = 0; i < numColors; i++) {
        palette.push(getColorFromString(text, i));
    }

    return palette;
}

function generateCircle(x: number, y: number, radius: number, options: ShapeOptions = {}): string {
    const fill = options.fill || '#000000';
    const stroke = options.stroke || 'none';
    const strokeWidth = options.strokeWidth || 0;
    const opacity = options.opacity || 1;
    const rotate = options.rotate || 0;

    return `<circle
	  cx="${x}"
	  cy="${y}"
	  r="${radius}"
	  fill="${fill}"
	  stroke="${stroke}"
	  stroke-width="${strokeWidth}"
	  opacity="${opacity}"
	  transform="rotate(${rotate} ${x} ${y})"
	/>`;
}

function generateRect(x: number, y: number, width: number, height: number, options: ShapeOptions = {}): string {
    const fill = options.fill || '#000000';
    const stroke = options.stroke || 'none';
    const strokeWidth = options.strokeWidth || 0;
    const opacity = options.opacity || 1;
    const rotate = options.rotate || 0;

    return `<rect
	  x="${x}"
	  y="${y}"
	  width="${width}"
	  height="${height}"
	  fill="${fill}"
	  stroke="${stroke}"
	  stroke-width="${strokeWidth}"
	  opacity="${opacity}"
	  transform="rotate(${rotate} ${x + width / 2} ${y + height / 2})"
	/>`;
}

function generateTriangle(x: number, y: number, size: number, options: ShapeOptions = {}): string {
    const fill = options.fill || '#000000';
    const stroke = options.stroke || 'none';
    const strokeWidth = options.strokeWidth || 0;
    const opacity = options.opacity || 1;
    const rotate = options.rotate || 0;

    const x1 = x;
    const y1 = y - size / 2;
    const x2 = x - size / 2;
    const y2 = y + size / 2;
    const x3 = x + size / 2;
    const y3 = y + size / 2;

    return `<polygon
	  points="${x1},${y1} ${x2},${y2} ${x3},${y3}"
	  fill="${fill}"
	  stroke="${stroke}"
	  stroke-width="${strokeWidth}"
	  opacity="${opacity}"
	  transform="rotate(${rotate} ${x} ${y})"
	/>`;
}

function generateStar(x: number, y: number, size: number, points: number = 5, options: ShapeOptions = {}): string {
    const fill = options.fill || '#000000';
    const stroke = options.stroke || 'none';
    const strokeWidth = options.strokeWidth || 0;
    const opacity = options.opacity || 1;
    const rotate = options.rotate || 0;

    const outerRadius = size / 2;
    const innerRadius = size / 4;
    let pointsStr = '';

    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * i) / points;
        const px = x + radius * Math.sin(angle);
        const py = y - radius * Math.cos(angle);
        pointsStr += `${px},${py} `;
    }

    return `<polygon
	  points="${pointsStr.trim()}"
	  fill="${fill}"
	  stroke="${stroke}"
	  stroke-width="${strokeWidth}"
	  opacity="${opacity}"
	  transform="rotate(${rotate} ${x} ${y})"
	/>`;
}

function generateWave(startX: number, startY: number, width: number, height: number, frequency: number, options: ShapeOptions = {}, relativeStrokeWidth: number = 0.008): string {
    const fill = options.fill || 'none';
    const stroke = options.stroke || '#000000';
    // Make stroke width relative to width
    const strokeWidth = options.strokeWidth || width * relativeStrokeWidth;
    const opacity = options.opacity || 1;

    const steps = Math.max(10, Math.floor(width / 20));
    const stepSize = width / steps;
    let pathData = `M ${startX} ${startY}`;

    for (let i = 0; i <= steps; i++) {
        const x = startX + i * stepSize;
        const y = startY + Math.sin((i / steps) * Math.PI * 2 * frequency) * (height / 2);
        pathData += ` L ${x} ${y}`;
    }

    return `<path
	  d="${pathData}"
	  fill="${fill}"
	  stroke="${stroke}"
	  stroke-width="${strokeWidth}"
	  opacity="${opacity}"
	/>`;
}

function generateSpiral(centerX: number, centerY: number, maxRadius: number, turns: number, options: ShapeOptions = {}, relativeStrokeWidth: number = 0.008): string {
    const fill = options.fill || 'none';
    const stroke = options.stroke || '#000000';
    // Make stroke width relative to radius
    const strokeWidth = options.strokeWidth || maxRadius * relativeStrokeWidth;
    const opacity = options.opacity || 1;

    const steps = turns * 36; // 36 steps per turn for a smooth spiral
    const angleStep = (turns * Math.PI * 2) / steps;

    let pathData = `M ${centerX} ${centerY}`;

    for (let i = 1; i <= steps; i++) {
        const angle = i * angleStep;
        const radius = (i / steps) * maxRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        pathData += ` L ${x} ${y}`;
    }

    return `<path
	  d="${pathData}"
	  fill="${fill}"
	  stroke="${stroke}"
	  stroke-width="${strokeWidth}"
	  opacity="${opacity}"
	/>`;
}

function generatePattern(text: string, width: number, height: number, options: ShapeOptions = {}): PatternResult {
    const patternId = `pattern-${Date.now()}`;
    const charSum = text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

    // Make pattern size relative to width - quadrupled size
    const patternSizePercent = 0.1 + (charSum % 30) * 0.004; // Between 10% and 22% of width (quadrupled)
    const patternSize = width * patternSizePercent;

    const fill = options.fill || '#000000';

    // Determine pattern type based on first character
    const firstChar = text.charAt(0).toLowerCase();
    const charCode = firstChar.charCodeAt(0);
    const patternType = charCode % 5; // 5 different pattern types

    // Calculate relative stroke width - quadrupled size
    const relativeStrokeWidth = width * 0.002; // 0.2% of width (quadrupled)
    const relativeDotRadius = width * 0.01; // 1% of width (quadrupled)

    let patternSvg = '';

    switch (patternType) {
        case 0: // Dots
            patternSvg = `
			<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}">
				<circle cx="${patternSize / 4}" cy="${patternSize / 4}" r="${relativeDotRadius}" fill="${fill}" opacity="0.5" />
				<circle cx="${patternSize * 3 / 4}" cy="${patternSize * 3 / 4}" r="${relativeDotRadius}" fill="${fill}" opacity="0.5" />
			</pattern>
			`;
            break;
        case 1: // Diagonal lines
            patternSvg = `
			<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}">
				<line x1="0" y1="0" x2="${patternSize}" y2="${patternSize}" stroke="${fill}" stroke-width="${relativeStrokeWidth}" opacity="0.5" />
			</pattern>
			`;
            break;
        case 2: // Grid
            patternSvg = `
			<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}">
				<line x1="0" y1="${patternSize / 2}" x2="${patternSize}" y2="${patternSize / 2}" stroke="${fill}" stroke-width="${relativeStrokeWidth}" opacity="0.3" />
				<line x1="${patternSize / 2}" y1="0" x2="${patternSize / 2}" y2="${patternSize}" stroke="${fill}" stroke-width="${relativeStrokeWidth}" opacity="0.3" />
			</pattern>
			`;
            break;
        case 3: // Circles
            patternSvg = `
			<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}">
				<circle cx="${patternSize / 2}" cy="${patternSize / 2}" r="${patternSize / 4}" fill="none" stroke="${fill}" stroke-width="${relativeStrokeWidth}" opacity="0.4" />
			</pattern>
			`;
            break;
        case 4: // Zigzag
            patternSvg = `
			<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}">
				<path d="M0,0 L${patternSize / 2},${patternSize / 2} L0,${patternSize} M${patternSize / 2},0 L${patternSize},${patternSize / 2} L${patternSize / 2},${patternSize}" stroke="${fill}" stroke-width="${relativeStrokeWidth}" fill="none" opacity="0.4" />
			</pattern>
			`;
            break;
    }

    const rectSvg = `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#${patternId})" />`;

    return { pattern: patternSvg, rect: rectSvg };
}

function generateMandala(centerX: number, centerY: number, radius: number, text: string, colors: string[]): string {
    // Determine segments and layers based on text properties
    const textHash = text.split('').reduce((sum, char, i) => {
        return sum + char.charCodeAt(0) * (i + 1);
    }, 0);

    const segments = Math.max(6, Math.min(24, (textHash % 16) + 8)); // Between 6 and 24 segments
    const layers = Math.max(3, Math.min(6, (textHash % 4) + 3)); // Between 3 and 6 layers

    // Calculate relative stroke width - quadrupled size
    const relativeStrokeWidth = radius * 0.02; // 2% of radius (quadrupled)

    let mandalaSvg = '';

    // Base circle
    mandalaSvg += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${colors[0]}" opacity="0.2" />`;

    // Generate layers
    for (let layer = 0; layer < layers; layer++) {
        const layerRadius = radius * (1 - layer / layers);
        const layerColor = colors[layer % colors.length];

        // Calculate opacity based on layer
        const opacity = 0.8 - (layer * 0.1);

        // For each segment in this layer
        for (let segment = 0; segment < segments; segment++) {
            const angle = (segment / segments) * Math.PI * 2;
            const nextAngle = ((segment + 1) / segments) * Math.PI * 2;

            // Calculate points for this segment
            const x1 = centerX + Math.cos(angle) * layerRadius * 0.5;
            const y1 = centerY + Math.sin(angle) * layerRadius * 0.5;
            const x2 = centerX + Math.cos(angle) * layerRadius;
            const y2 = centerY + Math.sin(angle) * layerRadius;
            const x3 = centerX + Math.cos(nextAngle) * layerRadius;
            const y3 = centerY + Math.sin(nextAngle) * layerRadius;
            const x4 = centerX + Math.cos(nextAngle) * layerRadius * 0.5;
            const y4 = centerY + Math.sin(nextAngle) * layerRadius * 0.5;

            // Alternate between shape types based on layer
            if (layer % 2 === 0) {
                mandalaSvg += `<path d="M ${centerX},${centerY} L ${x2},${y2} A ${layerRadius},${layerRadius} 0 0,1 ${x3},${y3} Z" fill="${layerColor}" opacity="${opacity}" />`;
            } else {
                mandalaSvg += `<polygon points="${centerX},${centerY} ${x2},${y2} ${x3},${y3}" fill="${layerColor}" opacity="${opacity}" />`;
            }

            // Add dots at segment points for inner layers
            if (layer < layers - 1) {
                // Make dot size relative to radius - quadrupled size
                const dotRadius = radius * 0.1; // Quadrupled from 0.025 to 0.1
                mandalaSvg += `<circle cx="${x2}" cy="${y2}" r="${dotRadius}" fill="${colors[(layer + 2) % colors.length]}" />`;
            }
        }

        // Add layer outline with relative stroke width
        mandalaSvg += `<circle cx="${centerX}" cy="${centerY}" r="${layerRadius}" fill="none" stroke="${colors[(layer + 1) % colors.length]}" stroke-width="${relativeStrokeWidth}" opacity="0.5" />`;
    }

    // Center circle with relative size - quadrupled size
    mandalaSvg += `<circle cx="${centerX}" cy="${centerY}" r="${radius * 0.8}" fill="${colors[colors.length - 1]}" />`;

    return mandalaSvg;
}

function getShapeForChar(char: string, x: number, y: number, size: number, colors: string[], charIndex: number, totalChars: number): string {
    const charCode = char.charCodeAt(0);
    const colorIndex = charCode % colors.length;
    const fill = colors[colorIndex];

    // Derive opacity and rotation deterministically from character and its position
    const opacity = 0.7 + ((charCode * (charIndex + 1)) % 30) / 100; // Between 0.7 and 1.0
    const rotate = (charCode * (charIndex + 1)) % 360; // Between 0 and 359 degrees

    const options: ShapeOptions = {
        fill,
        opacity,
        rotate
    };

    if ('aeiou'.includes(char.toLowerCase())) {
        return generateCircle(x, y, size / 2, options);
    }
    else if ('bcdfg'.includes(char.toLowerCase())) {
        return generateRect(x - size / 2, y - size / 2, size, size, options);
    }
    else if ('hjklm'.includes(char.toLowerCase())) {
        return generateTriangle(x, y, size, options);
    }
    else if ('npqrs'.includes(char.toLowerCase())) {
        return generateStar(x, y, size, 5, options);
    }
    else if ('tuvwxyz'.includes(char.toLowerCase())) {
        return generateStar(x, y, size, 6, options);
    }
    else if ('0123456789'.includes(char)) {
        return `<rect
		x="${x - size / 2}"
		y="${y - size / 2}"
		width="${size}"
		height="${size}"
		rx="${size / 4}"
		ry="${size / 4}"
		fill="${fill}"
		opacity="${options.opacity}"
		transform="rotate(${options.rotate} ${x} ${y})"
	  />`;
    }
    else {
        const specialShape = `<g transform="translate(${x - size / 2}, ${y - size / 2}) scale(${size / 100})">
		<path d="M50,10 L90,50 L50,90 L10,50 Z" fill="${fill}" opacity="${options.opacity}" transform="rotate(${options.rotate} 50 50)" />
	  </g>`;
        return specialShape;
    }
}

function generateTextVisualization(text: string, options: TextVisualizationOptions = {
    width: 100,
    height: 100,
}): string {
    while (text.length < 25 && text.length > 0) {
        text += text;
    }
    const width = options.width || 800;
    const height = options.height || 400;
    const backgroundColor = options.backgroundColor || '#ffffff';
    const useShapes = options.useShapes !== undefined ? options.useShapes : true;
    const maxShapes = options.maxShapes || 100;
    const showText = options.showText !== undefined ? options.showText : true;
    const textColor = options.textColor || '#333333';

    // Calculate fontSize relative to width - quadrupled size
    const fontSizePercent = options.fontSize ? options.fontSize / width : 0.16; // Default is 16% of width (quadrupled)
    const fontSize = width * fontSizePercent;

    const fontFamily = options.fontFamily || 'Arial, sans-serif';

    const colors = options.colorPalette || generateColorPalette(text, 5);

    // Use a viewBox for proper scaling regardless of the container size
    let svg = `<svg xmlns="https://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;

    // Background
    svg += `<rect width="${width}" height="${height}" fill="${backgroundColor}" />`;

    // Add patterns
    svg += '<defs>';
    const patternResult = generatePattern(text, width, height, { fill: colors[0] });
    svg += patternResult.pattern;
    svg += '</defs>';
    svg += patternResult.rect;

    // Content generation based on text characteristics
    const hasNumbers = /\d/.test(text);
    const hasSpecialChars = /[^\w\s]/.test(text);
    const textHash = text.split('').reduce((sum, char, i) => sum + char.charCodeAt(0) * (i + 1), 0);

    // Advanced visualizations for longer text
    if (text.length > 10 && (hasNumbers || hasSpecialChars)) {
        svg += generateMandala(width / 2, height / 2, Math.min(width, height) * 0.4, text, colors);
    }
    else if (text.length > 5) {
        // Spiral turns based on text length
        const spiralTurns = 2 + (textHash % 4); // Between 2 and 5 turns
        svg += generateSpiral(width / 2, height / 2, Math.min(width, height) * 0.4, spiralTurns, {
            stroke: colors[1],
            // Stroke width now calculated relative to width inside the function
        });

        // Wave frequency based on text characteristics
        const waveFrequency = Math.max(1, text.length / 10);
        svg += generateWave(0, height * 0.75, width, height * 0.2, waveFrequency, {
            stroke: colors[2],
            // Stroke width now calculated relative to width inside the function
        });
    }

    // Add character shapes
    if (useShapes) {
        const chars = text.split('');
        const shapesCount = Math.min(chars.length, maxShapes);

        for (let i = 0; i < shapesCount; i++) {
            const char = chars[i];
            let x, y;

            // Position shapes in a deterministic pattern
            if (shapesCount <= 10) {
                // For short text, arrange in a line
                x = width * (i + 1) / (shapesCount + 1);
                y = height * 0.4;
            }
            else {
                // For longer text, arrange in a spiral or circular pattern
                const angle = (i / shapesCount) * Math.PI * 2;
                const radius = height * 0.3 * (0.5 + (i % 3) * 0.15);
                x = width / 2 + Math.cos(angle) * radius;
                y = height / 2 + Math.sin(angle) * radius;
            }

            // Size varies slightly based on character, but always relative to fontSize
            const sizeVariation = 1.2 + (char.charCodeAt(0) % 10) / 10;
            const size = fontSize * sizeVariation;

            svg += getShapeForChar(char, x, y, size, colors, i, shapesCount);
        }
    }

    // Add centered text
    if (showText) {
        // Calculate drop shadow size relative to width - quadrupled size
        const shadowSize = width * 0.006; // 0.6% of width (quadrupled)

        svg += `
		<text
		  x="50%"
		  y="50%"
		  dominant-baseline="middle"
		  text-anchor="middle"
		  font-family="${fontFamily}"
		  font-size="${fontSize}"
		  fill="${textColor}"
		  font-weight="bold"
		  filter="drop-shadow(0px 0px ${shadowSize}px rgba(255,255,255,0.7))"
		>${text}</text>
	  `;
    }

    svg += '</svg>';

    return svg;
}


function generateProfileImage(userData: any, width: number, height: number): string {
    if (userData.avatar) {
        return `<img src="${userData.avatar}" alt="Avatar of ${userData.d}" />`;
    }
    let seed = "";
    if (userData.username) {
        seed = `${userData.username}`;
    }
    return generateTextVisualization(seed, {
        width: width,
        height: height,
        useShapes: true,
        maxShapes: 50,
        showText: false,
        backgroundColor: '#f0f0f0'
    });
}

export {
    generateTextVisualization,
    generateColorPalette,
    generateCircle,
    generateRect,
    generateTriangle,
    generateStar,
    generateWave,
    generateSpiral,
    generatePattern,
    generateMandala,
    getColorFromString,
    generateProfileImage
};
