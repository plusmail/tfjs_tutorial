var output = document.getElementById('output');
var right = document.getElementById('right');
var log = function (message, className) {
    var row = document.createElement('div');
    row.innerHTML = message;
    if (className) {
        row.classList.add(className);
    }
    output.appendChild(row);
};

window.onerror = function (message, url, lineNumber) {
    log(lineNumber + ': ' + message);
    return true;
};

var getWebcams = function () {
    return navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
            devices.forEach((device) => {
                log(device.kind + ": LABEL = \"" + device.label +
                    "\" ID = " + device.deviceId);
            });

            return devices.filter((device) => {
                return device.kind === 'videoinput';
            });
        });
};

var startWebcamStream = function (webcamDevice) {
    var constraints = {
        audio: false,
        video: {
            optional: [{
                sourceId: webcamDevice.deviceId
            }]
        },
        deviceId: {
            exact: webcamDevice.deviceId
        }
    };

    log('Starting webcam stream with device ID = ' + webcamDevice.deviceId);

    var successCallback = function (stream) {
        var video = document.createElement('video');
        video.autoplay = true;
        setVideoStream(video, stream);

        var row = document.createElement('div');
        row.innerHTML = 'LABEL = "' + webcamDevice.label + '"<br> ID = "' + webcamDevice.deviceId + '"';
        right.appendChild(row);
        right.appendChild(video);

        log('Webcam stream with device ID = ' + webcamDevice.deviceId + ', LABEL = "' + webcamDevice.label + '" started', 'success');
    };

    var errorCallback = function (error) {
        log('Webcam stream with device ID = ' + webcamDevice.deviceId + ', LABEL = "' + webcamDevice.label + '" failed to start: ' + error, 'error');
    }

    navigator.mediaDevices.getUserMedia(constraints)
        .then(successCallback)
        .catch(errorCallback);
};

var setVideoStream = function (video, stream) {
    try {
        video.srcObject = stream;
    } catch (error) {
        video.src = window.URL.createObjectURL(stream);
    }
}

var checkWebcamResolution = function (width, height) {
    return new Promise(function (resolve) {
        var successCallback = function (stream) {
            var video = document.createElement('video');
            video.autoplay = true;
            setVideoStream(video, stream);

            right.appendChild(video);

            video.onloadedmetadata = function (e) {
                if (width === video.videoWidth && height === video.videoHeight) {
                    log('Webcam stream successfully started in <strong>' + width + 'x' + height + '</strong>', 'success');
                } else {
                    log('Webcam stream failed to start in <strong>' + width + 'x' + height + '</strong>, instead started in <strong>' + video.videoWidth + 'x' + video.videoHeight + '</strong>', 'error');
                }

                setTimeout(function () {
                    stream.getTracks().forEach(function (track) {
                        track.stop();
                    });

                    video.remove();
                    resolve();
                }, 500);
            };
        };

        var errorCallback = function () {
            log('Webcam stream failed to start in <strong>' + width + 'x' + height + '</strong>', 'error');
            resolve();
        }

        mediaDevices.getUserMedia({
            video: {
                width: {
                    exact: width
                },
                height: {
                    exact: height
                }
            }
        })
            .then(successCallback)
            .catch(errorCallback);
    });
};

log('Start');
getWebcams()
    .then((webcamDevices) => {
        webcamDevices.forEach((webcamDevice) => {
            startWebcamStream(webcamDevice);
        });
    });