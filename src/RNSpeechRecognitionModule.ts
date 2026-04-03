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
const noopAsync = () => Promise.resolve({} as any);
const noop = () => {};

export const RNSpeechRecognitionModule: RNSpeechRecognitionModuleType & {
  addListener<K extends keyof RNSpeechRecognitionNativeEventMap>(
    eventName: K,
    listener: (event: RNSpeechRecognitionNativeEventMap[K]) => void,
  ): EventSubscription;
  removeAllListeners(eventName: keyof RNSpeechRecognitionNativeEventMap): void;
  isAvailable: boolean;
} = {
  isAvailable: !!NativeModule,

  // Core methods
  start: (options) => NativeModule?.start(options),
  stop: () => NativeModule?.stop(),
  abort: () => NativeModule?.abort(),

  // Permission methods
  requestPermissionsAsync: () =>
    NativeModule?.requestPermissionsAsync() ?? noopAsync(),
  getPermissionsAsync: () =>
    NativeModule?.getPermissionsAsync() ?? noopAsync(),
  getMicrophonePermissionsAsync: () =>
    NativeModule?.getMicrophonePermissionsAsync() ?? noopAsync(),
  requestMicrophonePermissionsAsync: () =>
    NativeModule?.requestMicrophonePermissionsAsync() ?? noopAsync(),
  getSpeechRecognizerPermissionsAsync: () =>
    NativeModule?.getSpeechRecognizerPermissionsAsync() ?? noopAsync(),
  requestSpeechRecognizerPermissionsAsync: () =>
    NativeModule?.requestSpeechRecognizerPermissionsAsync() ?? noopAsync(),

  // Query methods
  getStateAsync: () =>
    NativeModule?.getStateAsync() ?? Promise.resolve("inactive"),
  getSupportedLocales: (options) =>
    NativeModule?.getSupportedLocales(options) ??
    Promise.resolve({ locales: [], installedLocales: [] }),
  getSpeechRecognitionServices: () =>
    NativeModule?.getSpeechRecognitionServices() ?? [],
  getDefaultRecognitionService: () =>
    NativeModule?.getDefaultRecognitionService() ?? { packageName: "" },
  getAssistantService: () =>
    NativeModule?.getAssistantService() ?? { packageName: "" },

  // Capability methods
  supportsOnDeviceRecognition: () =>
    NativeModule?.supportsOnDeviceRecognition() ?? false,
  supportsRecording: () =>
    NativeModule?.supportsRecording() ?? false,
  isRecognitionAvailable: () =>
    NativeModule?.isRecognitionAvailable() ?? false,

  // Platform-specific
  androidTriggerOfflineModelDownload: (options) =>
    NativeModule?.androidTriggerOfflineModelDownload(options) ?? noopAsync(),
  setCategoryIOS: (options) =>
    NativeModule?.setCategoryIOS(options),
  getAudioSessionCategoryAndOptionsIOS: () =>
    NativeModule?.getAudioSessionCategoryAndOptionsIOS() ?? {
      category: "playAndRecord",
      categoryOptions: ["defaultToSpeaker", "allowBluetooth"],
      mode: "measurement",
    },
  setAudioSessionActiveIOS: (value, options) =>
    NativeModule?.setAudioSessionActiveIOS(value, options),

  // Event methods
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
};
