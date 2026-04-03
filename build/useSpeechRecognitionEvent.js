"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSpeechRecognitionEvent = useSpeechRecognitionEvent;
const react_1 = require("react");
const RNSpeechRecognitionModule_1 = require("./RNSpeechRecognitionModule");
function useSpeechRecognitionEvent(eventName, listener) {
    (0, react_1.useEffect)(() => {
        const subscription = RNSpeechRecognitionModule_1.RNSpeechRecognitionModule.addListener(eventName, listener);
        return () => {
            subscription.remove();
        };
    }, [eventName, listener]);
}
//# sourceMappingURL=useSpeechRecognitionEvent.js.map