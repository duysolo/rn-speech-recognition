import { NativeModules, NativeEventEmitter } from "react-native";
import type {
  RNSpeechRecognitionModuleType,
  RNSpeechRecognitionNativeEventMap,
} from "./RNSpeechRecognitionModule.types";

const NativeModule = NativeModules.RNSpeechRecognition;

if (!NativeModule) {
  throw new Error(
    "rn-speech-recognition: NativeModule is null. Make sure the native module is properly linked.",
  );
}

const emitter = new NativeEventEmitter(NativeModule);

type EventSubscription = ReturnType<NativeEventEmitter["addListener"]>;

export const RNSpeechRecognitionModule: RNSpeechRecognitionModuleType & {
  addListener<K extends keyof RNSpeechRecognitionNativeEventMap>(
    eventName: K,
    listener: (event: RNSpeechRecognitionNativeEventMap[K]) => void,
  ): EventSubscription;
  removeAllListeners(eventName: keyof RNSpeechRecognitionNativeEventMap): void;
} = {
  ...NativeModule,
  addListener<K extends keyof RNSpeechRecognitionNativeEventMap>(
    eventName: K,
    listener: (event: RNSpeechRecognitionNativeEventMap[K]) => void,
  ): EventSubscription {
    return emitter.addListener(eventName as string, listener);
  },
  removeAllListeners(eventName: keyof RNSpeechRecognitionNativeEventMap) {
    emitter.removeAllListeners(eventName as string);
  },
  abort: () => NativeModule.abort(),
  stop: () => NativeModule.stop(),
};
