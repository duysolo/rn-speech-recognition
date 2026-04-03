import Speech

struct SpeechRecognitionOptions {
  var interimResults: Bool = false
  var lang: String = "en-US"
  var continuous: Bool = false
  var maxAlternatives: Int = 5
  var contextualStrings: [String]? = nil
  var requiresOnDeviceRecognition: Bool = false
  var addsPunctuation: Bool = false
  var recordingOptions: RecordingOptions? = nil
  var audioSource: AudioSourceOptions? = nil
  var iosTaskHint: IOSTaskHint? = nil
  var iosCategory: SetCategoryOptions? = nil
  var volumeChangeEventOptions: VolumeChangeEventOptions? = nil
  var iosVoiceProcessingEnabled: Bool? = false

  init(from dict: NSDictionary) {
    self.interimResults = dict["interimResults"] as? Bool ?? false
    self.lang = dict["lang"] as? String ?? "en-US"
    self.continuous = dict["continuous"] as? Bool ?? false
    self.maxAlternatives = dict["maxAlternatives"] as? Int ?? 5
    self.contextualStrings = dict["contextualStrings"] as? [String]
    self.requiresOnDeviceRecognition = dict["requiresOnDeviceRecognition"] as? Bool ?? false
    self.addsPunctuation = dict["addsPunctuation"] as? Bool ?? false
    self.iosVoiceProcessingEnabled = dict["iosVoiceProcessingEnabled"] as? Bool ?? false

    if let recordDict = dict["recordingOptions"] as? NSDictionary {
      self.recordingOptions = RecordingOptions(from: recordDict)
    }
    if let audioDict = dict["audioSource"] as? NSDictionary {
      self.audioSource = AudioSourceOptions(from: audioDict)
    }
    if let hint = dict["iosTaskHint"] as? String {
      self.iosTaskHint = IOSTaskHint(rawValue: hint)
    }
    if let catDict = dict["iosCategory"] as? NSDictionary {
      self.iosCategory = SetCategoryOptions(from: catDict)
    }
    if let volDict = dict["volumeChangeEventOptions"] as? NSDictionary {
      self.volumeChangeEventOptions = VolumeChangeEventOptions(from: volDict)
    }
  }
}

struct VolumeChangeEventOptions {
  var enabled: Bool? = false
  var intervalMillis: Int? = nil

  init(from dict: NSDictionary) {
    self.enabled = dict["enabled"] as? Bool ?? false
    self.intervalMillis = dict["intervalMillis"] as? Int
  }
}

enum IOSTaskHint: String {
  case unspecified
  case dictation
  case search
  case confirmation

  var sfSpeechRecognitionTaskHint: SFSpeechRecognitionTaskHint {
    switch self {
    case .unspecified: return .unspecified
    case .dictation: return .dictation
    case .search: return .search
    case .confirmation: return .confirmation
    }
  }
}

struct RecordingOptions {
  var persist: Bool = false
  var outputDirectory: String? = nil
  var outputFileName: String? = nil
  var outputSampleRate: Double? = nil
  var outputEncoding: String? = nil

  init(from dict: NSDictionary) {
    self.persist = dict["persist"] as? Bool ?? false
    self.outputDirectory = dict["outputDirectory"] as? String
    self.outputFileName = dict["outputFileName"] as? String
    self.outputSampleRate = dict["outputSampleRate"] as? Double
    self.outputEncoding = dict["outputEncoding"] as? String
  }
}

struct AudioSourceOptions {
  var uri: String = ""
  var audioEncoding: Int? = nil
  var sampleRate: Int? = 16000
  var audioChannels: Int? = 1
  var chunkDelayMillis: Int? = nil

  init(from dict: NSDictionary) {
    self.uri = dict["uri"] as? String ?? ""
    self.audioEncoding = dict["audioEncoding"] as? Int
    self.sampleRate = dict["sampleRate"] as? Int ?? 16000
    self.audioChannels = dict["audioChannels"] as? Int ?? 1
    self.chunkDelayMillis = dict["chunkDelayMillis"] as? Int
  }
}

enum CategoryParam: String {
  case ambient, soloAmbient, playback, record, playAndRecord, multiRoute

  var avCategory: AVAudioSession.Category {
    switch self {
    case .ambient: return .ambient
    case .soloAmbient: return .soloAmbient
    case .playback: return .playback
    case .record: return .record
    case .playAndRecord: return .playAndRecord
    case .multiRoute: return .multiRoute
    }
  }
}

enum CategoryOptionsParam: String {
  case mixWithOthers, duckOthers, interruptSpokenAudioAndMixWithOthers
  case allowBluetooth, allowBluetoothA2DP, allowAirPlay
  case defaultToSpeaker, overrideMutedMicrophoneInterruption

  var avCategoryOption: AVAudioSession.CategoryOptions {
    switch self {
    case .mixWithOthers: return .mixWithOthers
    case .duckOthers: return .duckOthers
    case .interruptSpokenAudioAndMixWithOthers: return .interruptSpokenAudioAndMixWithOthers
    case .allowBluetooth: return .allowBluetooth
    case .allowBluetoothA2DP: return .allowBluetoothA2DP
    case .allowAirPlay: return .allowAirPlay
    case .defaultToSpeaker: return .defaultToSpeaker
    case .overrideMutedMicrophoneInterruption:
      if #available(iOS 14.5, *) {
        return .overrideMutedMicrophoneInterruption
      } else {
        return .mixWithOthers
      }
    }
  }
}

enum ModeParam: String {
  case `default`, gameChat, measurement, moviePlayback, spokenAudio
  case videoChat, videoRecording, voiceChat, voicePrompt

  var avMode: AVAudioSession.Mode {
    switch self {
    case .default: return .default
    case .gameChat: return .gameChat
    case .measurement: return .measurement
    case .moviePlayback: return .moviePlayback
    case .spokenAudio: return .spokenAudio
    case .videoChat: return .videoChat
    case .videoRecording: return .videoRecording
    case .voiceChat: return .voiceChat
    case .voicePrompt: return .voicePrompt
    }
  }
}

struct SetCategoryOptions {
  var category: CategoryParam = .playAndRecord
  var categoryOptions: [CategoryOptionsParam] = [.duckOthers]
  var mode: ModeParam = .measurement

  init(from dict: NSDictionary) {
    if let cat = dict["category"] as? String, let c = CategoryParam(rawValue: cat) {
      self.category = c
    }
    if let opts = dict["categoryOptions"] as? [String] {
      self.categoryOptions = opts.compactMap { CategoryOptionsParam(rawValue: $0) }
    }
    if let m = dict["mode"] as? String, let mode = ModeParam(rawValue: m) {
      self.mode = mode
    }
  }

  // Default init
  init() {}
}

struct SetAudioSessionActiveOptions {
  var notifyOthersOnDeactivation: Bool? = true
}
