import { NativeModules, NativeEventEmitter } from "react-native";
import type {
  RNSpeechRecognitionModuleType,
  RNSpeechRecognitionNativeEventMap,
} from "./RNSpeechRecognitionModule.types";

const NativeModule = NativeModules.RNSpeechRecognition;

const emitter = NativeModule
  ? new NativeEventEmitter(NativeModule)
  : null;

if (!NativeModule) {
  console.warn(
    "rn-speech-recognition: NativeModule is null. Make sure the native module is properly linked and you have rebuilt the app.",
  );
}

type EventSubscription = { remove: () => void };

const noopSubscription: EventSubscription = { remove: () => {} };

export const RNSpeechRecognitionModule: RNSpeechRecognitionModuleType & {
  addListener<K extends keyof RNSpeechRecognitionNativeEventMap>(
    eventName: K,
    listener: (event: RNSpeechRecognitionNativeEventMap[K]) => void,
  ): EventSubscription;
  removeAllListeners(eventName: keyof RNSpeechRecognitionNativeEventMap): void;
  isAvailable: boolean;
} = {
  ...NativeModule,
  isAvailable: !!NativeModule,
  addListener<K extends keyof RNSpeechRecognitionNativeEventMap>(
    eventName: K,
    listener: (event: RNSpeechRecognitionNativeEventMap[K]) => void,
  ): EventSubscription {
    if (!emitter) return noopSubscription;
    return emitter.addListener(eventName as string, listener);
  },
  removeAllListeners(eventName: keyof RNSpeechRecognitionNativeEventMap) {
    emitter?.removeAllListeners(eventName as string);
  },
  abort: () => NativeModule?.abort(),
  stop: () => NativeModule?.stop(),
};
