import AVFoundation
import Speech

struct Segment {
  let startTimeMillis: Double
  let endTimeMillis: Double
  let segment: String
  let confidence: Float

  func toDictionary() -> [String: Any] {
    return [
      "startTimeMillis": startTimeMillis,
      "endTimeMillis": endTimeMillis,
      "segment": segment,
      "confidence": confidence,
    ]
  }
}

struct TranscriptionResult {
  let transcript: String
  let confidence: Float
  let segments: [Segment]

  func toDictionary() -> [String: Any] {
    return [
      "transcript": transcript,
      "confidence": confidence,
      "segments": segments.map { $0.toDictionary() },
    ]
  }
}

@objc(RNSpeechRecognition)
class RNSpeechRecognitionModule: RCTEventEmitter {

  var speechRecognizer: SpeechRecognizer?
  var hasSeenFinalResult: Bool = false
  var previousResult: SFSpeechRecognitionResult?
  private var hasListeners = false

  override init() {
    super.init()
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    return [
      "audiostart", "audioend", "end", "error", "nomatch", "result",
      "soundstart", "soundend", "speechstart", "speechend", "start",
      "languagedetection", "volumechange"
    ]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  private func emit(_ name: String, _ body: Any? = nil) {
    if hasListeners {
      sendEvent(withName: name, body: body)
    }
  }

  override func invalidate() {
    Task {
      await speechRecognizer?.abort()
    }
    super.invalidate()
  }

  // MARK: - Permission Methods

  @objc func requestPermissionsAsync(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    SFSpeechRecognizer.requestAuthorization { speechStatus in
      if speechStatus != .authorized {
        resolve(self.buildPermissionResponse())
        return
      }
      AVAudioSession.sharedInstance().requestRecordPermission { _ in
        resolve(self.buildPermissionResponse())
      }
    }
  }

  @objc func getPermissionsAsync(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(buildPermissionResponse())
  }

  @objc func getMicrophonePermissionsAsync(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(buildMicPermissionResponse())
  }

  @objc func requestMicrophonePermissionsAsync(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    AVAudioSession.sharedInstance().requestRecordPermission { _ in
      resolve(self.buildMicPermissionResponse())
    }
  }

  @objc func getSpeechRecognizerPermissionsAsync(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve(buildSpeechPermissionResponse())
  }

  @objc func requestSpeechRecognizerPermissionsAsync(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    SFSpeechRecognizer.requestAuthorization { _ in
      resolve(self.buildSpeechPermissionResponse())
    }
  }

  private func buildPermissionResponse() -> [String: Any] {
    let recordPermission = AVAudioSession.sharedInstance().recordPermission
    let speechPermission = SFSpeechRecognizer.authorizationStatus()

    let status: String
    if speechPermission == .authorized && recordPermission == .granted {
      status = "granted"
    } else if speechPermission == .denied || recordPermission == .denied || speechPermission == .restricted {
      status = "denied"
    } else {
      status = "undetermined"
    }

    return [
      "status": status,
      "granted": status == "granted",
      "canAskAgain": status == "undetermined",
      "expires": "never",
      "restricted": speechPermission == .restricted,
    ]
  }

  private func buildMicPermissionResponse() -> [String: Any] {
    let recordPermission = AVAudioSession.sharedInstance().recordPermission
    let status: String
    if recordPermission == .granted {
      status = "granted"
    } else if recordPermission == .denied {
      status = "denied"
    } else {
      status = "undetermined"
    }
    return [
      "status": status,
      "granted": status == "granted",
      "canAskAgain": status == "undetermined",
      "expires": "never",
    ]
  }

  private func buildSpeechPermissionResponse() -> [String: Any] {
    let speechPermission = SFSpeechRecognizer.authorizationStatus()
    let status: String
    if speechPermission == .authorized {
      status = "granted"
    } else if speechPermission == .denied || speechPermission == .restricted {
      status = "denied"
    } else {
      status = "undetermined"
    }
    return [
      "status": status,
      "granted": status == "granted",
      "canAskAgain": status == "undetermined",
      "expires": "never",
      "restricted": speechPermission == .restricted,
    ]
  }

  // MARK: - State

  @objc func getStateAsync(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    Task {
      let state = await speechRecognizer?.getState()
      resolve(state ?? "inactive")
    }
  }

  // MARK: - Start / Stop / Abort

  @objc func start(_ optionsDict: NSDictionary) {
    let options = SpeechRecognitionOptions(from: optionsDict)

    Task {
      do {
        let currentLocale = await speechRecognizer?.getLocale()
        self.previousResult = nil

        if self.speechRecognizer == nil || currentLocale != options.lang {
          guard let locale = resolveLocale(localeIdentifier: options.lang) else {
            let availableLocales = SFSpeechRecognizer.supportedLocales().map { $0.identifier }.joined(separator: ", ")
            sendErrorAndStop(error: "language-not-supported", message: "Locale \(options.lang) is not supported. Available: \(availableLocales)")
            return
          }
          self.speechRecognizer = try await SpeechRecognizer(locale: locale)
        }

        if !options.requiresOnDeviceRecognition {
          guard await SFSpeechRecognizer.hasAuthorizationToRecognize() else {
            sendErrorAndStop(error: "not-allowed", message: RecognizerError.notAuthorizedToRecognize.message)
            return
          }
        }

        guard await AVAudioSession.sharedInstance().hasPermissionToRecord() else {
          sendErrorAndStop(error: "not-allowed", message: RecognizerError.notPermittedToRecord.message)
          return
        }

        await speechRecognizer?.start(
          options: options,
          resultHandler: { [weak self] result in
            self?.handleRecognitionResult(result, maxAlternatives: options.maxAlternatives)
          },
          errorHandler: { [weak self] error in
            self?.handleRecognitionError(error)
          },
          endHandler: { [weak self] in
            self?.handleEnd()
          },
          startHandler: { [weak self] in
            self?.emit("start")
          },
          speechStartHandler: { [weak self] in
            self?.emit("speechstart")
          },
          audioStartHandler: { [weak self] filePath in
            if let filePath: String {
              let uri = filePath.hasPrefix("file://") ? filePath : "file://" + filePath
              self?.emit("audiostart", ["uri": uri])
            } else {
              self?.emit("audiostart", ["uri": NSNull()])
            }
          },
          audioEndHandler: { [weak self] filePath in
            if let filePath: String {
              let uri = filePath.hasPrefix("file://") ? filePath : "file://" + filePath
              self?.emit("audioend", ["uri": uri])
            } else {
              self?.emit("audioend", ["uri": NSNull()])
            }
          },
          volumeChangeHandler: { [weak self] value in
            self?.emit("volumechange", ["value": value])
          }
        )
      } catch {
        self.emit("error", ["error": "not-allowed", "message": error.localizedDescription])
      }
    }
  }

  @objc func stop() {
    Task {
      if let recognizer = speechRecognizer {
        await recognizer.stop()
      } else {
        emit("end")
      }
    }
  }

  @objc func abort() {
    Task {
      emit("error", ["error": "aborted", "message": "Speech recognition aborted."])
      if let recognizer = speechRecognizer {
        await recognizer.abort()
      } else {
        emit("end")
      }
    }
  }

  // MARK: - Audio Session

  @objc func setCategoryIOS(_ optionsDict: NSDictionary) {
    let options = SetCategoryOptions(from: optionsDict)
    let categoryOptions = options.categoryOptions.reduce(AVAudioSession.CategoryOptions()) { result, option in
      result.union(option.avCategoryOption)
    }
    try? AVAudioSession.sharedInstance().setCategory(
      options.category.avCategory,
      mode: options.mode.avMode,
      options: categoryOptions
    )
  }

  @objc func getAudioSessionCategoryAndOptionsIOS() -> NSDictionary {
    let instance = AVAudioSession.sharedInstance()
    let categoryOptions: AVAudioSession.CategoryOptions = instance.categoryOptions

    var allCategoryOptions: [(option: AVAudioSession.CategoryOptions, string: String)] = [
      (.mixWithOthers, "mixWithOthers"),
      (.duckOthers, "duckOthers"),
      (.allowBluetooth, "allowBluetooth"),
      (.defaultToSpeaker, "defaultToSpeaker"),
      (.interruptSpokenAudioAndMixWithOthers, "interruptSpokenAudioAndMixWithOthers"),
      (.allowBluetoothA2DP, "allowBluetoothA2DP"),
      (.allowAirPlay, "allowAirPlay"),
    ]

    if #available(iOS 14.5, *) {
      allCategoryOptions.append((.overrideMutedMicrophoneInterruption, "overrideMutedMicrophoneInterruption"))
    }

    let categoryOptionsStrings = allCategoryOptions
      .filter { categoryOptions.contains($0.option) }
      .map { $0.string }

    let categoryMapping: [AVAudioSession.Category: String] = [
      .ambient: "ambient", .playback: "playback", .record: "record",
      .playAndRecord: "playAndRecord", .multiRoute: "multiRoute", .soloAmbient: "soloAmbient",
    ]

    let modeMapping: [AVAudioSession.Mode: String] = [
      .default: "default", .gameChat: "gameChat", .measurement: "measurement",
      .moviePlayback: "moviePlayback", .spokenAudio: "spokenAudio", .videoChat: "videoChat",
      .videoRecording: "videoRecording", .voiceChat: "voiceChat", .voicePrompt: "voicePrompt",
    ]

    return [
      "category": categoryMapping[instance.category] ?? instance.category.rawValue,
      "categoryOptions": categoryOptionsStrings,
      "mode": modeMapping[instance.mode] ?? instance.mode.rawValue,
    ] as NSDictionary
  }

