package com.duysolo.speechrecognition

import android.media.AudioFormat
import android.speech.RecognizerIntent
import com.facebook.react.bridge.ReadableMap

class SpeechRecognitionOptions(
    val interimResults: Boolean = false,
    val lang: String = "en-US",
    val continuous: Boolean = false,
    val maxAlternatives: Int = 5,
    val contextualStrings: List<String>? = null,
    val requiresOnDeviceRecognition: Boolean = false,
    val addsPunctuation: Boolean = false,
    val androidIntentOptions: Map<String, Any?>? = null,
    val androidRecognitionServicePackage: String? = null,
    val audioSource: AudioSourceOptions? = null,
    val recordingOptions: RecordingOptions? = null,
    val androidIntent: String? = RecognizerIntent.ACTION_RECOGNIZE_SPEECH,
    val iosTaskHint: String? = null,
    val iosCategory: Map<String, Any>? = null,
    val volumeChangeEventOptions: VolumeChangeEventOptions? = null,
    val iosVoiceProcessingEnabled: Boolean = false,
) {
    companion object {
        fun fromReadableMap(map: ReadableMap): SpeechRecognitionOptions {
            val contextualStrings = if (map.hasKey("contextualStrings")) {
                val arr = map.getArray("contextualStrings")
                (0 until (arr?.size() ?: 0)).mapNotNull { arr?.getString(it) }
            } else null

            val androidIntentOptions = if (map.hasKey("androidIntentOptions")) {
                map.getMap("androidIntentOptions")?.toHashMap()
            } else null

            val audioSource = if (map.hasKey("audioSource")) {
                map.getMap("audioSource")?.let { AudioSourceOptions.fromReadableMap(it) }
            } else null

            val recordingOptions = if (map.hasKey("recordingOptions")) {
                map.getMap("recordingOptions")?.let { RecordingOptions.fromReadableMap(it) }
            } else null

            val volumeChangeEventOptions = if (map.hasKey("volumeChangeEventOptions")) {
                map.getMap("volumeChangeEventOptions")?.let { VolumeChangeEventOptions.fromReadableMap(it) }
            } else null

            return SpeechRecognitionOptions(
                interimResults = if (map.hasKey("interimResults")) map.getBoolean("interimResults") else false,
                lang = if (map.hasKey("lang")) map.getString("lang") ?: "en-US" else "en-US",
                continuous = if (map.hasKey("continuous")) map.getBoolean("continuous") else false,
                maxAlternatives = if (map.hasKey("maxAlternatives")) map.getInt("maxAlternatives") else 5,
                contextualStrings = contextualStrings,
                requiresOnDeviceRecognition = if (map.hasKey("requiresOnDeviceRecognition")) map.getBoolean("requiresOnDeviceRecognition") else false,
                addsPunctuation = if (map.hasKey("addsPunctuation")) map.getBoolean("addsPunctuation") else false,
                androidIntentOptions = androidIntentOptions,
                androidRecognitionServicePackage = if (map.hasKey("androidRecognitionServicePackage")) map.getString("androidRecognitionServicePackage") else null,
                audioSource = audioSource,
                recordingOptions = recordingOptions,
                androidIntent = if (map.hasKey("androidIntent")) map.getString("androidIntent") else RecognizerIntent.ACTION_RECOGNIZE_SPEECH,
                iosTaskHint = if (map.hasKey("iosTaskHint")) map.getString("iosTaskHint") else null,
                volumeChangeEventOptions = volumeChangeEventOptions,
                iosVoiceProcessingEnabled = if (map.hasKey("iosVoiceProcessingEnabled")) map.getBoolean("iosVoiceProcessingEnabled") else false,
            )
        }
    }
}

class VolumeChangeEventOptions(
    val enabled: Boolean = false,
    val intervalMillis: Int? = null,
) {
    companion object {
        fun fromReadableMap(map: ReadableMap): VolumeChangeEventOptions {
            return VolumeChangeEventOptions(
                enabled = if (map.hasKey("enabled")) map.getBoolean("enabled") else false,
                intervalMillis = if (map.hasKey("intervalMillis")) map.getInt("intervalMillis") else null,
            )
        }
    }
}

class RecordingOptions(
    val persist: Boolean = false,
    val outputDirectory: String? = null,
    val outputFileName: String? = null,
    val outputSampleRate: Int? = null,
    val outputEncoding: String? = null,
) {
    companion object {
        fun fromReadableMap(map: ReadableMap): RecordingOptions {
            return RecordingOptions(
                persist = if (map.hasKey("persist")) map.getBoolean("persist") else false,
                outputDirectory = if (map.hasKey("outputDirectory")) map.getString("outputDirectory") else null,
                outputFileName = if (map.hasKey("outputFileName")) map.getString("outputFileName") else null,
                outputSampleRate = if (map.hasKey("outputSampleRate")) map.getInt("outputSampleRate") else null,
                outputEncoding = if (map.hasKey("outputEncoding")) map.getString("outputEncoding") else null,
            )
        }
    }
}

class AudioSourceOptions(
    val uri: String = "",
    val audioEncoding: Int = AudioFormat.ENCODING_PCM_16BIT,
    val sampleRate: Int = 16000,
    val audioChannels: Int = 1,
    val chunkDelayMillis: Long? = null,
) {
    companion object {
        fun fromReadableMap(map: ReadableMap): AudioSourceOptions {
            return AudioSourceOptions(
                uri = if (map.hasKey("uri")) map.getString("uri") ?: "" else "",
                audioEncoding = if (map.hasKey("audioEncoding")) map.getInt("audioEncoding") else AudioFormat.ENCODING_PCM_16BIT,
                sampleRate = if (map.hasKey("sampleRate")) map.getInt("sampleRate") else 16000,
                audioChannels = if (map.hasKey("audioChannels")) map.getInt("audioChannels") else 1,
                chunkDelayMillis = if (map.hasKey("chunkDelayMillis")) map.getInt("chunkDelayMillis").toLong() else null,
            )
        }
    }
}

class GetSupportedLocaleOptions(
    val androidRecognitionServicePackage: String? = null,
)

class TriggerOfflineModelDownloadOptions(
    val locale: String = "en-US",
)
