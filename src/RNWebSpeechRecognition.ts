import { RNSpeechRecognitionModule } from "./RNSpeechRecognitionModule";
import type {
  RNSpeechRecognitionNativeEventMap,
  RNSpeechRecognitionOptions,
} from "./RNSpeechRecognitionModule.types";

// Minimal DOM type stubs for React Native environment
type EventTarget = any;
type EventListenerOptions = { capture?: boolean };

const noop = () => {};

const createEventData = (target: EventTarget) => ({
  AT_TARGET: 2 as const,
  bubbles: false,
  BUBBLING_PHASE: 3 as const,
  cancelable: false,
  CAPTURING_PHASE: 1 as const,
  composed: false,
  composedPath: () => [],
  currentTarget: target,
  defaultPrevented: false,
  eventPhase: 0,
  isTrusted: true,
  NONE: 0 as const,
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

type EventSubscription = { remove(): void };

type NativeEventAndListener<
  TEventName extends keyof RNSpeechRecognitionNativeEventMap,
> = {
  eventName: TEventName;
  nativeListener: (
    nativeEvent: RNSpeechRecognitionNativeEventMap[TEventName],
  ) => void;
};

type SpeechListener<K extends string> = (ev: any) => any;

function stubEvent<K extends keyof RNSpeechRecognitionNativeEventMap>(
  eventName: K,
  instance: RNWebSpeechRecognition,
  listener: (ev: any) => unknown,
): NativeEventAndListener<K> {
  return {
    eventName,
    nativeListener: (_nativeEvent) =>
      listener.call(instance, createEventData(instance as any)),
  };
}

const WebListenerTransformers: {
  [K in string]?: (
    instance: RNWebSpeechRecognition,
    listener: (ev: any) => unknown,
  ) => NativeEventAndListener<any>;
} = {
  audiostart: (instance, listener) => ({
    eventName: "audiostart" as const,
    nativeListener(nativeEvent: any) {
      listener.call(instance, {
        ...createEventData(instance as any),
        uri: nativeEvent.uri,
      });
    },
  }),
  audioend: (instance, listener) => ({
    eventName: "audioend" as const,
    nativeListener(nativeEvent: any) {
      listener.call(instance, {
        ...createEventData(instance as any),
        uri: nativeEvent.uri,
      });
    },
  }),
  nomatch: (instance, listener) =>
    stubEvent("nomatch", instance, listener),
  end: (instance, listener) =>
    stubEvent("end", instance, listener),
  start: (instance, listener) => ({
    eventName: "start" as const,
    nativeListener() {
      listener.call(instance, createEventData(instance as any));
    },
  }),
  error: (instance, listener) => ({
    eventName: "error" as const,
    nativeListener: (nativeEvent: RNSpeechRecognitionNativeEventMap["error"]) => {
      const clientEvent = {
        ...createEventData(instance as any),
        error: nativeEvent.error,
        message: nativeEvent.message,
      };
      listener.call(instance, clientEvent);
    },
  }),
  result: (instance, listener) => ({
    eventName: "result" as const,
    nativeListener: (nativeEvent: RNSpeechRecognitionNativeEventMap["result"]) => {
      if (!instance.interimResults && !nativeEvent.isFinal) {
        return;
      }
      const alternatives = nativeEvent.results.map(
        (result) =>
          new RNSpeechRecognitionAlternative(result.confidence, result.transcript),
      );
      const clientEvent = {
        ...createEventData(instance as any),
        results: new RNSpeechRecognitionResultList([
          new RNSpeechRecognitionResultItem(nativeEvent.isFinal, alternatives),
        ]),
      };
      listener.call(instance, clientEvent);
    },
  }),
};

export class RNWebSpeechRecognition {
  lang = "en-US";
  grammars: any = new RNWebSpeechGrammarList();
  maxAlternatives = 1;
  continuous = false;

  #interimResults = false;

  get interimResults(): boolean {
    return this.#interimResults;
  }

  set interimResults(interimResults: boolean) {
    this.#interimResults = interimResults;
  }

  contextualStrings?: string[] = undefined;
  requiresOnDeviceRecognition = false;
  addsPunctuation = false;
  androidIntentOptions?: RNSpeechRecognitionOptions["androidIntentOptions"];
  audioSource?: RNSpeechRecognitionOptions["audioSource"];
  recordingOptions?: RNSpeechRecognitionOptions["recordingOptions"];
  androidIntent?: RNSpeechRecognitionOptions["androidIntent"] = undefined;
  iosTaskHint?: RNSpeechRecognitionOptions["iosTaskHint"] = undefined;
  iosCategory?: RNSpeechRecognitionOptions["iosCategory"] = undefined;
  androidRecognitionServicePackage?: RNSpeechRecognitionOptions["androidRecognitionServicePackage"];

  #subscriptionMap: Map<Function, EventSubscription[]> = new Map();

  start() {
    RNSpeechRecognitionModule.requestPermissionsAsync().then(() => {
      RNSpeechRecognitionModule.start({
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
    RNSpeechRecognitionModule.stop();
  }

  abort() {
    RNSpeechRecognitionModule.abort();
  }

  #onstart: SpeechListener<"start"> | null = null;
  set onstart(listener: SpeechListener<"start"> | null) {
    this._setListeners("start", listener, this.#onstart);
    this.#onstart = listener;
  }
  get onstart() { return this.#onstart; }

  #onend: SpeechListener<"end"> | null = null;
  set onend(listener: SpeechListener<"end"> | null) {
    this._setListeners("end", (ev: any) => listener?.call(this, ev), this.#onend);
    this.#onend = listener;
  }
  get onend() { return this.#onend; }

  #onerror: SpeechListener<"error"> | null = null;
  set onerror(listener: SpeechListener<"error"> | null) {
    this._setListeners("error", listener, this.#onerror);
    this.#onerror = listener;
  }
  get onerror() { return this.#onerror; }

  _setListeners(
    key: string,
    listenerFn: SpeechListener<any> | null,
    existingListener: SpeechListener<any> | null,
  ) {
    if (existingListener) {
      this.removeEventListener(key, existingListener);
    }
    if (listenerFn) {
      this.addEventListener(key, listenerFn);
    }
  }

  #onresult: SpeechListener<"result"> | null = null;
  set onresult(listener: SpeechListener<"result"> | null) {
    this._setListeners("result", listener, this.#onresult);
    this.#onresult = listener;
  }
  get onresult() { return this.#onresult; }

  #onnomatch: SpeechListener<"nomatch"> | null = null;
  set onnomatch(listener: SpeechListener<"nomatch"> | null) {
    this._setListeners("nomatch", listener, this.#onnomatch);
    this.#onnomatch = listener;
  }
  get onnomatch() { return this.#onnomatch; }

  #onspeechstart: SpeechListener<"speechstart"> | null = null;
  set onspeechstart(listener: SpeechListener<"speechstart"> | null) {
    this._setListeners("speechstart", listener, this.#onspeechstart);
    this.#onspeechstart = listener;
  }
  get onspeechstart() { return this.#onspeechstart; }

  #onspeechend: SpeechListener<"speechend"> | null = null;
  set onspeechend(listener: SpeechListener<"speechend"> | null) {
    this._setListeners("speechend", listener, this.#onspeechend);
    this.#onspeechend = listener;
  }
  get onspeechend() { return this.#onspeechend; }

  #onaudiostart: SpeechListener<"audiostart"> | null = null;
  set onaudiostart(listener: SpeechListener<"audiostart"> | null) {
    this._setListeners("audiostart", listener, this.#onaudiostart);
    this.#onaudiostart = listener;
  }
  get onaudiostart() { return this.#onaudiostart; }

  #onaudioend: SpeechListener<"audioend"> | null = null;
  set onaudioend(listener: SpeechListener<"audioend"> | null) {
    this._setListeners("audioend", listener, this.#onaudioend);
    this.#onaudioend = listener;
  }
  get onaudioend() { return this.#onaudioend; }

  onsoundend: ((ev: any) => any) | null = null;
  onsoundstart: ((ev: any) => any) | null = null;

  addEventListener(
    type: string,
    listener: SpeechListener<any>,
    options?: boolean | { once?: boolean },
  ): void {
    const once = typeof options === "object" && options.once;

    const wrappedListener = once
      ? ((ev: any) => {
          listener.call(this, ev);
          for (const sub of this.#subscriptionMap.get(listener) ?? []) {
            sub.remove();
          }
          this.#subscriptionMap.delete(listener);
        })
      : listener;

    const enhancedEvent: NativeEventAndListener<any> =
      (WebListenerTransformers[type] as any)?.(this, wrappedListener) ??
      stubEvent(type as any, this, wrappedListener);

    const subscription = RNSpeechRecognitionModule.addListener(
      enhancedEvent.eventName,
      enhancedEvent.nativeListener,
    );

    this.#subscriptionMap.set(listener, [subscription]);
  }

  removeEventListener(
    type: string,
    listener: (ev: any) => any,
    _options?: boolean | EventListenerOptions,
  ): void {
    const subscriptions = this.#subscriptionMap.get(listener);
    if (subscriptions) {
      for (const subscription of subscriptions) {
        subscription.remove();
      }
      this.#subscriptionMap.delete(listener);
    }
  }

  dispatchEvent(_event: any): boolean {
    throw new Error("Method not implemented.");
  }
}

export class RNWebSpeechGrammarList {
  get length() {
    return this.#grammars.length;
  }
  #grammars: RNWebSpeechGrammar[] = [];
  [index: number]: any;

  addFromURI(_src: string, _weight?: number): void {}

  item(index: number): RNWebSpeechGrammar {
    return this.#grammars[index];
  }

  addFromString = (grammar: string, weight?: number) => {
    this.#grammars.push(new RNWebSpeechGrammar(grammar, weight));
    this[this.length - 1] = this.#grammars[this.length - 1];
  };
}

export class RNWebSpeechGrammar {
  src = "";
  weight = 1;
  constructor(src: string, weight?: number) {
    this.src = src;
    this.weight = weight ?? 1;
  }
}

class RNSpeechRecognitionResultList {
  #results: RNSpeechRecognitionResultItem[] = [];
  length: number;

  item(index: number) {
    return this.#results[index];
  }
  [index: number]: RNSpeechRecognitionResultItem;

  constructor(results: RNSpeechRecognitionResultItem[]) {
    this.#results = results;
    this.length = results.length;
    for (let i = 0; i < this.#results.length; i++) {
      this[i] = this.#results[i];
    }
  }
}

class RNSpeechRecognitionResultItem {
  #alternatives: RNSpeechRecognitionAlternative[] = [];
  readonly isFinal: boolean;
  length: number;

  item(index: number) {
    return this.#alternatives[index];
  }
  [index: number]: RNSpeechRecognitionAlternative;

  constructor(isFinal: boolean, alternatives: RNSpeechRecognitionAlternative[]) {
    this.isFinal = isFinal;
    this.length = alternatives.length;
    this.#alternatives = alternatives;
    for (let i = 0; i < alternatives.length; i++) {
      this[i] = alternatives[i];
    }
  }
}

class RNSpeechRecognitionAlternative {
  confidence: number;
  transcript: string;
  constructor(confidence: number, transcript: string) {
    this.confidence = confidence;
    this.transcript = transcript;
  }
}