  @objc func setAudioSessionActiveIOS(_ value: Bool, options: NSDictionary?) {
    let notifyOthers = options?["notifyOthersOnDeactivation"] as? Bool ?? true
    let setActiveOptions: AVAudioSession.SetActiveOptions = notifyOthers ? .notifyOthersOnDeactivation : []
    try? AVAudioSession.sharedInstance().setActive(value, options: setActiveOptions)
  }

  // MARK: - Sync methods

  @objc func supportsOnDeviceRecognition() -> NSNumber {
    let recognizer = SFSpeechRecognizer()
    return NSNumber(value: recognizer?.supportsOnDeviceRecognition ?? false)
  }

  @objc func supportsRecording() -> NSNumber {
    return NSNumber(value: true)
  }

  @objc func isRecognitionAvailable() -> NSNumber {
    let recognizer = SFSpeechRecognizer()
    return NSNumber(value: recognizer?.isAvailable ?? false)
  }

  @objc func getSpeechRecognitionServices() -> [String] {
    return []
  }

  @objc func getDefaultRecognitionService() -> NSDictionary {
    return ["packageName": ""]
  }

  @objc func getAssistantService() -> NSDictionary {
    return ["packageName": ""]
  }

  // MARK: - Supported Locales

  @objc func getSupportedLocales(_ options: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let supportedLocales = SFSpeechRecognizer.supportedLocales().map { $0.identifier }.sorted()
    resolve([
      "locales": supportedLocales,
      "installedLocales": supportedLocales,
    ])
  }

