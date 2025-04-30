interface ShapeOptions {
	fill?: string;
	stroke?: string;
	strokeWidth?: number;
	opacity?: number;
	rotate?: number;
}

interface TextVisualizationOptions {
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

interface PatternResult {
	pattern: string;
	rect: string;
}

/**
 * Generiert eine zufällige Farbe
 */
function getRandomColor(): string {
	const letters = '0123456789ABCDEF';
	let color = '#';
	for (let i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

/**
 * Generiert eine Farbpalette basierend auf dem Text
 */
function generateColorPalette(text: string, numColors: number = 5): string[] {
	const palette: string[] = [];

	// Wenn Text leer ist, generiere zufällige Farben
	if (!text || text.length === 0) {
		for (let i = 0; i < numColors; i++) {
			palette.push(getRandomColor());
		}
		return palette;
	}

	// Berechne Farben basierend auf Zeichen im Text
	const charSum = text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
	const hueBase = (charSum % 360);

	for (let i = 0; i < numColors; i++) {
		// Verteile Farben um den Farbkreis basierend auf dem Text
		const hue = (hueBase + (i * (360 / numColors))) % 360;
		const saturation = 70 + (text.length % 30); // 70-100%
		const lightness = 45 + ((i * 10) % 30); // 45-75%

		palette.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
	}

	return palette;
}

/**
 * Generiert eine Kreisform
 */
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

/**
 * Generiert eine Rechteckform
 */
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

/**
 * Generiert eine Dreiecksform
 */
function generateTriangle(x: number, y: number, size: number, options: ShapeOptions = {}): string {
	const fill = options.fill || '#000000';
	const stroke = options.stroke || 'none';
	const strokeWidth = options.strokeWidth || 0;
	const opacity = options.opacity || 1;
	const rotate = options.rotate || 0;

	// Berechne die Punkte für das Dreieck
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

/**
 * Generiert eine Sternform
 */
function generateStar(x: number, y: number, size: number, points: number = 5, options: ShapeOptions = {}): string {
	const fill = options.fill || '#000000';
	const stroke = options.stroke || 'none';
	const strokeWidth = options.strokeWidth || 0;
	const opacity = options.opacity || 1;
	const rotate = options.rotate || 0;

	// Berechne die Punkte für den Stern
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

/**
 * Generiert eine Wellenform
 */
function generateWave(startX: number, startY: number, width: number, height: number, frequency: number, options: ShapeOptions = {}): string {
	const fill = options.fill || 'none';
	const stroke = options.stroke || '#000000';
	const strokeWidth = options.strokeWidth || 2;
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

/**
 * Generiert eine Spiralform
 */
function generateSpiral(centerX: number, centerY: number, maxRadius: number, turns: number, options: ShapeOptions = {}): string {
	const fill = options.fill || 'none';
	const stroke = options.stroke || '#000000';
	const strokeWidth = options.strokeWidth || 2;
	const opacity = options.opacity || 1;

	const steps = turns * 36; // 36 Schritte pro Umdrehung für eine glatte Spirale
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

/**
 * Generiert ein Muster basierend auf Text-Eigenschaften
 */
function generatePattern(text: string, width: number, height: number, options: ShapeOptions = {}): PatternResult {
	const patternId = `pattern-${Date.now()}`;
	const patternSize = 20 + (text.length % 30);
	const fill = options.fill || '#000000';

	// Wähle ein Muster basierend auf dem ersten Buchstaben des Textes
	const firstChar = text.charAt(0).toLowerCase();
	let patternSvg = '';

	if ('abcde'.includes(firstChar)) {
		// Punktmuster
		patternSvg = `
		<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}">
		  <circle cx="${patternSize / 4}" cy="${patternSize / 4}" r="2" fill="${fill}" opacity="0.5" />
		  <circle cx="${patternSize * 3 / 4}" cy="${patternSize * 3 / 4}" r="2" fill="${fill}" opacity="0.5" />
		</pattern>
	  `;
	} else if ('fghij'.includes(firstChar)) {
		// Linienmuster
		patternSvg = `
		<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}">
		  <line x1="0" y1="0" x2="${patternSize}" y2="${patternSize}" stroke="${fill}" stroke-width="1" opacity="0.5" />
		</pattern>
	  `;
	} else if ('klmno'.includes(firstChar)) {
		// Gittermuster
		patternSvg = `
		<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}">
		  <line x1="0" y1="${patternSize / 2}" x2="${patternSize}" y2="${patternSize / 2}" stroke="${fill}" stroke-width="1" opacity="0.3" />
		  <line x1="${patternSize / 2}" y1="0" x2="${patternSize / 2}" y2="${patternSize}" stroke="${fill}" stroke-width="1" opacity="0.3" />
		</pattern>
	  `;
	} else if ('pqrst'.includes(firstChar)) {
		// Kreismuster
		patternSvg = `
		<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}">
		  <circle cx="${patternSize / 2}" cy="${patternSize / 2}" r="${patternSize / 4}" fill="none" stroke="${fill}" stroke-width="1" opacity="0.4" />
		</pattern>
	  `;
	} else {
		// Zickzackmuster
		patternSvg = `
		<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${patternSize}" height="${patternSize}">
		  <path d="M0,0 L${patternSize / 2},${patternSize / 2} L0,${patternSize} M${patternSize / 2},0 L${patternSize},${patternSize / 2} L${patternSize / 2},${patternSize}" stroke="${fill}" stroke-width="1" fill="none" opacity="0.4" />
		</pattern>
	  `;
	}

	// Rechteck mit dem Muster
	const rectSvg = `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#${patternId})" />`;

	return { pattern: patternSvg, rect: rectSvg };
}

/**
 * Generiert ein Mandala basierend auf Text-Eigenschaften
 */
function generateMandala(centerX: number, centerY: number, radius: number, text: string, colors: string[]): string {
	// Berechne Anzahl der Segmente basierend auf der Textlänge
	const segments = Math.max(6, Math.min(24, text.length * 2));
	const layers = Math.max(3, Math.min(6, Math.floor(text.length / 2)));

	let mandalaSvg = '';

	// Generiere Hintergrundkreis
	mandalaSvg += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${colors[0]}" opacity="0.2" />`;

	// Generiere Schichten
	for (let layer = 0; layer < layers; layer++) {
		const layerRadius = radius * (1 - layer / layers);
		const layerColor = colors[layer % colors.length];

		// Generiere Segmente
		for (let segment = 0; segment < segments; segment++) {
			const angle = (segment / segments) * Math.PI * 2;
			const nextAngle = ((segment + 1) / segments) * Math.PI * 2;

			const x1 = centerX + Math.cos(angle) * layerRadius * 0.5;
			const y1 = centerY + Math.sin(angle) * layerRadius * 0.5;
			const x2 = centerX + Math.cos(angle) * layerRadius;
			const y2 = centerY + Math.sin(angle) * layerRadius;
			const x3 = centerX + Math.cos(nextAngle) * layerRadius;
			const y3 = centerY + Math.sin(nextAngle) * layerRadius;
			const x4 = centerX + Math.cos(nextAngle) * layerRadius * 0.5;
			const y4 = centerY + Math.sin(nextAngle) * layerRadius * 0.5;

			// Abwechselnde Formen für mehr Vielfalt
			if (layer % 2 === 0) {
				mandalaSvg += `<path d="M ${centerX},${centerY} L ${x2},${y2} A ${layerRadius},${layerRadius} 0 0,1 ${x3},${y3} Z" fill="${layerColor}" opacity="${0.7 - layer * 0.1}" />`;
			} else {
				mandalaSvg += `<polygon points="${centerX},${centerY} ${x2},${y2} ${x3},${y3}" fill="${layerColor}" opacity="${0.7 - layer * 0.1}" />`;
			}

			// Füge Kreise an den Ecken hinzu
			if (layer < layers - 1) {
				mandalaSvg += `<circle cx="${x2}" cy="${y2}" r="${radius / 40}" fill="${colors[(layer + 2) % colors.length]}" />`;
			}
		}

		// Kreisförmige Grenzlinie für jede Schicht
		mandalaSvg += `<circle cx="${centerX}" cy="${centerY}" r="${layerRadius}" fill="none" stroke="${colors[(layer + 1) % colors.length]}" stroke-width="${radius / 200}" opacity="0.5" />`;
	}

	// Zentraler Kreis
	mandalaSvg += `<circle cx="${centerX}" cy="${centerY}" r="${radius * 0.2}" fill="${colors[colors.length - 1]}" />`;

	return mandalaSvg;
}

/**
 * Wählt eine zufällige Form basierend auf dem Zeichen
 */
function getShapeForChar(char: string, x: number, y: number, size: number, colors: string[]): string {
	const charCode = char.charCodeAt(0);
	const colorIndex = charCode % colors.length;
	const fill = colors[colorIndex];
	const options: ShapeOptions = {
		fill,
		opacity: 0.7 + (Math.random() * 0.3),
		rotate: (charCode * 7) % 360
	};

	// Wähle Form basierend auf Zeichengruppen
	if ('aeiou'.includes(char.toLowerCase())) {
		// Vokale werden zu Kreisen
		return generateCircle(x, y, size / 2, options);
	} else if ('bcdfg'.includes(char.toLowerCase())) {
		// Einige Konsonanten werden zu Rechtecken
		return generateRect(x - size / 2, y - size / 2, size, size, options);
	} else if ('hjklm'.includes(char.toLowerCase())) {
		// Einige Konsonanten werden zu Dreiecken
		return generateTriangle(x, y, size, options);
	} else if ('npqrs'.includes(char.toLowerCase())) {
		// Einige Konsonanten werden zu Sternen
		return generateStar(x, y, size, 5, options);
	} else if ('tuvwxyz'.includes(char.toLowerCase())) {
		// Restliche Buchstaben werden zu Sternen mit mehr Zacken
		return generateStar(x, y, size, 6, options);
	} else if ('0123456789'.includes(char)) {
		// Zahlen werden zu Rechtecken mit Rundungen
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
	} else {
		// Sonderzeichen werden zu spezielle Formen
		const specialShape = `<g transform="translate(${x - size / 2}, ${y - size / 2}) scale(${size / 100})">
		<path d="M50,10 L90,50 L50,90 L10,50 Z" fill="${fill}" opacity="${options.opacity}" transform="rotate(${options.rotate} 50 50)" />
	  </g>`;
		return specialShape;
	}
}

/**
 * Hauptfunktion zur Generierung eines visuellen SVG basierend auf Text
 */
function generateTextVisualization(text: string, options: TextVisualizationOptions = {
	width: 800,
	height: 400
}): string {
	// Standardwerte setzen
	const width = options.width || 800;
	const height = options.height || 400;
	const backgroundColor = options.backgroundColor || '#ffffff';
	const useShapes = options.useShapes !== undefined ? options.useShapes : true;
	const maxShapes = options.maxShapes || 100;
	const showText = options.showText !== undefined ? options.showText : true;
	const textColor = options.textColor || '#333333';
	const fontSize = options.fontSize || 32;
	const fontFamily = options.fontFamily || 'Arial, sans-serif';

	// Generiere Farbpalette basierend auf dem Text
	const colors = options.colorPalette || generateColorPalette(text, 5);

	// Basis SVG erstellen
	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;

	// Hintergrund
	svg += `<rect width="${width}" height="${height}" fill="${backgroundColor}" />`;

	// Defs-Sektion für Muster und Gradienten
	svg += '<defs>';

	// Hintergrundmuster basierend auf dem Text
	const patternResult = generatePattern(text, width, height, { fill: colors[0] });
	svg += patternResult.pattern;
	svg += '</defs>';

	// Hintergrundmuster anwenden
	svg += patternResult.rect;

	// Bestimme Visualisierungstyp basierend auf Textlänge und Inhalt
	const hasNumbers = /\d/.test(text);
	const hasSpecialChars = /[^\w\s]/.test(text);

	// Visualisierungstyp wählen
	if (text.length > 10 && hasNumbers && hasSpecialChars) {
		// Komplexe Visualisierung mit Mandala
		svg += generateMandala(width / 2, height / 2, Math.min(width, height) * 0.4, text, colors);
	} else if (text.length > 5) {
		// Spiralen und Wellen für mittellange Texte
		const spiralTurns = Math.max(2, Math.min(5, text.length / 3));
		svg += generateSpiral(width / 2, height / 2, Math.min(width, height) * 0.4, spiralTurns, {
			stroke: colors[1],
			strokeWidth: 3
		});

		// Wellen am unteren Rand
		svg += generateWave(0, height * 0.75, width, height * 0.2, text.length / 5, {
			stroke: colors[2],
			strokeWidth: 2
		});
	}

	// Formen für jeden Buchstaben hinzufügen, wenn aktiviert
	if (useShapes) {
		const chars = text.split('');
		const shapesCount = Math.min(chars.length, maxShapes);

		for (let i = 0; i < shapesCount; i++) {
			const char = chars[i];

			// Position basierend auf Textindex berechnen (für Verteilung über Bild)
			let x, y;

			if (shapesCount <= 10) {
				// Horizontale Linie für wenige Zeichen
				x = width * (i + 1) / (shapesCount + 1);
				y = height * 0.4;
			} else {
				// Zufällige Platzierung für viele Zeichen
				x = width * 0.1 + (width * 0.8 * Math.random());
				y = height * 0.1 + (height * 0.8 * Math.random());
			}

			const size = fontSize * 1.5;
			svg += getShapeForChar(char, x, y, size, colors);
		}
	}

	// Text hinzufügen, wenn aktiviert
	if (showText) {
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
		  filter="drop-shadow(0px 0px 3px rgba(255,255,255,0.7))"
		>${text}</text>
	  `;
	}

	// SVG abschließen
	svg += '</svg>';

	return svg;
}

// Export der Funktionen
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
	getRandomColor
};