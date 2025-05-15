// utils/language/translator.ts
import Translations from "./Translations.js";

const translator = new Translations();

// Load only once here
await translator.loadFromFile("utils/language/translations.json");

// Expose for global script use if needed
if (typeof window !== "undefined")
{
	(window as any).translator = translator;
}

export default translator;
