const getPropertyValue = require('./utility').getPropertyValue;
const isEmptyObject    = require('./utility').isEmptyObject;
const Cookies          = require('../lib/js-cookie');

const isStorageSupported = function(storage) {
    if (typeof storage === 'undefined') {
        return false;
    }

    const testKey = 'test';
    try {
        storage.setItem(testKey, '1');
        storage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
};

const Store = function(storage) {
    this.storage = storage;
};

Store.prototype = {
    get: function(key) {
        return this.storage.getItem(key) || undefined;
    },
    set: function(key, value) {
        if (typeof value !== 'undefined') {
            this.storage.setItem(key, value);
        }
    },
    remove: function(key) {
        this.storage.removeItem(key);
    },
    clear: function() {
        this.storage.clear();
    },
};

const InScriptStore = function(object) {
    this.store = typeof object !== 'undefined' ? object : {};
};

InScriptStore.prototype = {
    get: function(key) {
        return getPropertyValue(this.store, key);
    },
    set: function(key, value, obj = this.store) {
        if (!Array.isArray(key)) key = [key];
        if (key.length > 1) {
            if (!(key[0] in obj) || isEmptyObject(obj[key[0]])) obj[key[0]] = {};
            this.set(key.slice(1), value, obj[key[0]]);
        } else {
            obj[key[0]] = value;
        }
    },
    remove: function(key) { delete this.store[key]; },
    clear : function()    { this.store = {}; },
    has   : function(key) { return this.get(key) !== undefined; },
    keys  : function()    { return Object.keys(this.store); },
};

const State     = new InScriptStore();
State.prototype = InScriptStore.prototype;
/**
 * Shorthand function to get values from response object of State
 *
 * @param {String} pathname
 *     e.g. getResponse('authorize.currency') == get(['response', 'authorize', 'authorize', 'currency'])
 */
State.prototype.getResponse = function (pathname) {
    let path = pathname;
    if (typeof path === 'string') {
        const keys = path.split('.');
        path = ['response', keys[0]].concat(keys);
    }
    return this.get(path);
};
State.set('response', {});

const CookieStorage = function(cookie_name, cookie_domain) {
    this.initialized = false;
    this.cookie_name = cookie_name;
    const hostname = window.location.hostname;
    this.domain = cookie_domain || (/\.champion-fx\.com/i.test(hostname) ? `.${hostname.split('.').slice(-2).join('.')}` : hostname);
    this.path = '/';
    this.expires = new Date('Thu, 1 Jan 2037 12:00:00 GMT');
    this.value = {};
};

CookieStorage.prototype = {
    read: function() {
        const cookie_value = Cookies.get(this.cookie_name);
        try {
            this.value = cookie_value ? JSON.parse(cookie_value) : {};
        } catch (e) {
            this.value = {};
        }
        this.initialized = true;
    },
    write: function(value, expireDate, isSecure) {
        if (!this.initialized) this.read();
        this.value = value;
        if (expireDate) this.expires = expireDate;
        Cookies.set(this.cookie_name, this.value, {
            expires: this.expires,
            path   : this.path,
            domain : this.domain,
            secure : !!isSecure,
        });
    },
    get: function(key) {
        if (!this.initialized) this.read();
        return this.value[key];
    },
    set: function(key, value) {
        if (!this.initialized) this.read();
        this.value[key] = value;
        Cookies.set(this.cookie_name, this.value, {
            expires: new Date(this.expires),
            path   : this.path,
            domain : this.domain,
        });
    },
    remove: function() {
        Cookies.remove(this.cookie_name, {
            path  : this.path,
            domain: this.domain,
        });
    },
};

let SessionStore,
    LocalStore;
if (typeof window !== 'undefined' && isStorageSupported(window.localStorage)) {
    LocalStore = new Store(window.localStorage);
}

if (typeof window !== 'undefined' && isStorageSupported(window.sessionStorage)) {
    if (!LocalStore) {
        LocalStore = new Store(window.sessionStorage);
    }
    SessionStore = new Store(window.sessionStorage);
}

if (!SessionStore || !LocalStore) {
    if (!LocalStore) {
        LocalStore = new InScriptStore();
    }
    if (!SessionStore) {
        SessionStore = new InScriptStore();
    }
}

// LocalStorage can be used as a means of communication among
// different windows. The problem that is solved here is what
// happens if the user logs out or switches loginid in one
// window while keeping another window or tab open. This can
// lead to unintended trades. The solution is to reload the
// page in all windows after switching loginid or after logout.
$(document).ready(function () {
    // Cookies is not always available.
    // So, fall back to a more basic solution.
    let match = document.cookie.match(/\bloginid=(\w+)/);
    match = match ? match[1] : '';
    $(window).on('storage', function (jq_event) {
        switch (jq_event.originalEvent.key) {
            case 'client.loginid':
                if (jq_event.originalEvent.newValue !== match &&
                    (jq_event.originalEvent.newValue === '' || !/logged_inws/i.test(window.location.pathname))) {
                    window.location.reload();
                }
                break;
            // no default
        }
    });
});

module.exports = {
    CookieStorage: CookieStorage,
    State        : State,
    SessionStore : SessionStore,
    LocalStore   : LocalStore,
};
