const recordButton = document.getElementById('record');
const stopButton = document.getElementById('stop');
const audioElement = document.getElementById('audio');
const timerDisplay = document.getElementById('timer');

let mediaRecorder;
let audioChunks = [];
let timerInterval;

// Check if MediaRecorder is supported
if (typeof MediaRecorder === "undefined") {
    alert("MediaRecorder is not supported in your browser. Please use the latest version of Chrome, Firefox, or Edge.");
    recordButton.disabled = true;
    stopButton.disabled = true;
}

// Record Button Click
recordButton.addEventListener('click', () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();
            console.log("Recording started");
            audioChunks = [];

            // Start the timer
            let startTime = Date.now();
            timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
                const seconds = (elapsed % 60).toString().padStart(2, '0');
                timerDisplay.textContent = `${minutes}:${seconds}`;
            }, 1000);

            // Handle data and stop events
            mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
            mediaRecorder.onstop = () => {
                clearInterval(timerInterval);
                console.log("Recording stopped");

                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                audioElement.src = audioUrl; // Set audio element source
                audioElement.controls = true;

                // Upload audio to the server
                const formData = new FormData();
                formData.append('audio_data', audioBlob, 'recorded_audio.wav');

                fetch('/upload', { method: 'POST', body: formData })
                    .then(response => {
                        if (response.ok) {
                            console.log("Audio uploaded successfully");
                            location.reload(); // Refresh the page to display new file
                        } else {
                            console.error("Error uploading audio:", response.statusText);
                        }
                    })
                    .catch(error => console.error("Upload failed:", error));
            };

            recordButton.disabled = true;
            stopButton.disabled = false;
        })
        .catch(error => {
            console.error('Error accessing microphone:', error);
            alert('Unable to access microphone. Please check permissions and try again.');
        });
});

// Stop Button Click
stopButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
    recordButton.disabled = false;
    stopButton.disabled = true;
});

// Initially disable the stop button
stopButton.disabled = true;
