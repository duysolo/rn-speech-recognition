export type PermissionStatus = "granted" | "denied" | "undetermined";
export type PermissionResponse = {
    status: PermissionStatus;
    granted: boolean;
    canAskAgain: boolean;
    expires: "never" | number;
};
export type RNSpeechRecognitionPermissionResponse = PermissionResponse & {
    restricted?: boolean;
};
import type { AudioEncodingAndroid, AVAudioSessionCategory, AVAudioSessionCategoryOptions, AVAudioSessionMode, RecognizerIntentEnableLanguageSwitch, RecognizerIntentExtraLanguageModel, TaskHintIOS } from "./constants";
export type AVAudioSessionCategoryValue = (typeof AVAudioSessionCategory)[keyof typeof AVAudioSessionCategory];
export type RNSpeechRecognitionResult = {
    transcript: string;
    confidence: number;
    segments: RNSpeechRecognitionResultSegment[];
};
export type RNSpeechRecognitionResultSegment = {
    startTimeMillis: number;
    endTimeMillis: number;
    segment: string;
    confidence: number;
};
export type RNSpeechRecognitionResultEvent = {
    isFinal: boolean;
    results: RNSpeechRecognitionResult[];
};
export type RNSpeechRecognitionErrorCode = "aborted" | "audio-capture" | "interrupted" | "bad-grammar" | "language-not-supported" | "network" | "no-speech" | "not-allowed" | "service-not-allowed" | "busy" | "client" | "speech-timeout" | "unknown";
export type RNSpeechRecognitionErrorEvent = {
    error: RNSpeechRecognitionErrorCode;
    message: string;
    code?: number;
};
export type LanguageDetectionEvent = {
    detectedLanguage: string;
    confidence: number;
    topLocaleAlternatives: string[];
};
export type RNSpeechRecognitionNativeEventMap = {
    result: RNSpeechRecognitionResultEvent;
    error: RNSpeechRecognitionErrorEvent;
    start: null;
    speechstart: null;
    speechend: null;
    nomatch: null;
    audiostart: {
        uri: string | null;
    };
    audioend: {
        uri: string | null;
    };
    end: null;
    soundstart: null;
    soundend: null;
    languagedetection: LanguageDetectionEvent;
    volumechange: {
        value: number;
    };
};
export type RNSpeechRecognitionOptions = {
    lang?: string;
    interimResults?: boolean;
    maxAlternatives?: number;
    contextualStrings?: string[];
    continuous?: boolean;
    requiresOnDeviceRecognition?: boolean;
    addsPunctuation?: boolean;
    androidRecognitionServicePackage?: string;
    androidIntentOptions?: Partial<AndroidIntentOptions>;
    audioSource?: AudioSourceOptions;
    recordingOptions?: RecordingOptions;
    androidIntent?: "android.speech.action.RECOGNIZE_SPEECH" | "android.speech.action.VOICE_SEARCH_HANDS_FREE" | "android.speech.action.WEB_SEARCH";
    iosTaskHint?: IOSTaskHintValue;
    iosCategory?: SetCategoryOptions;
    volumeChangeEventOptions?: {
        enabled?: boolean;
        intervalMillis?: number;
    };
    iosVoiceProcessingEnabled?: boolean;
};
export type IOSTaskHintValue = (typeof TaskHintIOS)[keyof typeof TaskHintIOS];
export type RecordingOptions = {
    persist: boolean;
    outputDirectory?: string;
    outputFileName?: string;
    outputSampleRate?: number;
    outputEncoding?: "pcmFormatFloat32" | "pcmFormatFloat64" | "pcmFormatInt16" | "pcmFormatInt32";
};
export type AudioSourceOptions = {
    uri: string;
    audioChannels?: number;
    audioEncoding?: AudioEncodingAndroidValue;
    sampleRate?: number;
    chunkDelayMillis?: number;
};
export type AudioEncodingAndroidValue = (typeof AudioEncodingAndroid)[keyof typeof AudioEncodingAndroid];
export type AndroidIntentOptions = {
    EXTRA_CALLING_PACKAGE: string;
    EXTRA_ENABLE_BIASING_DEVICE_CONTEXT: boolean;
    EXTRA_ENABLE_LANGUAGE_DETECTION: boolean;
    EXTRA_ENABLE_LANGUAGE_SWITCH: (typeof RecognizerIntentEnableLanguageSwitch)[keyof typeof RecognizerIntentEnableLanguageSwitch];
    EXTRA_ENABLE_FORMATTING: "latency" | "quality";
    EXTRA_HIDE_PARTIAL_TRAILING_PUNCTUATION: boolean;
    EXTRA_LANGUAGE_DETECTION_ALLOWED_LANGUAGES: string[];
    EXTRA_LANGUAGE_MODEL: (typeof RecognizerIntentExtraLanguageModel)[keyof typeof RecognizerIntentExtraLanguageModel];
    EXTRA_LANGUAGE_SWITCH_ALLOWED_LANGUAGES: string[];
    EXTRA_LANGUAGE_SWITCH_INITIAL_ACTIVE_DURATION_TIME_MILLIS: number;
    EXTRA_LANGUAGE_SWITCH_MAX_SWITCHES: number;
    EXTRA_MASK_OFFENSIVE_WORDS: boolean;
    EXTRA_ORIGIN: string;
    EXTRA_PREFER_OFFLINE: boolean;
    EXTRA_PROMPT: string;
    EXTRA_REQUEST_WORD_CONFIDENCE: boolean;
    EXTRA_REQUEST_WORD_TIMING: boolean;
    EXTRA_SECURE: boolean;
    EXTRA_SEGMENTED_SESSION: "android.speech.extra.AUDIO_SOURCE" | "android.speech.extras.SPEECH_INPUT_MINIMUM_LENGTH_MILLIS" | "android.speech.extras.SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS";
    EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: number;
    EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: number;
    EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: number;
};
export type RNSpeechRecognitionNativeEvents = {
    [K in keyof RNSpeechRecognitionNativeEventMap]: (event: RNSpeechRecognitionNativeEventMap[K]) => void;
};
export interface RNSpeechRecognitionModuleType {
    start(options: RNSpeechRecognitionOptions): void;
    stop(): void;
    abort(): void;
    requestPermissionsAsync(): Promise<RNSpeechRecognitionPermissionResponse>;
    getPermissionsAsync(): Promise<RNSpeechRecognitionPermissionResponse>;
    getMicrophonePermissionsAsync(): Promise<PermissionResponse>;
    requestMicrophonePermissionsAsync(): Promise<PermissionResponse>;
    getSpeechRecognizerPermissionsAsync(): Promise<RNSpeechRecognitionPermissionResponse>;
    requestSpeechRecognizerPermissionsAsync(): Promise<RNSpeechRecognitionPermissionResponse>;
    getSupportedLocales(options: {
        androidRecognitionServicePackage?: string;
    }): Promise<{
        locales: string[];
        installedLocales: string[];
    }>;
    getSpeechRecognitionServices(): string[];
    getDefaultRecognitionService(): {
        packageName: string;
    };
    getAssistantService(): {
        packageName: string;
    };
    supportsOnDeviceRecognition(): boolean;
    supportsRecording(): boolean;
    isRecognitionAvailable(): boolean;
    androidTriggerOfflineModelDownload(options: {
        locale: string;
    }): Promise<{
        status: "download_success" | "opened_dialog" | "download_canceled";
        message: string;
    }>;
    setCategoryIOS(options: SetCategoryOptions): void;
    getAudioSessionCategoryAndOptionsIOS(): {
        category: AVAudioSessionCategoryValue;
        categoryOptions: AVAudioSessionCategoryOptionsValue[];
        mode: AVAudioSessionModeValue;
    };
    setAudioSessionActiveIOS(value: boolean, options?: {
        notifyOthersOnDeactivation: boolean;
    }): void;
    getStateAsync(): Promise<SpeechRecognitionState>;
}
export type SetCategoryOptions = {
    category: AVAudioSessionCategoryValue;
    categoryOptions: AVAudioSessionCategoryOptionsValue[];
    mode?: AVAudioSessionModeValue;
};
type SpeechRecognitionState = "inactive" | "starting" | "recognizing" | "stopping";
export type AVAudioSessionCategoryOptionsValue = (typeof AVAudioSessionCategoryOptions)[keyof typeof AVAudioSessionCategoryOptions];
export type AVAudioSessionModeValue = (typeof AVAudioSessionMode)[keyof typeof AVAudioSessionMode];
export {};
//# sourceMappingURL=RNSpeechRecognitionModule.types.d.ts.map