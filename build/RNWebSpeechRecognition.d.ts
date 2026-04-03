import type { RNSpeechRecognitionOptions } from "./RNSpeechRecognitionModule.types";
type EventListenerOptions = {
    capture?: boolean;
};
type SpeechListener<K extends string> = (ev: any) => any;
export declare class RNWebSpeechRecognition {
    #private;
    lang: string;
    grammars: any;
    maxAlternatives: number;
    continuous: boolean;
    get interimResults(): boolean;
    set interimResults(interimResults: boolean);
    contextualStrings?: string[];
    requiresOnDeviceRecognition: boolean;
    addsPunctuation: boolean;
    androidIntentOptions?: RNSpeechRecognitionOptions["androidIntentOptions"];
    audioSource?: RNSpeechRecognitionOptions["audioSource"];
    recordingOptions?: RNSpeechRecognitionOptions["recordingOptions"];
    androidIntent?: RNSpeechRecognitionOptions["androidIntent"];
    iosTaskHint?: RNSpeechRecognitionOptions["iosTaskHint"];
    iosCategory?: RNSpeechRecognitionOptions["iosCategory"];
    androidRecognitionServicePackage?: RNSpeechRecognitionOptions["androidRecognitionServicePackage"];
    start(): void;
    stop(): void;
    abort(): void;
    set onstart(listener: SpeechListener<"start"> | null);
    get onstart(): SpeechListener<"start"> | null;
    set onend(listener: SpeechListener<"end"> | null);
    get onend(): SpeechListener<"end"> | null;
    set onerror(listener: SpeechListener<"error"> | null);
    get onerror(): SpeechListener<"error"> | null;
    _setListeners(key: string, listenerFn: SpeechListener<any> | null, existingListener: SpeechListener<any> | null): void;
    set onresult(listener: SpeechListener<"result"> | null);
    get onresult(): SpeechListener<"result"> | null;
    set onnomatch(listener: SpeechListener<"nomatch"> | null);
    get onnomatch(): SpeechListener<"nomatch"> | null;
    set onspeechstart(listener: SpeechListener<"speechstart"> | null);
    get onspeechstart(): SpeechListener<"speechstart"> | null;
    set onspeechend(listener: SpeechListener<"speechend"> | null);
    get onspeechend(): SpeechListener<"speechend"> | null;
    set onaudiostart(listener: SpeechListener<"audiostart"> | null);
    get onaudiostart(): SpeechListener<"audiostart"> | null;
    set onaudioend(listener: SpeechListener<"audioend"> | null);
    get onaudioend(): SpeechListener<"audioend"> | null;
    onsoundend: ((ev: any) => any) | null;
    onsoundstart: ((ev: any) => any) | null;
    addEventListener(type: string, listener: SpeechListener<any>, options?: boolean | {
        once?: boolean;
    }): void;
    removeEventListener(type: string, listener: (ev: any) => any, _options?: boolean | EventListenerOptions): void;
    dispatchEvent(_event: any): boolean;
}
export declare class RNWebSpeechGrammarList {
    #private;
    get length(): number;
    [index: number]: any;
    addFromURI(_src: string, _weight?: number): void;
    item(index: number): RNWebSpeechGrammar;
    addFromString: (grammar: string, weight?: number) => void;
}
export declare class RNWebSpeechGrammar {
    src: string;
    weight: number;
    constructor(src: string, weight?: number);
}
export {};
//# sourceMappingURL=RNWebSpeechRecognition.d.ts.map