"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _RNWebSpeechRecognition_interimResults, _RNWebSpeechRecognition_subscriptionMap, _RNWebSpeechRecognition_onstart, _RNWebSpeechRecognition_onend, _RNWebSpeechRecognition_onerror, _RNWebSpeechRecognition_onresult, _RNWebSpeechRecognition_onnomatch, _RNWebSpeechRecognition_onspeechstart, _RNWebSpeechRecognition_onspeechend, _RNWebSpeechRecognition_onaudiostart, _RNWebSpeechRecognition_onaudioend, _RNWebSpeechGrammarList_grammars, _RNSpeechRecognitionResultList_results, _RNSpeechRecognitionResultItem_alternatives;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RNWebSpeechGrammar = exports.RNWebSpeechGrammarList = exports.RNWebSpeechRecognition = void 0;
const RNSpeechRecognitionModule_1 = require("./RNSpeechRecognitionModule");
const noop = () => { };
const createEventData = (target) => ({
    AT_TARGET: 2,
    bubbles: false,
    BUBBLING_PHASE: 3,
    cancelable: false,
    CAPTURING_PHASE: 1,
    composed: false,
    composedPath: () => [],
    currentTarget: target,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: true,
    NONE: 0,
    preventDefault: noop,
    resultIndex: 0,
    stopImmediatePropagation: noop,
    stopPropagation: noop,
    target,
    timeStamp: 0,
    type: "",
    cancelBubble: false,
    returnValue: false,
    srcElement: null,
    initEvent: noop,
});
function stubEvent(eventName, instance, listener) {
    return {
        eventName,
        nativeListener: (_nativeEvent) => listener.call(instance, createEventData(instance)),
    };
}
const WebListenerTransformers = {
    audiostart: (instance, listener) => ({
        eventName: "audiostart",
        nativeListener(nativeEvent) {
            listener.call(instance, Object.assign(Object.assign({}, createEventData(instance)), { uri: nativeEvent.uri }));
        },
    }),
    audioend: (instance, listener) => ({
        eventName: "audioend",
        nativeListener(nativeEvent) {
            listener.call(instance, Object.assign(Object.assign({}, createEventData(instance)), { uri: nativeEvent.uri }));
        },
    }),
    nomatch: (instance, listener) => stubEvent("nomatch", instance, listener),
    end: (instance, listener) => stubEvent("end", instance, listener),
    start: (instance, listener) => ({
        eventName: "start",
        nativeListener() {
            listener.call(instance, createEventData(instance));
        },
    }),
    error: (instance, listener) => ({
        eventName: "error",
        nativeListener: (nativeEvent) => {
            const clientEvent = Object.assign(Object.assign({}, createEventData(instance)), { error: nativeEvent.error, message: nativeEvent.message });
            listener.call(instance, clientEvent);
        },
    }),
    result: (instance, listener) => ({
        eventName: "result",
        nativeListener: (nativeEvent) => {
            if (!instance.interimResults && !nativeEvent.isFinal) {
                return;
            }
            const alternatives = nativeEvent.results.map((result) => new RNSpeechRecognitionAlternative(result.confidence, result.transcript));
            const clientEvent = Object.assign(Object.assign({}, createEventData(instance)), { results: new RNSpeechRecognitionResultList([
                    new RNSpeechRecognitionResultItem(nativeEvent.isFinal, alternatives),
                ]) });
            listener.call(instance, clientEvent);
        },
    }),
};
class RNWebSpeechRecognition {
    constructor() {
        this.lang = "en-US";
        this.grammars = new RNWebSpeechGrammarList();
        this.maxAlternatives = 1;
        this.continuous = false;
        _RNWebSpeechRecognition_interimResults.set(this, false);
        this.contextualStrings = undefined;
        this.requiresOnDeviceRecognition = false;
        this.addsPunctuation = false;
        this.androidIntent = undefined;
        this.iosTaskHint = undefined;
        this.iosCategory = undefined;
        _RNWebSpeechRecognition_subscriptionMap.set(this, new Map());
        _RNWebSpeechRecognition_onstart.set(this, null);
        _RNWebSpeechRecognition_onend.set(this, null);
        _RNWebSpeechRecognition_onerror.set(this, null);
        _RNWebSpeechRecognition_onresult.set(this, null);
        _RNWebSpeechRecognition_onnomatch.set(this, null);
        _RNWebSpeechRecognition_onspeechstart.set(this, null);
        _RNWebSpeechRecognition_onspeechend.set(this, null);
        _RNWebSpeechRecognition_onaudiostart.set(this, null);
        _RNWebSpeechRecognition_onaudioend.set(this, null);
        this.onsoundend = null;
        this.onsoundstart = null;
    }
    get interimResults() {
        return __classPrivateFieldGet(this, _RNWebSpeechRecognition_interimResults, "f");
    }
    set interimResults(interimResults) {
        __classPrivateFieldSet(this, _RNWebSpeechRecognition_interimResults, interimResults, "f");
    }
    start() {
        RNSpeechRecognitionModule_1.RNSpeechRecognitionModule.requestPermissionsAsync().then(() => {
            RNSpeechRecognitionModule_1.RNSpeechRecognitionModule.start({
                lang: this.lang,
                interimResults: this.interimResults,
                maxAlternatives: this.maxAlternatives,
                contextualStrings: this.contextualStrings,
                requiresOnDeviceRecognition: this.requiresOnDeviceRecognition,
                addsPunctuation: this.addsPunctuation,
                continuous: this.continuous,
                recordingOptions: this.recordingOptions,
                androidIntentOptions: this.androidIntentOptions,
                androidRecognitionServicePackage: this.androidRecognitionServicePackage,
                audioSource: this.audioSource,
                androidIntent: this.androidIntent,
                iosTaskHint: this.iosTaskHint,
                iosCategory: this.iosCategory,
            });
        });
    }
    stop() {
        RNSpeechRecognitionModule_1.RNSpeechRecognitionModule.stop();
    }
    abort() {
        RNSpeechRecognitionModule_1.RNSpeechRecognitionModule.abort();
    }
    set onstart(listener) {
        this._setListeners("start", listener, __classPrivateFieldGet(this, _RNWebSpeechRecognition_onstart, "f"));
        __classPrivateFieldSet(this, _RNWebSpeechRecognition_onstart, listener, "f");
    }
    get onstart() { return __classPrivateFieldGet(this, _RNWebSpeechRecognition_onstart, "f"); }
    set onend(listener) {
        this._setListeners("end", (ev) => listener === null || listener === void 0 ? void 0 : listener.call(this, ev), __classPrivateFieldGet(this, _RNWebSpeechRecognition_onend, "f"));
        __classPrivateFieldSet(this, _RNWebSpeechRecognition_onend, listener, "f");
    }
    get onend() { return __classPrivateFieldGet(this, _RNWebSpeechRecognition_onend, "f"); }
    set onerror(listener) {
        this._setListeners("error", listener, __classPrivateFieldGet(this, _RNWebSpeechRecognition_onerror, "f"));
        __classPrivateFieldSet(this, _RNWebSpeechRecognition_onerror, listener, "f");
    }
    get onerror() { return __classPrivateFieldGet(this, _RNWebSpeechRecognition_onerror, "f"); }
    _setListeners(key, listenerFn, existingListener) {
        if (existingListener) {
            this.removeEventListener(key, existingListener);
        }
        if (listenerFn) {
            this.addEventListener(key, listenerFn);
        }
    }
    set onresult(listener) {
        this._setListeners("result", listener, __classPrivateFieldGet(this, _RNWebSpeechRecognition_onresult, "f"));
        __classPrivateFieldSet(this, _RNWebSpeechRecognition_onresult, listener, "f");
    }
    get onresult() { return __classPrivateFieldGet(this, _RNWebSpeechRecognition_onresult, "f"); }
    set onnomatch(listener) {
        this._setListeners("nomatch", listener, __classPrivateFieldGet(this, _RNWebSpeechRecognition_onnomatch, "f"));
        __classPrivateFieldSet(this, _RNWebSpeechRecognition_onnomatch, listener, "f");
    }
    get onnomatch() { return __classPrivateFieldGet(this, _RNWebSpeechRecognition_onnomatch, "f"); }
    set onspeechstart(listener) {
        this._setListeners("speechstart", listener, __classPrivateFieldGet(this, _RNWebSpeechRecognition_onspeechstart, "f"));
        __classPrivateFieldSet(this, _RNWebSpeechRecognition_onspeechstart, listener, "f");
    }
    get onspeechstart() { return __classPrivateFieldGet(this, _RNWebSpeechRecognition_onspeechstart, "f"); }
    set onspeechend(listener) {
        this._setListeners("speechend", listener, __classPrivateFieldGet(this, _RNWebSpeechRecognition_onspeechend, "f"));
        __classPrivateFieldSet(this, _RNWebSpeechRecognition_onspeechend, listener, "f");
    }
    get onspeechend() { return __classPrivateFieldGet(this, _RNWebSpeechRecognition_onspeechend, "f"); }
    set onaudiostart(listener) {
        this._setListeners("audiostart", listener, __classPrivateFieldGet(this, _RNWebSpeechRecognition_onaudiostart, "f"));
        __classPrivateFieldSet(this, _RNWebSpeechRecognition_onaudiostart, listener, "f");
    }
    get onaudiostart() { return __classPrivateFieldGet(this, _RNWebSpeechRecognition_onaudiostart, "f"); }
    set onaudioend(listener) {
        this._setListeners("audioend", listener, __classPrivateFieldGet(this, _RNWebSpeechRecognition_onaudioend, "f"));
        __classPrivateFieldSet(this, _RNWebSpeechRecognition_onaudioend, listener, "f");
    }
    get onaudioend() { return __classPrivateFieldGet(this, _RNWebSpeechRecognition_onaudioend, "f"); }
    addEventListener(type, listener, options) {
        var _a, _b;
        const once = typeof options === "object" && options.once;
        const wrappedListener = once
            ? ((ev) => {
                var _a;
                listener.call(this, ev);
                for (const sub of (_a = __classPrivateFieldGet(this, _RNWebSpeechRecognition_subscriptionMap, "f").get(listener)) !== null && _a !== void 0 ? _a : []) {
                    sub.remove();
                }
                __classPrivateFieldGet(this, _RNWebSpeechRecognition_subscriptionMap, "f").delete(listener);
            })
            : listener;
        const enhancedEvent = (_b = (_a = WebListenerTransformers[type]) === null || _a === void 0 ? void 0 : _a.call(WebListenerTransformers, this, wrappedListener)) !== null && _b !== void 0 ? _b : stubEvent(type, this, wrappedListener);
        const subscription = RNSpeechRecognitionModule_1.RNSpeechRecognitionModule.addListener(enhancedEvent.eventName, enhancedEvent.nativeListener);
        __classPrivateFieldGet(this, _RNWebSpeechRecognition_subscriptionMap, "f").set(listener, [subscription]);
    }
    removeEventListener(type, listener, _options) {
        const subscriptions = __classPrivateFieldGet(this, _RNWebSpeechRecognition_subscriptionMap, "f").get(listener);
        if (subscriptions) {
            for (const subscription of subscriptions) {
                subscription.remove();
            }
            __classPrivateFieldGet(this, _RNWebSpeechRecognition_subscriptionMap, "f").delete(listener);
        }
    }
    dispatchEvent(_event) {
        throw new Error("Method not implemented.");
    }
}
exports.RNWebSpeechRecognition = RNWebSpeechRecognition;
_RNWebSpeechRecognition_interimResults = new WeakMap(), _RNWebSpeechRecognition_subscriptionMap = new WeakMap(), _RNWebSpeechRecognition_onstart = new WeakMap(), _RNWebSpeechRecognition_onend = new WeakMap(), _RNWebSpeechRecognition_onerror = new WeakMap(), _RNWebSpeechRecognition_onresult = new WeakMap(), _RNWebSpeechRecognition_onnomatch = new WeakMap(), _RNWebSpeechRecognition_onspeechstart = new WeakMap(), _RNWebSpeechRecognition_onspeechend = new WeakMap(), _RNWebSpeechRecognition_onaudiostart = new WeakMap(), _RNWebSpeechRecognition_onaudioend = new WeakMap();
class RNWebSpeechGrammarList {
    constructor() {
        _RNWebSpeechGrammarList_grammars.set(this, []);
        this.addFromString = (grammar, weight) => {
            __classPrivateFieldGet(this, _RNWebSpeechGrammarList_grammars, "f").push(new RNWebSpeechGrammar(grammar, weight));
            this[this.length - 1] = __classPrivateFieldGet(this, _RNWebSpeechGrammarList_grammars, "f")[this.length - 1];
        };
    }
    get length() {
        return __classPrivateFieldGet(this, _RNWebSpeechGrammarList_grammars, "f").length;
    }
    addFromURI(_src, _weight) { }
    item(index) {
        return __classPrivateFieldGet(this, _RNWebSpeechGrammarList_grammars, "f")[index];
    }
}
exports.RNWebSpeechGrammarList = RNWebSpeechGrammarList;
_RNWebSpeechGrammarList_grammars = new WeakMap();
class RNWebSpeechGrammar {
    constructor(src, weight) {
        this.src = "";
        this.weight = 1;
        this.src = src;
        this.weight = weight !== null && weight !== void 0 ? weight : 1;
    }
}
exports.RNWebSpeechGrammar = RNWebSpeechGrammar;
class RNSpeechRecognitionResultList {
    item(index) {
        return __classPrivateFieldGet(this, _RNSpeechRecognitionResultList_results, "f")[index];
    }
    constructor(results) {
        _RNSpeechRecognitionResultList_results.set(this, []);
        __classPrivateFieldSet(this, _RNSpeechRecognitionResultList_results, results, "f");
        this.length = results.length;
        for (let i = 0; i < __classPrivateFieldGet(this, _RNSpeechRecognitionResultList_results, "f").length; i++) {
            this[i] = __classPrivateFieldGet(this, _RNSpeechRecognitionResultList_results, "f")[i];
        }
    }
}
_RNSpeechRecognitionResultList_results = new WeakMap();
class RNSpeechRecognitionResultItem {
    item(index) {
        return __classPrivateFieldGet(this, _RNSpeechRecognitionResultItem_alternatives, "f")[index];
    }
    constructor(isFinal, alternatives) {
        _RNSpeechRecognitionResultItem_alternatives.set(this, []);
        this.isFinal = isFinal;
        this.length = alternatives.length;
        __classPrivateFieldSet(this, _RNSpeechRecognitionResultItem_alternatives, alternatives, "f");
        for (let i = 0; i < alternatives.length; i++) {
            this[i] = alternatives[i];
        }
    }
}
_RNSpeechRecognitionResultItem_alternatives = new WeakMap();
class RNSpeechRecognitionAlternative {
    constructor(confidence, transcript) {
        this.confidence = confidence;
        this.transcript = transcript;
    }
}
//# sourceMappingURL=RNWebSpeechRecognition.js.map