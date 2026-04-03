import { useEffect } from "react";
import { RNSpeechRecognitionModule } from "./RNSpeechRecognitionModule";
import type { RNSpeechRecognitionNativeEventMap } from "./RNSpeechRecognitionModule.types";

export function useSpeechRecognitionEvent<
  K extends keyof RNSpeechRecognitionNativeEventMap,
>(
  eventName: K,
  listener: (event: RNSpeechRecognitionNativeEventMap[K]) => void,
) {
  useEffect(() => {
    const subscription = RNSpeechRecognitionModule.addListener(
      eventName,
      listener,
    );
    return () => {
      subscription.remove();
    };
  }, [eventName, listener]);
}
