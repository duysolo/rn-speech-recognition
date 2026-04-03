module.exports = {
  dependency: {
    platforms: {
      ios: {},
      android: {
        sourceDir: 'android/',
        packageImportPath:
          'import com.duysolo.speechrecognition.RNSpeechRecognitionPackage;',
      },
    },
  },
}
