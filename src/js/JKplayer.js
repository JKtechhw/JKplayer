'use struct'

class JKplayer {
    constructor(targetID, settings) {
        this.targetVideoNode = document.querySelector(targetID);
        if(this.targetVideoNode) {
            if(this.targetVideoNode.nodeName.toLowerCase() === "video") {
                this.setPlayer();
                this.buildVideoBox();
                this.setEvents();
                this.setKeys();
            }

            else {
                console.error("Target element isn't video");
            }
        }

        else {
            console.error("Target video element doesn't exist!");
        }
    }

    setPlayer() {
        if(this.targetVideoNode.hasAttribute("controls")) {
            this.targetVideoNode.removeAttribute("controls");
        }
    }

    buildVideoBox() {
        let parent = this.targetVideoNode.parentElement;

        this.videoBox = document.createElement("div");
        this.videoBox.id = "jkplayer-box";
        this.videoBox.classList.add("paused");

        //Apend existing video element
        let fragment = document.createDocumentFragment();
        fragment.appendChild(this.targetVideoNode);
        this.videoBox.appendChild(fragment);

        //Build controls panel
        this.buildControlsPanel();

        //Create center play button
        this.centerPlayButton = document.createElement("button");
        this.centerPlayButton.id = "jkplayer-center-play-button";
        this.videoBox.appendChild(this.centerPlayButton);

        this.videoElement = this.videoBox.querySelector("video");
        this.videoDuration = this.videoBox.duration;

        parent.insertAdjacentElement("afterbegin", this.videoBox);
    }

    buildControlsPanel() {
        //Create box for controls
        this.videoControlsBox = document.createElement("div");
        this.videoControlsBox.id = "jkplayer-controls";
        this.videoBox.appendChild(this.videoControlsBox);

        //Play button
        this.controlsPlayButton = document.createElement("button");
        this.controlsPlayButton.className = "jkplayer-controls-button";
        this.controlsPlayButton.id = "jkplayer-play-button";
        this.videoControlsBox.appendChild(this.controlsPlayButton);

        //Create video timeline
        this.timelineBox = document.createElement("div");
        this.timelineBox.id = "jkplayer-timeline-box";

        this.timelistMarkersBox = document.createElement("div");
        this.timelistMarkersBox.id = "jkplayer-markers-box";
        this.timelineBox.appendChild(this.timelistMarkersBox);

        //////////////////////////////////////////////////////////////
        for(let i = 1; i < 5; i++) {
            let marker = document.createElement("div");
            marker.classList.add("marker");
            marker.style.left = Number(20 * i) + "%";
            this.timelistMarkersBox.appendChild(marker);
        }
        //////////////////////////////////////////////////////////////

        this.timelineRange = document.createElement("input");
        this.timelineRange.type = "range";
        this.timelineRange.id = "jkplayer-timeline-range";
        this.timelineRange.min = 0;
        this.timelineRange.max = 100;
        this.timelineRange.step = 0.01;
        this.timelineRange.value = 0;
        this.timelineBox.appendChild(this.timelineRange);

        this.videoControlsBox.appendChild(this.timelineBox);

        //Create remain time
        this.remainTime = document.createElement("span");
        this.remainTime.id = "jkplayer-remain-time";
        this.remainTime.innerText = "00:00";
        this.videoControlsBox.appendChild(this.remainTime);

        //Create volume box
        this.volumeBox = document.createElement("div");
        this.volumeBox.id = "jkplayer-volume-box";
        this.videoControlsBox.appendChild(this.volumeBox);

        //Create volume color
        this.volumeButton = document.createElement("button");
        this.volumeButton.id = "jkplayer-volume-button";
        this.volumeButton.className = "jkplayer-controls-button";
        this.volumeBox.appendChild(this.volumeButton);

        //Create volume slides
        this.volumeSlider = document.createElement("input");
        this.volumeSlider.id = "jkplayer-volume-range";
        this.volumeSlider.type = "range";
        this.volumeSlider.min = 0;
        this.volumeSlider.max = 1;
        this.volumeSlider.step = 0.05;
        this.volumeBox.appendChild(this.volumeSlider);

        //Settings button
        this.settingsButton = document.createElement("button");
        this.settingsButton.id = "jkplayer-settings-button";
        this.settingsButton.className = "jkplayer-controls-button";
        this.videoControlsBox.appendChild(this.settingsButton);

        //Fullscreen button
        this.fullscreenButton = document.createElement("button");
        this.fullscreenButton.id = "jkplayer-fullscreen-button"
        this.fullscreenButton.className = "jkplayer-controls-button";
        this.videoControlsBox.appendChild(this.fullscreenButton);
    }

