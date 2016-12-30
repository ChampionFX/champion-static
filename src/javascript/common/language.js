const Cookies = require('../lib/js-cookie');

const Language = (function () {
    const all_languages = () => ({
        EN   : 'English',
        DE   : 'Deutsch',
        ES   : 'Español',
        FR   : 'Français',
        ID   : 'Indonesia',
        IT   : 'Italiano',
        JA   : '日本語',
        PL   : 'Polish',
        PT   : 'Português',
        RU   : 'Русский',
        TH   : 'Thai',
        VI   : 'Tiếng Việt',
        ZH_CN: '简体中文',
        ZH_TW: '繁體中文',
    });

    const language_from_url = () => {
        const regex = new RegExp('^(' + Object.keys(all_languages()).join('|') + ')$', 'i');
        const langs = window.location.href.split('/').slice(3);
        let lang = '';
        langs.forEach((l) => { lang = regex.test(l) ? l : lang; });
        return lang;
    };

    let current_lang = null;
    const language = () => {
        let lang = current_lang;
        if (!lang) {
            lang = (language_from_url() || Cookies.get('language') || 'EN').toUpperCase();
            current_lang = lang;
        }
        return lang;
    };

    const url_for_language = lang => (window.location.href.replace(new RegExp('\/' + language() + '\/', 'i'), '/' + lang.trim().toLowerCase() + '/'));

    return {
        all_languages   : all_languages,
        language        : language,
        url_for_language: url_for_language,
    };
})();

module.exports = {
    getAllLanguages: Language.all_languages,
    getLanguage    : Language.language,
    URLForLanguage : Language.url_for_language,
};
