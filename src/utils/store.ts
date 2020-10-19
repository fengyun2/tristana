/*
 * Mobx 持久化存储
 * @Author: Jiang
 * @Date: 2020-03-18 23:03:34
 * @Last Modified by: Jiang
 * @Last Modified time: 2020-09-14 10:16:50
 */
import { action, autorun, observable, extendObservable, computed } from 'mobx';

function getStorageByType(type) {
    let _storage = localStorage;
    if (type === 'session') {
        _storage = sessionStorage;
    }
    return _storage;
}

const storage = {
    getItem: function (key, type) {
        try {
            const _storage = getStorageByType(type);
            let value = _storage.getItem(key);
            if (value) value = JSON.parse(value);
            return value;
        } catch (e) {
            console.error(`Failed to get ${key} from ${type === 'session' ? 'sessionStorage' : 'localStorage'}`);
            return undefined;
        }
    },

    setItem: function (key, val, type) {
        try {
            const _storage = getStorageByType(type);
            if (Object.prototype.toString.call(val) == '[object Undefined]') {
                _storage.removeItem(key);
            } else {
                _storage.setItem(key, JSON.stringify(val));
            }
        } catch (e) {
            console.error(`Failed to set ${key} into ${type === 'session' ? 'sessionStorage' : 'localStorage'}`);
        }
    },

    removeItem: function (key, type) {
        try {
            const _storage = getStorageByType(type);
            if (!(Object.prototype.toString.call(_storage.getItem(key)) == '[object Undefined]')) {
                _storage.removeItem(key);
            }
        } catch (e) {
            console.error(`Failed to remove ${key} into ${type === 'session' ? 'sessionStorage' : 'localStorage'}`);
        }
    },

    clear: function (type) {
        try {
            const _storage = getStorageByType(type);
            _storage.clear();
        } catch (e) {
            console.error(`Failed to clear ${type === 'session' ? 'sessionStorage' : 'localStorage'}`);
        }
    },

    // eslint-disable-next-line no-unused-vars
    sync: (key, type) => { }
};

storage.sync = function (key, type) {
    return function (target, name, descriptor) {
        const privateProp = `__${name}`;
        let initialValue = storage.getItem(key, type);
        if (descriptor && descriptor.initializer) {
            if (Object.prototype.toString.call(initialValue) == '[object Null]') {
                initialValue = descriptor.initializer();
            } else {
                descriptor.initializer = function () {
                    return initialValue;
                };
            }
            observable(target, privateProp, descriptor);
            return computed(target, name, {
                get() {
                    return this[privateProp];
                },
                set(value) {
                    this[privateProp] = value;
                    // @ts-ignore
                    storage.setItem(key, value);
                }
            });
        }

        if (descriptor && !(Object.prototype.toString.call(initialValue) == '[object Null]' ||  Object.prototype.toString.call(initialValue) == '[object Undefined]')) {
            descriptor.initializer = function () {
                return initialValue;
            };
        }

        return extendObservable(target, {
            [privateProp]: descriptor,
            get() {
                return this[privateProp];
            },
            set(value) {
                this[privateProp] = value;
                // @ts-ignore
                storage.setItem(key, value);
            }
        });
    };
};

// @ts-ignore
storage.sync.observable = action(function (object, attr, key) {
    console.warn('`storage.sync.observable` is deprecated, use `storage.sync` instead');
    // @ts-ignore
    const value = storage.getItem(key);

    if (!(Object.prototype.toString.call(value) == '[object Null]' ||  Object.prototype.toString.call(value) == '[object Undefined]')) object[attr] = value;
    autorun(() => {
        // @ts-ignore
        storage.setItem(key, object[attr]);
    });
});


export default storage;