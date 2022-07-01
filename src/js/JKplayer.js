'use struct'

class JKplayer {
    constructor(targetID, settings) {
        this.targetVideoNode = document.querySelector(targetID);
        if(this.targetVideoNode) {
            if(this.targetVideoNode.nodeName.toLowerCase() === "video") {
                this.setPlayer();
                this.buildVideoBox();
                this.setEvents();
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
        this.timelineRange.step = 0.1;
        this.timelineRange.value = 50;
        this.timelineBox.appendChild(this.timelineRange);

        this.videoControlsBox.appendChild(this.timelineBox);

        //Create remain time
        this.remainTime = document.createElement("span");
        this.remainTime.id = "jkplayer-remain-time";
        this.remainTime.innerText = "-03:03";
        this.videoControlsBox.appendChild(this.remainTime);

        //Create volume color
        this.volumeButton = document.createElement("button");
        this.volumeButton.id = "jkplayer-volume-button";
        this.volumeButton.className = "jkplayer-controls-button";
        this.videoControlsBox.appendChild(this.volumeButton);

        //Create volume slides
        this.volumeSlider = document.createElement("input");
        this.volumeSlider.id = "jkplayer-volume-range";
        this.volumeSlider.type = "range";
        this.volumeSlider.min = 0;
        this.volumeSlider.max = 1;
        this.volumeSlider.step = 0.05;
        this.volumeSlider.value = 0.5;
        this.videoControlsBox.appendChild(this.volumeSlider);

        //Settings button
        this.settingsButton = document.createElement("button");
        this.settingsButton.id = "jkplayer-settings-button"
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
            e.preventDefault();
        });
    }
}