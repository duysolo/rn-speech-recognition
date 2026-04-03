#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(RNSpeechRecognition, RCTEventEmitter)

RCT_EXTERN_METHOD(start:(NSDictionary *)options)
RCT_EXTERN_METHOD(stop)
RCT_EXTERN_METHOD(abort)

RCT_EXTERN_METHOD(requestPermissionsAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getPermissionsAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getMicrophonePermissionsAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(requestMicrophonePermissionsAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getSpeechRecognizerPermissionsAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(requestSpeechRecognizerPermissionsAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getStateAsync:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getSupportedLocales:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(androidTriggerOfflineModelDownload:(NSDictionary *)options
                  resolve:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setCategoryIOS:(NSDictionary *)options)
RCT_EXTERN_METHOD(setAudioSessionActiveIOS:(BOOL)value options:(NSDictionary *)options)

RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(supportsOnDeviceRecognition)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(supportsRecording)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(isRecognitionAvailable)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getSpeechRecognitionServices)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getDefaultRecognitionService)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getAssistantService)
RCT_EXTERN__BLOCKING_SYNCHRONOUS_METHOD(getAudioSessionCategoryAndOptionsIOS)

@end
