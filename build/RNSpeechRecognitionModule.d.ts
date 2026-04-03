import { NativeEventEmitter } from "react-native";
import type { RNSpeechRecognitionModuleType, RNSpeechRecognitionNativeEventMap } from "./RNSpeechRecognitionModule.types";
type EventSubscription = ReturnType<NativeEventEmitter["addListener"]>;
export declare const RNSpeechRecognitionModule: RNSpeechRecognitionModuleType & {
    addListener<K extends keyof RNSpeechRecognitionNativeEventMap>(eventName: K, listener: (event: RNSpeechRecognitionNativeEventMap[K]) => void): EventSubscription;
    removeAllListeners(eventName: keyof RNSpeechRecognitionNativeEventMap): void;
};
export {};
//# sourceMappingURL=RNSpeechRecognitionModule.d.ts.map