module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath: 'ios/RNSpeechRecognition.podspec',
      },
      android: {
        sourceDir: 'android/',
        packageImportPath: 'import com.duysolo.speechrecognition.RNSpeechRecognitionPackage;',
      },
    },
  },
};
