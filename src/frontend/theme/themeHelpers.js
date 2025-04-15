// Button styling
export function themedBtn(theme) {
    return `btn btn-theme-${theme} text-sm`;
}
// Card styling
export function themedCard(theme) {
    switch (theme) {
        case 'stars':
            return 'card card-stars';
        case 'mechazilla':
            return 'card card-mechazilla';
        case 'starship':
            return 'card card-starship';
        default:
            return 'card';
    }
}
// Input styling
export function themedInput(theme) {
    return `input-glass input-theme-${theme} focus:outline-none focus:ring-3 focus:border-white/40 w-full`;
}
// Label styling
export function themedLabel(theme) {
    switch (theme) {
        case 'stars':
            return 'text-white text-sm font-medium mb-2';
        case 'mechazilla':
            return 'text-orange-300 text-sm font-semibold mb-2';
        case 'starship':
            return 'text-white text-sm font-medium mb-2';
        default:
            return 'text-white text-sm font-medium mb-2';
    }
}
// Stat component styling
export function themedStat(theme) {
    switch (theme) {
        case 'stars':
            return 'bg-white/10 text-white';
        case 'mechazilla':
            return 'bg-black/40 text-orange-300';
        case 'starship':
            return 'bg-gray-900/40 text-white';
        default:
            return 'bg-white/10 text-white';
    }
}
// Main title styling
export function themedTitle(theme) {
    switch (theme) {
        case 'stars':
            return 'text-white';
        case 'mechazilla':
            return 'text-orange-400';
        case 'starship':
            return 'text-white';
        default:
            return 'text-white';
    }
}
// Subtitle styling
export function themedSubtitle(theme) {
    switch (theme) {
        case 'stars':
            return 'text-white/70';
        case 'mechazilla':
            return 'text-orange-200';
        case 'starship':
            return 'text-white/60';
        default:
            return 'text-white/70';
    }
}
// Toggle styling
export function themedToggle(theme) {
    switch (theme) {
        case 'stars':
            return 'bg-gray-600';
        case 'mechazilla':
            return 'bg-orange-400';
        case 'starship':
            return 'bg-gray-800';
        default:
            return 'bg-gray-600';
    }
}
// Toggle label styling
export function themedToggleLabel(theme) {
    switch (theme) {
        case 'stars':
            return 'text-white';
        case 'mechazilla':
            return 'text-orange-200';
        case 'starship':
            return 'text-white';
        default:
            return 'text-white';
    }
}
export function getThemeBackground(theme) {
    switch (theme) {
        case 'stars':
            return '/assets/backgrounds/stars.png';
        case 'mechazilla':
            return '/assets/backgrounds/mechazilla.png';
        case 'starship':
            return '/assets/backgrounds/starship.png';
        default:
            return '/assets/backgrounds/default.png';
    }
}
