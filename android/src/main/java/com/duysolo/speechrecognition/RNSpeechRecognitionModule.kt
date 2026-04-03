package com.duysolo.speechrecognition

import android.Manifest.permission.RECORD_AUDIO
import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.provider.Settings
import android.speech.ModelDownloadListener
import android.speech.RecognitionService
import android.speech.RecognitionSupport
import android.speech.RecognitionSupportCallback
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.concurrent.Executors

private const val TAG = "RNSpeechRecognition"

class RNSpeechRecognitionModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val speechService by lazy {
        SpeechService(reactContext) { name, body ->
            val params: WritableMap = body?.let { mapToWritableMap(it) } ?: Arguments.createMap()
            try {
                sendEvent(name, params)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to send event: $name", e)
            }
        }
    }

    override fun getName(): String = "RNSpeechRecognition"

    override fun onCatalystInstanceDestroy() {
        speechService.destroy()
        super.onCatalystInstanceDestroy()
    }

    private fun sendEvent(name: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(name, params)
    }

    private fun mapToWritableMap(map: Map<String, Any?>): WritableMap {
        val writableMap = Arguments.createMap()
        for ((key, value) in map) {
            when (value) {
                null -> writableMap.putNull(key)
                is Boolean -> writableMap.putBoolean(key, value)
                is Int -> writableMap.putInt(key, value)
                is Double -> writableMap.putDouble(key, value)
                is Float -> writableMap.putDouble(key, value.toDouble())
                is String -> writableMap.putString(key, value)
                is Map<*, *> -> {
                    @Suppress("UNCHECKED_CAST")
                    writableMap.putMap(key, mapToWritableMap(value as Map<String, Any?>))
                }
                is List<*> -> {
                    val array = Arguments.createArray()
                    for (item in value) {
                        when (item) {
                            null -> array.pushNull()
                            is Boolean -> array.pushBoolean(item)
                            is Int -> array.pushInt(item)
                            is Double -> array.pushDouble(item)
                            is Float -> array.pushDouble(item.toDouble())
                            is String -> array.pushString(item)
                            is Map<*, *> -> {
                                @Suppress("UNCHECKED_CAST")
                                array.pushMap(mapToWritableMap(item as Map<String, Any?>))
                            }
                            else -> array.pushString(item.toString())
                        }
                    }
                    writableMap.putArray(key, array)
                }
                else -> writableMap.putString(key, value.toString())
            }
        }
        return writableMap
    }

    // MARK: - Permissions

    private fun hasNotGrantedRecordPermissions(): Boolean {
        return ContextCompat.checkSelfPermission(reactContext, RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED
    }

    @ReactMethod
    fun requestPermissionsAsync(promise: Promise) {
        if (!hasNotGrantedRecordPermissions()) {
            promise.resolve(buildPermissionResponse(true))
            return
        }
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.resolve(buildPermissionResponse(false))
            return
        }
        // Use PermissionAwareActivity for proper RN permission handling
        val permissionAwareActivity = activity as? com.facebook.react.modules.core.PermissionAwareActivity
        if (permissionAwareActivity != null) {
            permissionAwareActivity.requestPermissions(arrayOf(RECORD_AUDIO), 1) { requestCode, permissions, grantResults ->
                val granted = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
                promise.resolve(buildPermissionResponse(granted))
                return@requestPermissions true
            }
        } else {
            promise.resolve(buildPermissionResponse(false))
        }
    }

    @ReactMethod
    fun getPermissionsAsync(promise: Promise) {
        val granted = !hasNotGrantedRecordPermissions()
        promise.resolve(buildPermissionResponse(granted))
    }

    @ReactMethod
    fun requestMicrophonePermissionsAsync(promise: Promise) {
        requestPermissionsAsync(promise)
    }

    @ReactMethod
    fun getMicrophonePermissionsAsync(promise: Promise) {
        getPermissionsAsync(promise)
    }

    @ReactMethod
    fun getSpeechRecognizerPermissionsAsync(promise: Promise) {
        // Not needed on Android, always granted
        val result = Arguments.createMap()
        result.putString("status", "granted")
        result.putBoolean("granted", true)
        result.putBoolean("canAskAgain", false)
        result.putString("expires", "never")
        promise.resolve(result)
    }

    @ReactMethod
    fun requestSpeechRecognizerPermissionsAsync(promise: Promise) {
        getSpeechRecognizerPermissionsAsync(promise)
    }

    private fun buildPermissionResponse(granted: Boolean): WritableMap {
        val result = Arguments.createMap()
        result.putString("status", if (granted) "granted" else "denied")
        result.putBoolean("granted", granted)
        result.putBoolean("canAskAgain", !granted)
        result.putString("expires", "never")
        return result
    }

    // MARK: - State

    @ReactMethod
    fun getStateAsync(promise: Promise) {
        val state = when (speechService.recognitionState) {
            RecognitionState.INACTIVE -> "inactive"
            RecognitionState.STARTING -> "starting"
            RecognitionState.ACTIVE -> "recognizing"
            RecognitionState.STOPPING -> "stopping"
            else -> "inactive"
        }
        promise.resolve(state)
    }

    // MARK: - Start / Stop / Abort

    @ReactMethod
    fun start(optionsMap: ReadableMap) {
        val options = SpeechRecognitionOptions.fromReadableMap(optionsMap)
        if (hasNotGrantedRecordPermissions()) {
            sendEvent("error", mapToWritableMap(mapOf("error" to "not-allowed", "message" to "Missing RECORD_AUDIO permissions.", "code" to -1)))
            sendEvent("end", Arguments.createMap())
            return
        }
        speechService.start(options)
    }

    @ReactMethod
    fun stop() {
        speechService.stop()
    }

    @ReactMethod
    fun abort() {
        sendEvent("error", mapToWritableMap(mapOf("error" to "aborted", "message" to "Speech recognition aborted.", "code" to -1)))
        speechService.abort()
    }

    // MARK: - Services

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getSpeechRecognitionServices(): com.facebook.react.bridge.WritableArray {
        val packageManager = reactContext.packageManager
        val serviceNames = Arguments.createArray()
        val services = packageManager.queryIntentServices(Intent(RecognitionService.SERVICE_INTERFACE), 0)
        for (service in services) {
            serviceNames.pushString(service.serviceInfo.packageName)
        }
        return serviceNames
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getDefaultRecognitionService(): WritableMap {
        val result = Arguments.createMap()
        val defaultService = getDefaultVoiceRecognitionService()?.packageName ?: ""
        result.putString("packageName", defaultService)
        return result
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getAssistantService(): WritableMap {
        val result = Arguments.createMap()
        val assistantService = getDefaultAssistantService()?.packageName ?: ""
        result.putString("packageName", assistantService)
        return result
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun supportsOnDeviceRecognition(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            SpeechRecognizer.isOnDeviceRecognitionAvailable(reactContext)
        } else {
            false
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isRecognitionAvailable(): Boolean {
        return SpeechRecognizer.isRecognitionAvailable(reactContext)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun supportsRecording(): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
    }

    // MARK: - Audio Session (iOS stubs)

    @ReactMethod
    fun setCategoryIOS(options: ReadableMap) {
        // No-op on Android
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun getAudioSessionCategoryAndOptionsIOS(): WritableMap {
        val result = Arguments.createMap()
        result.putString("category", "playAndRecord")
        val options = Arguments.createArray()
        options.pushString("defaultToSpeaker")
        options.pushString("allowBluetooth")
        result.putArray("categoryOptions", options)
        result.putString("mode", "measurement")
        return result
    }

    @ReactMethod
    fun setAudioSessionActiveIOS(value: Boolean, options: ReadableMap?) {
        // No-op on Android
    }

    // MARK: - Supported Locales

    @ReactMethod
    fun getSupportedLocales(optionsMap: ReadableMap, promise: Promise) {
        val packageName = if (optionsMap.hasKey("androidRecognitionServicePackage")) {
            optionsMap.getString("androidRecognitionServicePackage")
        } else null
        getSupportedLocalesInternal(packageName, promise)
    }

    // MARK: - Offline Model Download

    @ReactMethod
    fun androidTriggerOfflineModelDownload(optionsMap: ReadableMap, promise: Promise) {
        val locale = if (optionsMap.hasKey("locale")) optionsMap.getString("locale") ?: "en-US" else "en-US"

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            promise.reject("not_supported", "Android version is too old to trigger offline model download.")
            return
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, locale)

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            Handler(reactContext.mainLooper).post {
                val recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(reactContext)
                recognizer.triggerModelDownload(intent)
            }
            val result = Arguments.createMap()
            result.putString("status", "opened_dialog")
            result.putString("message", "Opened the model download dialog.")
            promise.resolve(result)
            return
        }

        Handler(reactContext.mainLooper).post {
            val recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(reactContext)
            recognizer.triggerModelDownload(
                intent,
                Executors.newSingleThreadExecutor(),
                @SuppressLint("NewApi")
                object : ModelDownloadListener {
                    override fun onProgress(p0: Int) {}
                    override fun onSuccess() {
                        val result = Arguments.createMap()
                        result.putString("status", "download_success")
                        result.putString("message", "Offline model download completed successfully.")
                        promise.resolve(result)
                        recognizer.destroy()
                    }
                    override fun onScheduled() {
                        val result = Arguments.createMap()
                        result.putString("status", "download_canceled")
                        result.putString("message", "The offline model download was canceled.")
                        promise.resolve(result)
                    }
                    override fun onError(error: Int) {
                        promise.reject("error_$error", "Failed to download offline model with error: $error")
                        recognizer.destroy()
                    }
                }
            )
        }
    }

    // MARK: - Required for NativeEventEmitter
    @ReactMethod
    fun addListener(eventName: String) {
        // Keep: Required for RN built-in event emitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Keep: Required for RN built-in event emitter
    }

    // MARK: - Private helpers

    @RequiresApi(Build.VERSION_CODES.CUPCAKE)
    private fun getDefaultAssistantService(): ComponentName? {
        val contentResolver = reactContext.contentResolver ?: return null
        val defaultAssistant = Settings.Secure.getString(contentResolver, "assistant")
        if (defaultAssistant.isNullOrEmpty()) return null
        return ComponentName.unflattenFromString(defaultAssistant)
    }

    @RequiresApi(Build.VERSION_CODES.CUPCAKE)
    private fun getDefaultVoiceRecognitionService(): ComponentName? {
        val contentResolver = reactContext.contentResolver ?: return null
        val defaultVoiceRecognitionService = Settings.Secure.getString(contentResolver, "voice_recognition_service")
        if (defaultVoiceRecognitionService.isNullOrEmpty()) return null
        return ComponentName.unflattenFromString(defaultVoiceRecognitionService)
    }

    private fun getSupportedLocalesInternal(packageName: String?, promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
            val result = Arguments.createMap()
            result.putArray("locales", Arguments.createArray())
            result.putArray("installedLocales", Arguments.createArray())
            promise.resolve(result)
            return
        }

        if (packageName == null && !SpeechRecognizer.isOnDeviceRecognitionAvailable(reactContext)) {
            val result = Arguments.createMap()
            result.putArray("locales", Arguments.createArray())
            result.putArray("installedLocales", Arguments.createArray())
            promise.resolve(result)
            return
        }

        if (packageName != null && !SpeechRecognizer.isRecognitionAvailable(reactContext)) {
            val result = Arguments.createMap()
            result.putArray("locales", Arguments.createArray())
            result.putArray("installedLocales", Arguments.createArray())
            promise.resolve(result)
            return
        }

        var serviceComponent: ComponentName? = null
        try {
            if (packageName != null) {
                serviceComponent = SpeechService.findComponentNameByPackageName(reactContext, packageName)
            }
        } catch (e: Exception) {
            promise.reject("package_not_found", "Failed to retrieve recognition service package", e)
            return
        }

        var didResolve = false
        Handler(reactContext.mainLooper).post {
            val recognizer = if (serviceComponent != null) {
                SpeechRecognizer.createSpeechRecognizer(reactContext, serviceComponent)
            } else {
                SpeechRecognizer.createOnDeviceSpeechRecognizer(reactContext)
            }

            val recognizerIntent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
            recognizer?.checkRecognitionSupport(
                recognizerIntent,
                Executors.newSingleThreadExecutor(),
                @RequiresApi(Build.VERSION_CODES.TIRAMISU)
                object : RecognitionSupportCallback {
                    override fun onSupportResult(recognitionSupport: RecognitionSupport) {
                        if (didResolve) return
                        didResolve = true
                        val installedLocales = recognitionSupport.installedOnDeviceLanguages
                        val locales = recognitionSupport.supportedOnDeviceLanguages
                            .union(installedLocales)
                            .union(recognitionSupport.onlineLanguages)
                            .sorted()

                        val result = Arguments.createMap()
                        val localesArray = Arguments.createArray()
                        locales.forEach { localesArray.pushString(it) }
                        val installedArray = Arguments.createArray()
                        installedLocales.forEach { installedArray.pushString(it) }
                        result.putArray("locales", localesArray)
                        result.putArray("installedLocales", installedArray)
                        promise.resolve(result)
                        recognizer.destroy()
                    }

                    override fun onError(error: Int) {
                        Handler(reactContext.mainLooper).postDelayed({
                            if (didResolve) return@postDelayed
                            promise.reject("error_$error", "Failed to retrieve supported locales with error: $error")
                        }, 50)
                        recognizer.destroy()
                    }
                }
            )
        }
    }
}
