class LanguageManager {
    constructor() {
        this.currentLang = 'en';
        this.forceLang = null;
        this.supportedLangs = ['en', 'fr', 'es', 'de'];
        this.translations = {
            site: null,
            data: null
        };
    }

    setForceLang(lang) {
        if (this.supportedLangs.includes(lang)) {
            this.forceLang = lang;
            this.currentLang = lang;
            localStorage.removeItem('userLanguage');
            this.translations = { site: null, data: null };
            if (this.translations.site !== null) {
                this.loadTranslations();
            }
            return true;
        }
        return false;
    }

    async loadTranslations() {
        try {
            console.log('Loading translations for:', this.currentLang);
            const timestamp = new Date().getTime();
            const fetchOptions = {
                method: 'GET',
                cache: 'default'
            };
            const siteResponse = await fetch(
                `assets/lang/${this.currentLang}/site.json`, 
                fetchOptions
            );
            if (!siteResponse.ok) throw new Error('Site translations fetch failed');
            this.translations.site = await siteResponse.json();
            const dataResponse = await fetch(
                `assets/lang/${this.currentLang}/data.json`, 
                fetchOptions
            );
            if (!dataResponse.ok) throw new Error('Data translations fetch failed');
            this.translations.data = await dataResponse.json();

            return true;
        } catch (error) {
            console.error('Failed to load translations:', error);
            if (this.currentLang !== 'en') {
                this.currentLang = 'en';
                return this.loadTranslations();
            }
            return false;
        }
    }

    detectLanguage() {
        if (this.forceLang) {
            this.currentLang = this.forceLang;
            return;
        }

        const savedLang = localStorage.getItem('userLanguage');
        if (savedLang && this.supportedLangs.includes(savedLang)) {
            this.currentLang = savedLang;
        } else {
            const browserLang = navigator.language.split('-')[0];
            if (this.supportedLangs.includes(browserLang)) {
                this.currentLang = browserLang;
            } else {
                this.currentLang = 'en';
            }
        }
    }

    async init() {
        this.detectLanguage();
        if (!this.forceLang) {
            localStorage.setItem('userLanguage', this.currentLang);
        }
        await this.loadTranslations();
    }

    clearForceLang() {
        this.forceLang = null;
        this.translations = { site: null, data: null }; 
        this.detectLanguage();
        if (this.translations.site !== null) {
            this.loadTranslations();
        }
    }

    getCurrentLang() {
        return this.currentLang;
    }

    getTranslations() {
        return this.translations;
    }

    getSiteTranslations() {
        return this.translations.site;
    }

    getDataTranslations() {
        return this.translations.data;
    }
}

const languageManager = new LanguageManager();
export default languageManager;