  // MARK: - Android stubs

  @objc func androidTriggerOfflineModelDownload(_ options: NSDictionary, resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    resolve([
      "status": "opened_dialog",
      "message": "Not supported on iOS.",
    ])
  }

  // MARK: - Helpers

  func resolveLocale(localeIdentifier: String) -> Locale? {
    let normalizedIdentifier = localeIdentifier.replacingOccurrences(of: "_", with: "-")
    let localesToCheck = [localeIdentifier, normalizedIdentifier]
    let supportedLocales = SFSpeechRecognizer.supportedLocales()
    for identifier in localesToCheck {
      if supportedLocales.contains(where: { $0.identifier == identifier }) {
        return Locale(identifier: identifier)
      }
    }
    return nil
  }

  func sendErrorAndStop(error: String, message: String) {
    hasSeenFinalResult = false
    previousResult = nil
    emit("error", ["error": error, "message": message])
    emit("end")
  }

  func handleEnd() {
    hasSeenFinalResult = false
    previousResult = nil
    emit("end")
  }

  func handleRecognitionResult(_ result: SFSpeechRecognitionResult, maxAlternatives: Int) {
    var results: [TranscriptionResult] = []
    let transcriptionSubsequence = result.transcriptions.prefix(maxAlternatives)
    var isFinal = result.isFinal

    if #available(iOS 18.0, *), !isFinal {
      isFinal = result.speechRecognitionMetadata?.speechDuration ?? 0 > 0
    }