    setEvents() {
        this.videoBox.addEventListener("contextmenu", (e) => {
            console.log("Context menu prevented");
            e.preventDefault();
        });

        //Fullscreen
        this.fullscreenButton.addEventListener("click", this.toggleFullscreen.bind(this));

        //Play, pause
        this.videoElement.addEventListener("click", this.togglePlay.bind(this));
        this.centerPlayButton.addEventListener("click", this.togglePlay.bind(this));
        this.controlsPlayButton.addEventListener("click", this.togglePlay.bind(this));

        this.volumeButton.addEventListener("click", this.toggleMute.bind(this));

        this.timelineRange.addEventListener("input", () => {
            console.log("Video time changed with timeline");
            this.videoElement.currentTime = this.timelineRange.value;
            this.timelineRange.max = this.videoElement.duration;
        });

        this.volumeSlider.addEventListener("input", () => {
            console.log("Video volume changed to " + this.volumeSlider.value);
            this.videoElement.volume = this.volumeSlider.value;
        });

        this.videoElement.addEventListener("timeupdate", () => {
            this.timelineRange.value = this.videoElement.currentTime;
            this.setCurrentTime();
        });

        this.videoBox.addEventListener("mouseenter", () => {
            console.log("Display controls");
            this.videoBox.classList.remove("hidden-controls");
        });

        this.videoBox.addEventListener("mouseleave", () => {
            console.log("Hide controls");
            this.videoBox.classList.add("hidden-controls");
        });
    }

    setKeys() {
        this.videoElement.addEventListener("keydown", (e) => {
            console.log(e);
        })
    }

    toggleFullscreen() {
        if(document.fullscreenElement) {
            this.videoBox.classList.remove("fullscreen");
            document.exitFullscreen();
            console.log("Exiting full screen");
        }
        
        else {
            this.videoBox.classList.add("fullscreen");
            this.videoBox.requestFullscreen();
            console.log("Entering full screen");
        }
    }

    togglePlay() {
        if(this.videoElement.paused) {
            this.videoBox.classList.add("playing");
            this.videoBox.classList.remove("paused");
            this.videoElement.play();
            console.log("Play");
        }

        else {
            this.videoBox.classList.remove("playing");
            this.videoBox.classList.add("paused");
            this.videoElement.pause();
            console.log("Paused");
        }
    }

    toggleMute() {
        if(this.videoElement.muted) {
            this.videoBox.classList.remove("muted");
            this.videoElement.muted = false;
            this.volumeSlider.value = this.prevVolume;
            console.log("Unmuted");
        }

        else {
            this.videoBox.classList.add("muted");
            this.videoElement.muted = true;
            this.prevVolume = this.volumeSlider.value;
            this.volumeSlider.value = 0;
            console.log("Muted");
        }
    }

    setCurrentTime() {
        this.currentTime = this.videoElement.currentTime;
        let currentMin = Math.floor(this.currentTime / 60);
        let currentSec = Math.floor(this.currentTime % 60);
        currentMin < 10 ? currentMin = "0" + currentMin : currentMin;
        currentSec < 10 ? currentSec = "0" + currentSec : currentSec;
        this.remainTime.innerText = `${currentMin}:${currentSec}`;
    }
}