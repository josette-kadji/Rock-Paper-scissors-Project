async function createDetector() {

    
    return window.handPoseDetection.createDetector(
      window.handPoseDetection.SupportedModels.MediaPipeHands,
      {
        runtime: "mediapipe",
        modelType: "full",
        maxHands: 2,
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915`,
      }
    )
  }
// store references
let handposeModel, gestureEstimator;

 const Prediction = {

    init: async function() {

        // initialize finger gesture recognizer with known gestures
        const knownGestures = [RockGesture, PaperGesture, ScissorsGesture];
        gestureEstimator = new fp.GestureEstimator(knownGestures);
        console.log('Initialized FingerPose with ' + knownGestures.length + ' gestures');

        // load handpose model
        console.log("Loading handpose model...")
        handposeModel = await createDetector()
        console.log("Model loaded");

        // make one prediction on a sample image
        // this is to "warm up" the model so there won't be a delay
        // before the actual predictions later
        console.log("Warm up model");
        const sample = await SampleImage.create();
        await handposeModel.estimateHands(sample, false);
        console.log("Model is hot!");
    },

    predictGesture: async function(sourceElement, minimumScore) {

        const predictions = await handposeModel.estimateHands(sourceElement, false);
    console.log(predictions)
        if(predictions.length > 0) {
    
            // detect gestures
            const gestureEstimations = gestureEstimator.estimate(
                predictions[0].keypoints3D
                , minimumScore
            );
    
            // get gesture with highest match score
            if(gestureEstimations.gestures.length > 0) {
    
                // this will reduce an array of results to a single value
                // containing only the gesture with the highest score
                const gestureResult = gestureEstimations.gestures.reduce((p, c) => { 
                    return (p.confidence > c.confidence) ? p : c;
                });
    
                return gestureResult.name;
            }
        }
    
        return '';
    },

}
