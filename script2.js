const loadingAnimation = document.getElementById('loading-animation');
const detectDiv = document.getElementById("detect-div");
const video = document.createElement("video");
const canvasElement = document.getElementById("detect-canvas");
const canvas = canvasElement.getContext("2d");
const btnDetect = document.getElementById("btn-detect");
const btnFlip = document.getElementById("btn-flip");
const liveView = document.getElementById('liveView');
  
var model = undefined;
  
// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
cocoSsd.load().then(function (loadedModel) {
   model = loadedModel;
   // Show demo section now model is ready to use.
   loadingAnimation.hidden = true;
   detectDiv.hidden = false;
});
  
/********************************************************************
 // Demo 2: Continuously grab image from webcam stream and classify it.
// Note: You must access the demo on https for this to work:
// https://tensorflow-js-image-classification.glitch.me/
********************************************************************/

let scanning = false;
let facingMode = "environment";

btnDetect.onclick = () => {
    startCam();
};

btnFlip.onclick = () => {
    facingMode = (facingMode == "user")? "environment" : "user";
    startCam();
};

function startCam() {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facingMode } })
      .then(function(stream) {
        scanning = true;
  
        let track = stream.getVideoTracks()[0];
        let capabilities = track.getCapabilities();
          
        canvasElement.hidden = false;
        btnFlip.hidden = false;
        video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
        video.srcObject = stream;
        video.play();
        video.addEventListener('loadeddata', predictWebcam);
        tick();
//        scan();
      });
}

function tick() {
    canvasElement.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

    detectDiv.hidden = true;
    scanning && requestAnimationFrame(tick);
}

function scan() {
    try {
        qrCode.decode();
    } catch (e) {
        setTimeout(scan, 300);
    }
}

// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
var children = [];

// Prediction loop!
function predictWebcam() {
    // Now let's start classifying the stream.
    model.detect(video).then(function (predictions) {
        // Remove any highlighting we did previous frame.
        for (let i = 0; i < children.length; i++) {
            liveView.removeChild(children[i]);
        }
        children.splice(0);
        
        // Now lets loop through predictions and draw them to the live view if
        // they have a high confidence score.
        for (let n = 0; n < predictions.length; n++) {
            // If we are over 66% sure we are sure we classified it right, draw it!
            if (predictions[n].score > 0.66) {
                const p = document.createElement('p');
                p.innerText = predictions[n].class  + ' - with ' 
                    + Math.round(parseFloat(predictions[n].score) * 100) 
                    + '% confidence.';
                // Draw in top left of bounding box outline.
                p.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
                    'top: ' + predictions[n].bbox[1] + 'px;' + 
                    'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

                // Draw the actual bounding box.
                const highlighter = document.createElement('div');
                highlighter.setAttribute('class', 'highlighter');
                highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
                    + predictions[n].bbox[1] + 'px; width: ' 
                    + predictions[n].bbox[2] + 'px; height: '
                    + predictions[n].bbox[3] + 'px;';

                liveView.appendChild(highlighter);
                liveView.appendChild(p);
                
                // Store drawn objects in memory so we can delete them next time around.
                children.push(highlighter);
                children.push(p);
            }
        }
        
        // Call this function again to keep predicting when the browser is ready.
        window.requestAnimationFrame(predictWebcam);
    });
}
  