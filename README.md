# rn-speech-recognition

Speech Recognition for React Native (pure, no Expo required).

Implements iOS [`SFSpeechRecognizer`](https://developer.apple.com/documentation/speech/sfspeechrecognizer) and Android [`SpeechRecognizer`](https://developer.android.com/reference/android/speech/SpeechRecognizer) with the goal of code reuse across platforms.

## Table of Contents

- [Installation](#installation)
  - [iOS Setup](#ios-setup)
  - [Android Setup](#android-setup)
- [Usage](#usage)
  - [Using Hooks](#using-hooks)
  - [Permissions](#permissions)
  - [Direct Module API](#direct-module-api)
- [Speech Recognition Events](#speech-recognition-events)
- [Handling Errors](#handling-errors)
- [Persisting Audio Recordings](#persisting-audio-recordings)
- [Transcribing Audio Files](#transcribing-audio-files)
- [Volume Metering](#volume-metering)
- [Polyfilling the Web SpeechRecognition API](#polyfilling-the-web-speechrecognition-api)
- [Muting the Beep Sound on Android](#muting-the-beep-sound-on-android)
- [Improving Accuracy of Single-Word Prompts](#improving-accuracy-of-single-word-prompts)
- [Language Detection](#language-detection)
- [Platform Compatibility Table](#platform-compatibility-table)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)

## Installation

```bash
npm install rn-speech-recognition
# or
yarn add rn-speech-recognition
```

### iOS Setup

1. Run `pod install` in your `ios/` directory:

```bash
cd ios && pod install && cd ..
```

2. Add the following keys to your `ios/<YourApp>/Info.plist`:

```xml
<key>NSSpeechRecognitionUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use speech recognition.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use the microphone.</string>
```

### Android Setup

1. Add the `RECORD_AUDIO` permission to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <uses-permission android:name="android.permission.RECORD_AUDIO" />

  <!-- Required for speech recognition service discovery -->
  <queries>
    <package android:name="com.google.android.googlequicksearchbox" />
    <intent>
      <action android:name="android.speech.RecognitionService" />
    </intent>
  </queries>

  <application ...>
    ...
  </application>
</manifest>
```

2. Register the package in `MainApplication.java` or `MainApplication.kt`:

**Kotlin** (`android/app/src/main/java/.../MainApplication.kt`):
```kotlin
import com.duysolo.speechrecognition.RNSpeechRecognitionPackage

// Inside getPackages():
override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        add(RNSpeechRecognitionPackage())
    }
```

**Java** (`android/app/src/main/java/.../MainApplication.java`):
```java
import com.duysolo.speechrecognition.RNSpeechRecognitionPackage;

// Inside getPackages():
@Override
protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new RNSpeechRecognitionPackage());
    return packages;
}
```

> **Note:** If you're using React Native 0.73+ with autolinking, the package should be linked automatically and step 2 may not be needed.

## Usage

### Using Hooks

The `useSpeechRecognitionEvent` hook is the easiest way to get started:

```tsx
import { useState } from "react";
import { View, Button, ScrollView, Text } from "react-native";
import {
  RNSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "rn-speech-recognition";

function App() {
  const [recognizing, setRecognizing] = useState(false);
  const [transcript, setTranscript] = useState("");

  useSpeechRecognitionEvent("start", () => setRecognizing(true));
  useSpeechRecognitionEvent("end", () => setRecognizing(false));
  useSpeechRecognitionEvent("result", (event) => {
    setTranscript(event.results[0]?.transcript);
  });
  useSpeechRecognitionEvent("error", (event) => {
    console.log("error code:", event.error, "error message:", event.message);
  });

  const handleStart = async () => {
    const result = await RNSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      console.warn("Permissions not granted", result);
      return;
    }
    RNSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
    });
  };

  return (
    <View>
      {!recognizing ? (
        <Button title="Start" onPress={handleStart} />
      ) : (
        <Button title="Stop" onPress={() => RNSpeechRecognitionModule.stop()} />
      )}
      <ScrollView>
        <Text>{transcript}</Text>
      </ScrollView>
    </View>
  );
}
```

### Permissions

Request permissions before starting recognition. If the user has denied permissions, expect an `error` event with code `not-allowed`.

```ts
import { RNSpeechRecognitionModule } from "rn-speech-recognition";

// Check current permissions
RNSpeechRecognitionModule.getPermissionsAsync().then((result) => {
  console.log("Status:", result.status);   // "granted" | "denied" | "undetermined"
  console.log("Granted:", result.granted); // true | false
});

// Request permissions
RNSpeechRecognitionModule.requestPermissionsAsync().then((result) => {
  if (!result.granted) {
    console.warn("Permissions not granted", result);
    return;
  }
  // Ready to start recognition
  RNSpeechRecognitionModule.start({ lang: "en-US" });
});
```

### Direct Module API

You can use `RNSpeechRecognitionModule` directly with event listeners:

```ts
import {
  RNSpeechRecognitionModule,
  AudioEncodingAndroid,
} from "rn-speech-recognition";

// Register event listeners
const startListener = RNSpeechRecognitionModule.addListener("start", () => {
  console.log("Speech recognition started");
});

const resultListener = RNSpeechRecognitionModule.addListener("result", (event) => {
  console.log("results:", event.results, "final:", event.isFinal);
});

const errorListener = RNSpeechRecognitionModule.addListener("error", (event) => {
  console.log("error code:", event.error, "error message:", event.message);
});

// Remove listeners when done
startListener.remove();
resultListener.remove();
errorListener.remove();

// Start speech recognition
RNSpeechRecognitionModule.start({
  lang: "en-US",
  interimResults: true,
  maxAlternatives: 1,
  continuous: true,
  requiresOnDeviceRecognition: false,
  addsPunctuation: false,
  contextualStrings: ["Carlsen", "Nepomniachtchi", "Praggnanandhaa"],
  // Android-specific options
  androidIntentOptions: {
    EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 10000,
    EXTRA_MASK_OFFENSIVE_WORDS: false,
  },
  androidRecognitionServicePackage: "com.google.android.tts",
  // iOS-specific options
  iosTaskHint: "unspecified",
  iosCategory: {
    category: "playAndRecord",
    categoryOptions: ["defaultToSpeaker", "allowBluetooth"],
    mode: "measurement",
  },
  iosVoiceProcessingEnabled: true,
  // Recording options (Android 13+ and iOS)
  recordingOptions: {
    persist: false,
    outputDirectory: undefined,
    outputFileName: "recording.wav",
    outputSampleRate: undefined,
    outputEncoding: undefined,
  },
  // File-based transcription
  audioSource: {
    uri: undefined,
    audioChannels: 1,
    audioEncoding: AudioEncodingAndroid.ENCODING_PCM_16BIT,
    sampleRate: 16000,
    chunkDelayMillis: undefined,
  },
  // Volume metering
  volumeChangeEventOptions: {
    enabled: false,
    intervalMillis: 300,
  },
});

// Stop (returns final result)
RNSpeechRecognitionModule.stop();

// Abort (immediately cancels, no final result)
RNSpeechRecognitionModule.abort();
```

## Speech Recognition Events

Events are based on the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).

| Event Name          | Description                                                                         | Notes                                                                  |
| ------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `audiostart`        | Audio capturing has started                                                         | Includes `uri` if `recordingOptions.persist` is enabled                |
| `audioend`          | Audio capturing has ended                                                           | Includes `uri` if `recordingOptions.persist` is enabled                |
| `end`               | Speech recognition service has disconnected                                         | Always the last event dispatched                                       |
| `error`             | A speech recognition error occurred                                                 | Also emitted with code `"aborted"` when calling `.abort()`            |
| `nomatch`           | Final result with no significant recognition                                        |                                                                        |
| `result`            | A word or phrase has been positively recognized                                     | `isFinal: true` for final results, `false` for interim               |
| `speechstart`       | Sound detected (recognizable speech or not)                                         |                                                                        |
| `speechend`         | Speech has stopped being detected                                                   |                                                                        |
| `start`             | Speech recognition has started                                                      | Use this to indicate to the user when to speak                         |
| `volumechange`      | Input volume changed                                                                | Value between -2 and 10. Enable via `volumeChangeEventOptions`        |
| `languagedetection` | Language detection results available                                                | Android 14+ with `com.google.android.as` only                         |

## Handling Errors

```ts
import {
  RNSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  SpeechRecognizerErrorAndroid,
} from "rn-speech-recognition";

useSpeechRecognitionEvent("error", (event) => {
  console.log("error code:", event.error, "error message:", event.message);

  // Android: access native error code
  if (event.code === SpeechRecognizerErrorAndroid.ERROR_NETWORK_TIMEOUT) {
    // handle network timeout
  }
});
```

| Error Code               | Description                                                       |
| ------------------------ | ----------------------------------------------------------------- |
| `aborted`                | User called `RNSpeechRecognitionModule.abort()`                   |
| `audio-capture`          | Audio recording error                                             |
| `interrupted`            | (iOS) Audio session interrupted (phone call, Siri, alarm)         |
| `language-not-supported` | Locale is not supported by the speech recognizer                  |
| `network`                | Network communication failed                                      |
| `no-speech`              | No final speech was detected                                      |
| `not-allowed`            | Permission to use speech recognition or microphone not granted    |
| `service-not-allowed`    | Recognizer is unavailable                                         |
| `busy`                   | Recognizer is busy                                                |
| `client`                 | (Android) Unknown client-side error                               |
| `speech-timeout`         | (Android) No speech input                                         |

## Persisting Audio Recordings

Enable `recordingOptions.persist` to save recognized audio to a file. Available on Android 13+ and iOS.

```tsx
import {
  RNSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "rn-speech-recognition";

RNSpeechRecognitionModule.start({
  lang: "en-US",
  recordingOptions: {
    persist: true,
    outputFileName: "recording.wav",
    // Optional:
    outputDirectory: "/path/to/directory",
    outputSampleRate: 16000,        // iOS only
    outputEncoding: "pcmFormatInt16", // iOS only
  },
});

useSpeechRecognitionEvent("audioend", (event) => {
  console.log("Recording saved to:", event.uri);
});
```

| Platform | Output Format                             |
| -------- | ----------------------------------------- |
| Android  | Linear PCM (16000 Hz, mono)               |
| iOS      | 32-bit Float PCM (44100/48000 Hz, mono)   |

## Transcribing Audio Files

Transcribe from local audio files instead of the microphone. Available on Android 13+ and iOS.

```tsx
import { Platform } from "react-native";
import {
  RNSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  AudioEncodingAndroid,
} from "rn-speech-recognition";

RNSpeechRecognitionModule.start({
  lang: "en-US",
  interimResults: true,
  requiresOnDeviceRecognition: Platform.OS === "ios",
  audioSource: {
    uri: "file:///path/to/audio.wav",
    audioChannels: 1,                                    // Android only
    audioEncoding: AudioEncodingAndroid.ENCODING_PCM_16BIT, // Android only
    sampleRate: 16000,                                   // Android only
  },
});

useSpeechRecognitionEvent("result", (event) => {
  console.log(event.results[0]?.transcript);
});
```

Supported formats: WAV (16000hz PCM 16-bit mono), MP3 (16000hz), OGG Vorbis (Android).

## Volume Metering

```tsx
import {
  RNSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "rn-speech-recognition";

useSpeechRecognitionEvent("volumechange", (event) => {
  console.log("Volume:", event.value); // -2 to 10, <= 0 is inaudible
});

RNSpeechRecognitionModule.start({
  lang: "en-US",
  volumeChangeEventOptions: {
    enabled: true,
    intervalMillis: 300,
  },
});
```

## Polyfilling the Web SpeechRecognition API

For projects that rely on third-party libraries using the Web Speech API:

```ts
import { RNWebSpeechRecognition } from "rn-speech-recognition";

// Polyfill the global
globalThis.SpeechRecognition = RNWebSpeechRecognition;

// Usage is the same as the Web Speech API
const recognition = new RNWebSpeechRecognition();
recognition.lang = "en-US";
recognition.interimResults = true;
recognition.continuous = true;

// Extended properties (non-web)
recognition.contextualStrings = ["Carlsen", "Nepomniachtchi"];
recognition.requiresOnDeviceRecognition = true;
recognition.addsPunctuation = true;

recognition.onresult = (event) => {
  console.log("result:", event.results[event.resultIndex][0].transcript);
};

recognition.start();
```

## Muting the Beep Sound on Android

On Android 13+, you can suppress the beep sound by enabling continuous recognition or audio recording:

```ts
RNSpeechRecognitionModule.start({
  lang: "en-US",
  continuous: true,
  // or:
  // recordingOptions: { persist: true },
});
```

## Improving Accuracy of Single-Word Prompts

- **iOS**: Use `iosTaskHint: "confirmation"`
- **Android**: Use `androidIntentOptions: { EXTRA_LANGUAGE_MODEL: "web_search" }`
- **Both**: Consider using on-device recognition
- **Alternative**: Record audio and send to an external transcription service

## Language Detection

Android 14+ with `com.google.android.as` only:

```tsx
import {
  RNSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "rn-speech-recognition";

useSpeechRecognitionEvent("languagedetection", (event) => {
  console.log("Detected:", event.detectedLanguage);  // e.g. "en-us"
  console.log("Confidence:", event.confidence);       // 0.0 - 1.0
});

RNSpeechRecognitionModule.start({
  androidIntentOptions: {
    EXTRA_ENABLE_LANGUAGE_DETECTION: true,
    EXTRA_ENABLE_LANGUAGE_SWITCH: true,
  },
  androidRecognitionServicePackage: "com.google.android.as",
});
```

## Platform Compatibility Table

| Feature                      | Android 12- | Android 13 | Android 14+ | iOS 17+ |
| ---------------------------- | ----------- | ---------- | ----------- | ------- |
| Basic Speech Recognition     | yes         | yes        | yes         | yes     |
| Continuous Recognition       | no          | yes        | yes         | yes     |
| Interim Results              | yes         | yes        | yes         | yes     |
| On-Device Recognition        | no          | yes        | yes         | yes     |
| Audio Recording              | no          | yes        | yes         | yes     |
| Audio File Transcription     | no          | yes        | yes         | yes     |
| Volume Metering              | yes         | yes        | yes         | yes     |
| Voice Processing             | no          | no         | no          | yes     |
| Contextual Strings           | yes         | yes        | yes         | yes     |
| Punctuation                  | no          | yes\*      | yes\*       | yes     |
| Language Detection           | no          | no         | yes\*       | no      |
| Word Confidence & Timing     | no          | no         | yes\*       | yes     |

\* Android: only with on-device recognition enabled.

## Troubleshooting

### Speaker feedback picked up by microphone

Enable `iosVoiceProcessingEnabled: true` when starting recognition (iOS only).

### Android: Speech recognition unavailable

- **Android 13+**: Check that [Speech Recognition & Synthesis](https://play.google.com/store/apps/details?id=com.google.android.tts) (`com.google.android.tts`) is installed and enabled.
- **Android 12-**: Check that the [Google app](https://play.google.com/store/apps/details?id=com.google.android.googlequicksearchbox) is installed and enabled.
- Use `getSpeechRecognitionServices()` and `getDefaultRecognitionService()` to debug.

### Android: On-device recognition not working

1. Call `getSupportedLocales()` to check installed locales.
2. Call `androidTriggerOfflineModelDownload({ locale: "en-US" })` to download the model.
3. Verify in Settings > Android System Intelligence > On-device speech recognition.

### iOS: Permission issues

- If using on-device recognition, you only need microphone permissions. Use `requestMicrophonePermissionsAsync()`.
- Check if Content & Privacy Restrictions restrict Speech Recognition (Settings > Screen Time).
- Check for MDM profiles (Settings > General > VPN & Device Management).

### iOS: Audio session conflicts

For multimedia apps, manage the audio session with:

```ts
// Check current state
RNSpeechRecognitionModule.getAudioSessionCategoryAndOptionsIOS();

// Configure before starting
RNSpeechRecognitionModule.start({
  iosCategory: {
    category: "playAndRecord",
    categoryOptions: ["defaultToSpeaker", "allowBluetooth"],
    mode: "measurement",
  },
});

// Or set independently
RNSpeechRecognitionModule.setCategoryIOS({
  category: "playAndRecord",
  categoryOptions: ["defaultToSpeaker", "allowBluetooth"],
  mode: "default",
});
```

## API Reference

### `start(options)`

Starts speech recognition. See [Direct Module API](#direct-module-api) for all available options.

### `stop()`

Stops recognition and returns a final result via the `result` event.

### `abort()`

Immediately cancels recognition. Emits `error` with code `"aborted"` then `end`.

### `requestPermissionsAsync()`

Requests microphone + speech recognizer permissions (iOS) or `RECORD_AUDIO` permission (Android).

### `getPermissionsAsync()`

Returns current permission status.

### `requestMicrophonePermissionsAsync()`

Requests microphone-only permission. Useful for on-device recognition on iOS.

### `requestSpeechRecognizerPermissionsAsync()` (iOS only)

Requests speech recognizer permission for network-based recognition.

### `getMicrophonePermissionsAsync()`

Returns microphone permission status.

### `getSpeechRecognizerPermissionsAsync()` (iOS only)

Returns speech recognizer permission status.

### `getStateAsync()`

Returns current state: `"inactive"` | `"starting"` | `"stopping"` | `"recognizing"`.

### `getSupportedLocales(options?)`

Returns supported and installed locales. Not supported on Android 12-.

```ts
const { locales, installedLocales } = await RNSpeechRecognitionModule.getSupportedLocales({
  androidRecognitionServicePackage: "com.google.android.as", // optional
});
```

### `getSpeechRecognitionServices()` (Android only)

Returns available speech recognition service package names.

### `getDefaultRecognitionService()` (Android only)

Returns `{ packageName: string }` of the default recognition service.

### `getAssistantService()` (Android only)

Returns `{ packageName: string }` of the default assistant service.

### `isRecognitionAvailable()`

Returns `boolean` whether speech recognition is available.

### `supportsOnDeviceRecognition()`

Returns `boolean` whether on-device recognition is supported.

### `supportsRecording()`

Returns `boolean` whether audio recording during recognition is supported.

### `androidTriggerOfflineModelDownload(options)`

Downloads offline speech model for a locale. Android 13+ only.

```ts
const result = await RNSpeechRecognitionModule.androidTriggerOfflineModelDownload({
  locale: "en-US",
});
// result.status: "download_success" | "opened_dialog" | "download_canceled"
```

### `setCategoryIOS(options)` (iOS only)

Sets the AVAudioSession category, options, and mode.

```ts
import {
  RNSpeechRecognitionModule,
  AVAudioSessionCategory,
  AVAudioSessionCategoryOptions,
  AVAudioSessionMode,
} from "rn-speech-recognition";

RNSpeechRecognitionModule.setCategoryIOS({
  category: AVAudioSessionCategory.playAndRecord,
  categoryOptions: [
    AVAudioSessionCategoryOptions.defaultToSpeaker,
    AVAudioSessionCategoryOptions.allowBluetooth,
  ],
  mode: AVAudioSessionMode.default,
});
```

### `getAudioSessionCategoryAndOptionsIOS()` (iOS only)

Returns current audio session `{ category, categoryOptions, mode }`.

### `setAudioSessionActiveIOS(value, options?)` (iOS only)

Sets the audio session active state.

```ts
RNSpeechRecognitionModule.setAudioSessionActiveIOS(true, {
  notifyOthersOnDeactivation: true,
});
```

## License

MIT
