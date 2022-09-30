/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

 const loadingAnimation = document.getElementById('loading-animation');
 const detectDiv = document.getElementById("detect-div");
 
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
  // Demo 1: Grab a bunch of images from the page and classify them
  // upon click.
  ********************************************************************/
  
  // In this demo, we have put all our clickable images in divs with the 
  // CSS class 'classifyOnClick'. Lets get all the elements that have
  // this class.
  const imageContainers = document.getElementsByClassName('classifyOnClick');
  
  // Now let's go through all of these and add a click event listener.
  for (let i = 0; i < imageContainers.length; i++) {
    // Add event listener to the child element whichis the img element.
    imageContainers[i].children[0].addEventListener('click', handleClick);
  }
  
  // When an image is clicked, let's classify it and display results!
  function handleClick(event) {
    if (!model) {
      console.log('Wait for model to load before clicking!');
      return;
    }
    
    // We can call model.classify as many times as we like with
    // different image data each time. This returns a promise
    // which we wait to complete and then call a function to
    // print out the results of the prediction.
    model.detect(event.target).then(function (predictions) {
      // Lets write the predictions to a new paragraph element and
      // add it to the DOM.
      console.log(predictions);
      for (let n = 0; n < predictions.length; n++) {
        // Description text
        const p = document.createElement('p');
        p.innerText = predictions[n].class  + ' - with ' 
            + Math.round(parseFloat(predictions[n].score) * 100) 
            + '% confidence.';
        // Positioned at the top left of the bounding box.
        // Height is whatever the text takes up.
        // Width subtracts text padding in CSS so fits perfectly.
        p.style = 'left: ' + predictions[n].bbox[0] + 'px;' + 
            'top: ' + predictions[n].bbox[1] + 'px; ' + 
            'width: ' + (predictions[n].bbox[2] - 10) + 'px;';
  
        const highlighter = document.createElement('div');
        highlighter.setAttribute('class', 'highlighter');
        highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
            'top: ' + predictions[n].bbox[1] + 'px;' +
            'width: ' + predictions[n].bbox[2] + 'px;' +
            'height: ' + predictions[n].bbox[3] + 'px;';
  
        event.target.parentNode.appendChild(highlighter);
        event.target.parentNode.appendChild(p);
      }
    });
  }
  
  
  
  /********************************************************************
  // Demo 2: Continuously grab image from webcam stream and classify it.
  // Note: You must access the demo on https for this to work:
  // https://tensorflow-js-image-classification.glitch.me/
  ********************************************************************/
  
const video = document.createElement("video");
const canvasElement = document.getElementById("detect-canvas");
const canvas = canvasElement.getContext("2d");
const btnDetect = document.getElementById("btn-detect");
const btnFlip = document.getElementById("btn-flip");
const liveView = document.getElementById('liveView');

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
    //canvas.drawImage(liveView, 0, 0, canvasElement.width, canvasElement.height);
    
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
  
  // Enable the live webcam view and start classification.
  function enableCam(event) {
    if (!model) {
      console.log('Wait! Model not loaded yet.')
      return;
    }
    
    // Hide the button.
    event.target.classList.add('removed');  
    
    // getUsermedia parameters.
    const constraints = {
      video: true
    };
  
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
      video.srcObject = stream;
      video.addEventListener('loadeddata', predictWebcam);
    });
  }
  

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
  