    for transcription in transcriptionSubsequence {
      var transcript = transcription.formattedString
      if hasSeenFinalResult {
        transcript = " " + transcription.formattedString
      }

      let segments = transcription.segments.map { segment in
        return Segment(
          startTimeMillis: segment.timestamp * 1000,
          endTimeMillis: (segment.timestamp * 1000) + segment.duration * 1000,
          segment: segment.substring,
          confidence: segment.confidence
        )
      }

      let confidence = transcription.segments.map { $0.confidence }.reduce(0, +) / Float(transcription.segments.count)
      let item = TranscriptionResult(transcript: transcript, confidence: confidence, segments: segments)
      if !transcription.formattedString.isEmpty {
        results.append(item)
      }
    }

    if #available(iOS 18.0, *), !result.isFinal, isFinal {
      hasSeenFinalResult = true
    }

    if isFinal && results.isEmpty {
      var previousResultWasFinal = false
      var previousResultHadTranscriptions = false
      if #available(iOS 18.0, *), let previousResult = previousResult {
        previousResultWasFinal = previousResult.speechRecognitionMetadata?.speechDuration ?? 0 > 0
        previousResultHadTranscriptions = !previousResult.transcriptions.isEmpty
      }
      if !previousResultWasFinal || !previousResultHadTranscriptions {
        emit("nomatch")
        return
      }
    }

    emit("result", [
      "isFinal": isFinal,
      "results": results.map { $0.toDictionary() },
    ])
    previousResult = result
  }

  func handleRecognitionError(_ error: Error) {
    if let recognitionError = error as? RecognizerError {
      switch recognitionError {
      case .nilRecognizer:
        emit("error", ["error": "language-not-supported", "message": recognitionError.message])
      case .notAuthorizedToRecognize:
        emit("error", ["error": "not-allowed", "message": recognitionError.message])
      case .notPermittedToRecord:
        emit("error", ["error": "not-allowed", "message": recognitionError.message])
      case .recognizerIsUnavailable:
        emit("error", ["error": "service-not-allowed", "message": recognitionError.message])
      case .invalidAudioSource:
        emit("error", ["error": "audio-capture", "message": recognitionError.message])
      case .audioInputBusy:
        emit("error", ["error": "audio-capture", "message": recognitionError.message])
      case .audioSessionInterrupted:
        emit("error", ["error": "interrupted", "message": recognitionError.message])
      case .audioRouteChanged:
        emit("error", ["error": "audio-capture", "message": recognitionError.message])
      }
      return
    }

    let nsError = error as NSError
    let errorCode = nsError.code

    let errorTypes: [(codes: [Int], code: String, message: String)] = [
      ([102, 201], "service-not-allowed", "Assets are not installed, Siri or Dictation is disabled."),
      ([203], "audio-capture", "Failure occurred during speech recognition."),
      ([1100], "busy", "Trying to start recognition while an earlier instance is still active."),
      ([1101, 1107], "network", "Connection to speech process was invalidated or interrupted."),
      ([1110], "no-speech", "No speech was detected."),
      ([1700], "not-allowed", "Request is not authorized."),
    ]

    for (codes, code, message) in errorTypes {
      if codes.contains(errorCode) {
        if let underlyingError = nsError.userInfo[NSUnderlyingErrorKey] as? NSError {
          if errorCode == 203 && underlyingError.domain == "SiriSpeechErrorDomain" && underlyingError.code == 1 {
            emit("nomatch")
          } else {
            emit("error", ["error": code, "message": message])
          }
        } else {
          emit("error", ["error": code, "message": message])
        }
        return
      }
    }

    if errorCode != 301 {
      emit("error", ["error": "audio-capture", "message": error.localizedDescription])
    }
  }
}
