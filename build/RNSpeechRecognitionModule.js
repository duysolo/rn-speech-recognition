"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RNSpeechRecognitionModule = void 0;
const react_native_1 = require("react-native");
const NativeModule = react_native_1.NativeModules.RNSpeechRecognition;
if (!NativeModule) {
    throw new Error("rn-speech-recognition: NativeModule is null. Make sure the native module is properly linked.");
}
const emitter = new react_native_1.NativeEventEmitter(NativeModule);
exports.RNSpeechRecognitionModule = Object.assign(Object.assign({}, NativeModule), { addListener(eventName, listener) {
        return emitter.addListener(eventName, listener);
    },
    removeAllListeners(eventName) {
        emitter.removeAllListeners(eventName);
    }, abort: () => NativeModule.abort(), stop: () => NativeModule.stop() });
//# sourceMappingURL=RNSpeechRecognitionModule.js.map