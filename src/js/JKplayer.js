'use struct'

class JKplayer {
    constructor(targetID, settings) {
        this.targetVideoNode = document.querySelector(targetID);
        if(this.targetVideoNode) {
            if(this.targetVideoNode.nodeName.toLowerCase() === "video") {
                //TODO check media status
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

        if(!this.targetVideoNode.hasAttribute("playsinline")) {
            this.targetVideoNode.setAttribute("playsinline", "");
        }

        if(!this.targetVideoNode.hasAttribute("disablePictureInPicture")) {
            this.targetVideoNode.setAttribute("disablePictureInPicture", "");
        }
    }

    buildVideoBox() {
        let parent = this.targetVideoNode.parentElement;

        this.videoBox = document.createElement("div");
        this.videoBox.setAttribute("tabindex", 0);
        this.videoBox.id = "jkplayer-box";
        this.videoBox.classList.add("jkplayer-paused");

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
        this.videoControlsBox.appendChild(this.timelineBox);

        //Create markers box
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

        //Create remain time
        this.remainTime = document.createElement("span");
        this.remainTime.id = "jkplayer-remain-time";
        this.remainTime.innerText = "00:00:00";
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

        //Subtitles button
        this.subtitlesButton = document.createElement("button");
        this.subtitlesButton.id = "jkplayer-subtitles-button"
        this.subtitlesButton.className = "jkplayer-controls-button";
        this.videoControlsBox.appendChild(this.subtitlesButton);

        //Settings box
        this.settingsBox = document.createElement("div");
        this.settingsBox.id = "jkplayer-settings-box";
        this.videoControlsBox.appendChild(this.settingsBox);

        //Settings button
        this.settingsButton = document.createElement("button");
        this.settingsButton.id = "jkplayer-settings-button";
        this.settingsButton.className = "jkplayer-controls-button";
        this.settingsBox.appendChild(this.settingsButton);

        //Settings menu
        this.settingsMenu = document.createElement("div");
        this.settingsMenu.id = "jkplayer-settings-menu";
        this.settingsBox.appendChild(this.settingsMenu);

        //TODO load data from config
        let options = [
            { name: "Titulky", active: "Vypnuto", value: ["Česky", "Anglicky", "Německy", "Španělsky"]},
            { name: "Kvalita", active: "1080", value: ["1080", "720", "480", "360", "240", "144"]},
            { name: "Rychlost", active: "1x", value: ["0.25","0.50","0.75","1","1.25","1.50","1.75", "2"]}
        ]

        //Create options
        options.forEach(element => {
            let option = document.createElement("div");
            let optionName = document.createElement("span");
            optionName.classList.add("jktech-config-option-name");
            optionName.innerText = element.name;
            option.appendChild(optionName);
            let optionValue = document.createElement("span");
            optionValue.classList.add("jktech-config-option-value");
            optionValue.innerText = element.active;
            option.appendChild(optionValue);
            option.classList.add("jktech-config-option");
            this.settingsMenu.appendChild(option);
        });

        //Fullscreen button
        this.fullscreenButton = document.createElement("button");
        this.fullscreenButton.id = "jkplayer-fullscreen-button"
        this.fullscreenButton.className = "jkplayer-controls-button";
        this.videoControlsBox.appendChild(this.fullscreenButton);
    }

    setEvents() {
        //Prevent context menu
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

        //Mute
        this.volumeButton.addEventListener("click", this.toggleMute.bind(this));
        this.videoElement.addEventListener("volumechange", (e) => {
            console.log(e.target.volume)
            if(e.target.volume === 0) {
                this.videoBox.classList.add("jkplayer-muted");
            }

            else {
                this.videoBox.classList.remove("jkplayer-muted");
            }

            this.volumeSlider.value = this.videoElement.volume;
        });

        this.volumeSlider.addEventListener("input", () => {
            console.log("Video volume changed to " + this.volumeSlider.value);
            this.videoElement.volume = this.volumeSlider.value;
        });

        this.timelineRange.addEventListener("input", () => {
            console.log("Video time changed with timeline");
            this.videoElement.currentTime = this.timelineRange.value;
        });

        this.videoElement.addEventListener("timeupdate", () => {
            this.timelineRange.value = this.videoElement.currentTime;
            this.setCurrentTime();
        });

        this.videoBox.addEventListener("mouseenter", () => {
            console.log("Display controls");
            this.videoBox.classList.remove("jkplayer-hidden-controls");
        });

        this.videoBox.addEventListener("mouseleave", () => {
            console.log("Hide controls");
            this.videoBox.classList.add("jkplayer-hidden-controls");
        });

        let hideFunction = (e) => {
            if(!this.settingsMenu.contains(e.target)) {
                this.videoBox.classList.remove("jkplayer-open-settings");
                document.removeEventListener("click", hideFunction);
            }
        };

        this.settingsButton.addEventListener("click", (e) => {
            e.stopPropagation()
            document.addEventListener("click", hideFunction);
            this.videoBox.classList.toggle("jkplayer-open-settings");
        });

        //TODO loading effect
    }

    setKeys() {
        this.videoBox.addEventListener("keydown", (e) => {
            e.preventDefault(); 
            switch(e.code) {
                case "KeyK": 
                case "Space": 
                    this.togglePlay();
                    break;

                case "KeyF": 
                    this.toggleFullscreen();
                    break;

                case "KeyM": 
                    this.toggleMute();
                    break;

                case "ArrowRight": 
                    this.skipTime("+");
                    break;

                case "ArrowLeft": 
                    this.skipTime("-");
                    break;

                case "ArrowUp": 
                    this.changeVolume("+");
                    break;

                case "ArrowDown": 
                    this.changeVolume("-");
                    break;

                case "Home": 
                    this.skipTime("start");
                    break;

                case "End": 
                    this.skipTime("end");
                    break;

                /*
                    TODO c key - toggle captions
                    TODO Start media key, pause media key
                    TODO i key - toggle player in miniplayer
                */ 
            }
        })
    }

    toggleFullscreen() {
        if(document.fullscreenElement) {
            this.videoBox.classList.remove("jkplayer-fullscreen");
            document.exitFullscreen();
            console.log("Exiting full screen");
        }
        
        else {
            this.videoBox.classList.add("jkplayer-fullscreen");
            this.videoBox.requestFullscreen();
            console.log("Entering full screen");
        }
    }

    togglePlay() {
        if(this.videoElement.paused) {
            this.videoBox.classList.add("jkplayer-playing");
            this.videoBox.classList.remove("jkplayer-paused");
            this.videoElement.play();
            this.timelineRange.max = this.videoElement.duration;
            console.log("Play");
        }

        else {
            this.videoBox.classList.remove("jkplayer-playing");
            this.videoBox.classList.add("jkplayer-paused");
            this.videoElement.pause();
            console.log("Paused");
        }
    }

    toggleMute() {
        if(this.videoElement.muted) {
            this.videoBox.classList.remove("jkplayer-muted");
            this.videoElement.muted = false;
            this.volumeSlider.value = this.prevVolume;
            console.log("Unmuted");
        }

        else {
            this.videoBox.classList.add("jkplayer-muted");
            this.videoElement.muted = true;
            this.prevVolume = this.volumeSlider.value;
            this.volumeSlider.value = 0;
            console.log("Muted");
        }
    }

    changeVolume(direction = "+") {
        if(direction === "+") {
            if(this.videoElement.volume <= 0.9) {
                this.videoElement.volume += 0.1;
            }
        }

        else {
            if(this.videoElement.volume >= 0.1) {
                this.videoElement.volume -= 0.1;
            }
        }
    }

    setCurrentTime() {
        //TODO format by video length
        this.currentTime = this.videoElement.currentTime;
        let currentHours = Math.floor(this.currentTime / 3600);
        this.currentTime = Math.floor(this.currentTime % 3600);
        let currentMin = Math.floor(this.currentTime / 60);
        let currentSec = Math.floor(this.currentTime % 60);
        currentHours < 10 ? currentHours = "0" + currentHours : currentHours;
        currentMin < 10 ? currentMin = "0" + currentMin : currentMin;
        currentSec < 10 ? currentSec = "0" + currentSec : currentSec;
        this.remainTime.innerText = `${currentHours}:${currentMin}:${currentSec}`;
    }

    skipTime(direction = "+") {
        //TODO skip time by config
        if(direction === "-") {
            this.videoElement.currentTime -= 5;
        }

        else if(direction === "start") {
            this.videoElement.currentTime = 0;
        }

        else if(direction === "end") {
            this.videoElement.currentTime = this.videoElement.duration;
        }

        else {
            this.videoElement.currentTime += 5;
        }
    }
}