export default class Translations
{
	public static readonly languageNames: Record<string, string> = {
		en_EN: 'English',
		de_DE: 'Deutsch',
		it_IT: 'Italiano'
	};

	private transMap : Record<string, Record<string, string>> = {};
	private currentLang : string = "en_EN";

	constructor()
	{
		// Optional: load saved language from localStorage
		const saved = localStorage.getItem("lang");
		if (saved && Translations.languageNames[saved])
		{
			this.currentLang = saved;
		}
	}

	public async loadFromFile(filePath : string) : Promise<void>
	{
		const response = await fetch(filePath);
		if (!response.ok)
		{
			throw new Error(`Failed to load translations from ${filePath}`);
		}
		const fileContent = await response.text();
		this.transMap = JSON.parse(fileContent);
	}

	public setLanguage(lang : string) : void
	{
		if (Translations.languageNames[lang])
		{
			this.currentLang = lang;
			localStorage.setItem("lang", lang);
		}
	}

	public getLanguage() : string
	{
		return this.currentLang;
	}

	public getMapValue(key : string) : string
	{
		if (this.transMap[key])
		{
			return this.transMap[key][this.currentLang]
				|| this.transMap[key]["en_EN"]
				|| key;
		}
		return key;
	}

	public __(key : string) : string
	{
		return this.getMapValue(key);
	}
}
