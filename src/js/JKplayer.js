'use strict';

class JKplayer {
    constructor(targetID, settings = [], videoData = {}) {
        console.time("JKplayer build time")
        this.targetVideoNode = document.querySelector(targetID);
        this.playerSettings = settings;
        if(this.targetVideoNode) {
            if(this.targetVideoNode.nodeName.toLowerCase() === "video") {
                this.targetVideoNode.style.opacity = 0;
                this.videoData = videoData;
                this.translateObject = {
                    download: "Stáhnout",
                    quality: "Kvalita",
                    captions: "Titulky",
                    enableCaptions: "Povolit titulky",
                    disableCaptions: "Zakázat titulky",
                    disabled: "Vypnuto",
                    speed: "Rychlost",
                    settings: "Možnosti",
                    fullScreen: "Celá obrazovka",
                    exitFullScreen: "Ukončit celou obrazovku",
                    auto: "Auto",
                    play: "Přehrát",
                    pause: "Pozastavit",
                    replay: "Pustit znovu",
                    mute: "Ztlumit",
                    unmute: "Zrušit ztlumení",
                    pip: "PIP",
                    cantPlayVideo: "Video nelze přehrát",
                    unsupportedVideoByBrowser: "Váš prohlížeč nepodporuje formát videa"
                }
                //TODO wrong file cant loadedmetadata
                //this.checkMediaStatus();
                this.targetVideoNode.addEventListener("loadedmetadata", this.checkMediaStatus.bind(this));
                this.targetVideoNode.load();
            }

            else {
                console.error("Target element isn't video");
            }
        }

        else {
            console.error("Target video element doesn't exist!");
        }
    }

    checkMediaStatus() {
        if(this.targetVideoNode.currentSrc) {
            let sourceType = this.getSourceTypeFromFilename(this.targetVideoNode.currentSrc);
            if(this.targetVideoNode.canPlayType(sourceType) === "") {
                this.errorScreen(this.translateObject.unsupportedVideoByBrowser);
            }

            else {
                this.setPlayer();
            }
        }

        else {
            console.error("Video source isn't provided");
            this.errorScreen(this.translateObject.cantPlayVideo);
        }
    }
    
    async setPlayer() {
        //if(navigator.userAgentData.mobile) {
        if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            this.isMobile = true;
        }

        else {
            this.isMobile = false;
        }

        this.preloadIcons("/src/icons/");
        await this.buildVideoBox();
        this.setVideoEvents();
        ///** Use navigator.userAgentData.mobile, navigator.userAgent just for developing tools */

        if(this.isMobile) {
            this.setMobileEvents();
        }

        else {
            this.setDesktopEvents();
        }


        this.setKeys();
        this.loadLocalStorage();
        this.generateTimelineThumbPreview();
        this.clean();
    }

    errorScreen(message) {
        localStorage.removeItem("jkplayer")
        let errorBox = document.createElement("div");
        errorBox.id = "jkplayer-error-box";
        errorBox.innerText = message;
        if(this.targetVideoNode) {
            this.targetVideoNode.replaceWith(errorBox);
        }

        else {
            this.videoBox.replaceWith(errorBox);
        }
    }

    async loadLocalStorage() {
        this.storageSettings = JSON.parse(localStorage.getItem("jkplayer"));
        if(this.storageSettings) {
            await this.storageSettings.volume ? this.videoElement.volume =  this.storageSettings.volume : this.videoElement.volume = this.playerSettings.volume || 1;
            this.volumeActive.style.width = Number(this.videoElement.volume) * 100 + "%";
            await this.storageSettings.muted ? this.videoElement.muted = true : this.videoElement.muted = false;
            if(this.videoElement.muted || this.videoElement.volume === 0) {
                this.videoBox.classList.add("jkplayer-muted");
                this.volumeLabel.dataset.tooltip = this.translateObject.unmute;
            }

            else {
                this.volumeLabel.dataset.tooltip = this.translateObject.mute;
            }
            this.storageSettings.speed ? this.videoElement.playbackRate = this.storageSettings.speed : this.videoElement.playbackRate = 1;
            this.storageSettings.captions ? this.changeCaptionsSource(this.storageSettings.captions) : null;
            this.storageSettings.quality ? this.changeVideoSource(this.storageSettings.quality) : null;
        }

        else {
            localStorage.setItem("jkplayer", "{}");
            this.storageSettings = {};
        }
    }

    updateStorage(name, value) {
        let settings = JSON.parse(localStorage.getItem("jkplayer"));
        settings[name] = value;
        localStorage.setItem("jkplayer", JSON.stringify(settings));
        this.storageSettings = settings;
    }

    preloadIcons(pathToIcons) {
        let icons = [
            "captions-disabled.svg",
            "captions.svg",
            "compress.svg",
            "expand.svg",
            "check.svg",
            "left.svg",
            "pause.svg",
            "pip.svg",
            "play.svg",
            "replay.svg",
            "right.svg",
            "settings.svg",
            "volume-max.svg",
            "volume-muted.svg"
        ]

        icons.forEach(imageName => {
            let XHR = new XMLHttpRequest();
            XHR.open("GET", pathToIcons + imageName);
            XHR.send();
        });
    }

    async buildVideoBox() {
        this.videoBox = document.createElement("div");
        this.videoBox.setAttribute("tabindex", 0);
        this.videoBox.id = "jkplayer-box";
        this.videoBox.classList.add("jkplayer-paused");

        this.videoBox.style.aspectRatio = `${this.targetVideoNode.videoWidth} / ${this.targetVideoNode.videoHeight}`;

        //Create new video element
        await this.buildVideoElement();

        //Create poster box
        if(this.targetVideoNode.poster) {
            this.posterBox = document.createElement("div");
            this.posterBox.id = "jkplayer-poster";
            this.posterBox.style.backgroundImage = `url(${this.targetVideoNode.poster})`;
            this.videoBox.appendChild(this.posterBox);
        }

        //Create captions box
        this.captionsBox = document.createElement("div");
        this.captionsBox.id = "jkplayer-captions";
        this.videoBox.appendChild(this.captionsBox);

        //Create skip time box
        this.skipTimeBox = document.createElement("div");
        this.skipTimeBox.id = "jkplayer-skip-time";
        this.videoBox.appendChild(this.skipTimeBox);

        //Build controls panel
        if(this.targetVideoNode.hasAttribute("controls")) {
            this.buildControlsPanel();
            this.setControlsEvents()
        }

        //Create center play button
        this.centerPlayButton = document.createElement("button");
        this.centerPlayButton.id = "jkplayer-center-play-button";
        this.videoBox.appendChild(this.centerPlayButton);

        //Create replay play button
        this.centerReplayButton = document.createElement("button");
        this.centerReplayButton.id = "jkplayer-center-replay-button";
        this.videoBox.appendChild(this.centerReplayButton);

        await this.targetVideoNode.replaceWith(this.videoBox);
    }

    async buildVideoElement() {
        return new Promise((resolve, reject) => {
            this.videoElement = document.createElement("video");
            this.videoElement.id = "jkplayer-video";
            this.videoElement.setAttribute("playsinline", "");
            this.videoElement.setAttribute("crossorigin", "");

            //Add video sources
            let sources = this.targetVideoNode.querySelectorAll("source");
            sources.forEach(source => {
                let newSource = document.createElement("source")
                newSource.src = source.src;
                newSource.type = source.type || this.getSourceTypeFromFilename(source.src);
                newSource.setAttribute("size", source.getAttribute("size"));
                this.videoElement.appendChild(newSource);
            });

            //Add captions tracks
            let textTracks = this.targetVideoNode.querySelectorAll("track");
            if(textTracks.length > 0) {
                textTracks.forEach(async (track, index) => {
                    try {
                        let captions = await fetch(track.src);
                        captions = await captions.text();
                        if(captions.includes("�")) {
                            console.error(`Caption source ${track.src} isn't utf-8`);
                            return;
                        }
    
                        else {
                            let src;
                            if(captions.startsWith("WEBVTT")) {
                                src = track.src;
                            }
    
                            else if(track.src.substring(track.src.lastIndexOf('.') + 1) === "srt") {
                                captions = this.srtToVtt(captions);
                                const blob = new Blob([captions], {type : "text/plain;charset=utf-8"});
                                src = URL.createObjectURL(blob);
                            }
    
                            else {
                                return;
                            }
    
                            let newTrack = document.createElement("track");
                            newTrack.kind = "captions";
                            newTrack.label = track.label;
                            newTrack.srclang = track.srclang;
                            newTrack.src = src;
                            this.videoElement.appendChild(newTrack);
                        }

                        if(index === textTracks.length - 1) {
                            resolve();
                        }
                    }
    
                    catch(e) {
                        console.error(e);
                    }
                });
                this.videoBox.appendChild(this.videoElement);
            }

            else {
                resolve();
            }
        });
    }

    buildControlsPanel() {
        //Create box for controls
        this.videoControlsBox = document.createElement("div");
        this.videoControlsBox.id = "jkplayer-controls";
        this.videoBox.appendChild(this.videoControlsBox);

        //Play button
        this.controlsPlayLabel = document.createElement("label");
        this.controlsPlayLabel.dataset.tooltip = this.translateObject.play;
        this.controlsPlayLabel.dataset.tooltipPosition = "left";
        this.controlsPlayButton = document.createElement("button");
        this.controlsPlayButton.className = "jkplayer-controls-button";
        this.controlsPlayButton.id = "jkplayer-play-button";
        this.controlsPlayLabel.appendChild(this.controlsPlayButton);
        this.videoControlsBox.appendChild(this.controlsPlayLabel);

        this.currentTime = document.createElement("span");
        this.currentTime.id = "jkplayer-current-time";
        this.videoControlsBox.appendChild(this.currentTime);

        //Create video timeline
        this.timelineBox = document.createElement("div");
        this.timelineBox.id = "jkplayer-timeline-box";
        this.videoControlsBox.appendChild(this.timelineBox);

        //Create chapters box
        this.timelistChaptersBox = document.createElement("div");
        this.timelistChaptersBox.id = "jkplayer-chapters-box";
        this.timelineBox.appendChild(this.timelistChaptersBox);

        //Timeline range box
        this.timelineRangeBox = document.createElement("div");
        this.timelineRangeBox.id = "jkplayer-timeline-range";
        this.timelineBox.appendChild(this.timelineRangeBox);

        this.timelineBuffered = document.createElement("div");
        this.timelineBuffered.id = "jkplayer-timeline-buffered";
        this.timelineRangeBox.appendChild(this.timelineBuffered);

        this.timelineRange = document.createElement("div");
        this.timelineRange.id = "jkplayer-timeline-range-current";
        this.timelineRangeBox.appendChild(this.timelineRange);

        //Create timeline thumb
        this.timelineThumb = document.createElement("div");
        this.timelineThumb.id = "jkplayer-timeline-thumb";
        this.timelineBox.appendChild(this.timelineThumb);

        this.timelineThumbTime = document.createElement("span");
        this.timelineThumbTime.id = "jkplayer-timeline-thumb-time";
        this.timelineThumb.appendChild(this.timelineThumbTime);

        this.timelineThumbName = document.createElement("span");
        this.timelineThumbName.id = "jkplayer-timeline-thumb-name";
        this.timelineThumb.appendChild(this.timelineThumbName);

        //Create duration time
        this.videoLengthSpan = document.createElement("span");
        this.videoLengthSpan.id = "jkplayer-duration-time";
        this.videoControlsBox.appendChild(this.videoLengthSpan);

        //Create volume box
        this.volumeBox = document.createElement("div");
        this.volumeBox.id = "jkplayer-volume-box";
        this.videoControlsBox.appendChild(this.volumeBox);

        //Create volume button
        this.volumeLabel = document.createElement("label");
        this.volumeLabel.dataset.tooltip = this.translateObject.mute;
        this.volumeButton = document.createElement("button");
        this.volumeButton.id = "jkplayer-volume-button";
        this.volumeButton.className = "jkplayer-controls-button";
        this.volumeLabel.appendChild(this.volumeButton);
        this.volumeBox.appendChild(this.volumeLabel);

        //Create volume slider
        this.volumeRange = document.createElement("div");
        this.volumeRange.id = "jkplayer-volume-range";
        this.volumeBox.appendChild(this.volumeRange);

        this.volumeActive = document.createElement("div");
        this.volumeActive.id = "jkplayer-volume-active";
        this.volumeRange.appendChild(this.volumeActive);

        //Captions button
        if(this.videoElement.textTracks.length != 0) {
            this.captionsLabel = document.createElement("label");
            this.captionsLabel.dataset.tooltip = this.translateObject.enableCaptions;
            this.captionsButton = document.createElement("button");
            this.captionsButton.id = "jkplayer-subtitles-button"
            this.captionsButton.className = "jkplayer-controls-button";
            this.captionsLabel.appendChild(this.captionsButton);
            this.videoControlsBox.appendChild(this.captionsLabel);
        }

        //Settings box
        this.settingsBox = document.createElement("div");
        this.settingsBox.id = "jkplayer-settings-box";
        this.videoControlsBox.appendChild(this.settingsBox);

        //Settings button
        this.settingsLabel = document.createElement("label");
        this.settingsLabel.dataset.tooltip = this.translateObject.settings;
        this.settingsButton = document.createElement("button");
        this.settingsButton.id = "jkplayer-settings-button";
        this.settingsButton.className = "jkplayer-controls-button";
        this.settingsLabel.appendChild(this.settingsButton);
        this.settingsBox.appendChild(this.settingsLabel);

        //Settings menu
        this.settingsMenu = document.createElement("div");
        this.settingsMenu.id = "jkplayer-settings-menu";
        this.settingsBox.appendChild(this.settingsMenu);

        this.buildSettingsBox();

        //Fullscreen button
        this.fullscreenLabel = document.createElement("label");
        this.fullscreenLabel.dataset.tooltip = this.translateObject.fullScreen;
        this.fullscreenLabel.dataset.tooltipPosition = "right";
        this.fullscreenButton = document.createElement("button");
        this.fullscreenButton.id = "jkplayer-fullscreen-button"
        this.fullscreenButton.className = "jkplayer-controls-button";
        this.fullscreenLabel.appendChild(this.fullscreenButton);
        this.videoControlsBox.appendChild(this.fullscreenLabel);
    }

    buildSettingsBox() {
        let options = [];
        let storageSettings = localStorage.getItem("jkplayer") ? JSON.parse(localStorage.getItem("jkplayer")) : {};

        if(this.videoElement.textTracks.length > 0) {
            let captionsOption = {
                name: this.translateObject.captions, active: storageSettings.captions || this.translateObject.disabled, value: [{name: this.translateObject.disabled, value: this.translateObject.disabled}]
            }

            for(let i = 0; i < this.videoElement.textTracks.length; i++) {
                let option = {name: this.videoElement.textTracks[i].label, value: this.videoElement.textTracks[i].language}
                captionsOption.value.push(option);
            }

            options.push(captionsOption);
        }

        let videoSources = this.videoElement.querySelectorAll("source");

        if(videoSources.length > 1) {
            let qualityOptions = {
                name: this.translateObject.quality, active: storageSettings.quality || this.translateObject.auto, value: [{name: this.translateObject.auto, value: this.translateObject.auto}]
            }

            for(let i = 0; i < videoSources.length; i++) {
                let option = { name: videoSources[i].getAttribute("size") + "p", value: videoSources[i].getAttribute("size")}
                qualityOptions.value.push(option);
            }

            options.push(qualityOptions);
        }

        let speedOptions =  this.playerSettings.speedOptions ||  [0.25, 0.50, 0.75, 1, 1.25, 1.5, 1.75, 2, 4];
        let videoSpeed = { name: this.translateObject.speed, active: storageSettings.speed || 1, value: []};

        speedOptions.forEach(time => {
            let option = {name: time + "×", value: time}
            videoSpeed.value.push(option);
        });
        options.splice(options.length - 1, 0, videoSpeed);

        let mainScreen = document.createElement("div");
        mainScreen.classList.add("jkplayer-settings-screen");
        mainScreen.classList.add("jkplayer-settings-screen-main");
        this.settingsMenu.appendChild(mainScreen);

        options.forEach(option => {
            let mainOptionElement = document.createElement("div");
            mainOptionElement.classList.add("jkplayer-settions-option");
            let optionName = document.createElement("span");
            optionName.classList.add("jkplayer-settings-name");
            optionName.innerText = option.name;
            mainOptionElement.appendChild(optionName);

            let optionValue = document.createElement("span");
            optionValue.classList.add("jkplayer-settings-active-value");
            optionValue.innerHTML  = option.active;
            mainOptionElement.appendChild(optionValue);

            mainScreen.appendChild(mainOptionElement);

            let optionScreen = document.createElement("div");
            optionScreen.classList.add("jkplayer-settings-screen");
            optionScreen.setAttribute("hidden", "");
            let optionScreenHeader = document.createElement("div");
            optionScreenHeader.innerText = option.name;
            optionScreenHeader.classList.add("jkplayer-settings-screen-header");
            optionScreen.appendChild(optionScreenHeader);

            mainOptionElement.addEventListener("click", () => {
                this.settingsMenu.querySelector(".jkplayer-settings-screen:not([hiddden])").setAttribute("hidden", "");
                optionScreen.removeAttribute("hidden");
            });

            optionScreenHeader.addEventListener("click", () => {
                optionScreen.setAttribute("hidden", "");
                mainScreen.removeAttribute("hidden");
            });

            option.value.forEach(submenuOption => {
                let optionElement = document.createElement("div");
                optionElement.classList.add("jkplayer-settions-option");
                if(option.active === submenuOption.value) optionElement.classList.add("active");
                if(option.name === this.translateObject.captions) {
                    optionElement.addEventListener("click", () => {
                        this.changeCaptionsSource(submenuOption.value);
                    });
                }

                else if(option.name === this.translateObject.quality) {
                    optionElement.addEventListener("click", () => {
                        this.changeVideoSource(submenuOption.value);
                    });
                }

                else if(option.name === this.translateObject.speed) {
                    optionElement.addEventListener("click", () => {
                        this.changeVideoSpeed(submenuOption.value);
                    });
                }

                optionElement.onclick = (e) => {
                    if (e.target.parentElement.querySelector(".active")) {
                        e.target.parentElement.querySelector(".active").classList.remove("active");
                    }

                    optionValue.innerText = submenuOption.name;

                    e.target.classList.add("active");
                    this.videoBox.classList.remove("jkplayer-open-settings");
                }

                optionElement.innerText = submenuOption.name;
                optionScreen.appendChild(optionElement);
            });

            this.settingsMenu.appendChild(optionScreen);
        });
    }

    buildChapters(chapters) {
        if(this.timelistChaptersBox.querySelector(".jkplayer-chapter")) {
            return;
        }

        if(chapters && Array.isArray(chapters)) {
            let videoDuration = this.videoDuration / 100;
            //Sort chapters by time
            chapters.sort((a, b) => {
                return a.time.localeCompare(b.time);
            });
            chapters.forEach((chapterData, index) => {
                if(isNaN(chapterData.time)) {
                    chapterData.time = this.secondsFromTime(chapterData.time);
                }

                if(chapterData.time <= this.videoDuration && chapterData.time >= 0) {
                    let chapter = document.createElement("div");
                    chapter.classList.add("jkplayer-chapter");
                    let endTime = chapters[index + 1] ? this.secondsFromTime(chapters[index + 1].time) : this.videoDuration;
                    if(endTime > this.videoDuration) {
                        console.warn("Cropping chapter, end time is out of range");
                        endTime = this.videoDuration;
                    }

                    let width = this.widthFromTime(endTime - chapterData.time);
                    let left = (chapterData.time / videoDuration);

                    chapter.style.width = `calc(${width}% - 3px)`;
                    chapter.style.left = left + "%";
                    chapter.style.backgroundColor = chapterData.color;
                    chapter.dataset.name = chapterData.name || "";
                    this.timelistChaptersBox.appendChild(chapter);
                }

                else {
                    console.warn("Chapter is out of range");
                }
            });
        }

        else {
            let chapter = document.createElement("div");
            chapter.classList.add("jkplayer-chapter");
            chapter.style.width = "100%";
            chapter.style.left = "0";
            this.timelistChaptersBox.appendChild(chapter);
        }
    }

    setVideoEvents() {
        //Prevent context menu
        this.videoBox.addEventListener("contextmenu", (e) => {
            e.preventDefault();
        });

        this.videoElement.addEventListener("error", (e) => {
            console.error(e);
        });

        //Poster box
        if(this.posterBox) this.posterBox.addEventListener("click", () => {
            this.videoElement.play();
            this.posterBox.remove();
        });

        //Video onload data
        this.videoElement.addEventListener("loadedmetadata", this.videoOnload.bind(this));

        //Reply
        this.videoElement.addEventListener("ended", () => {
            this.videoBox.classList.add("jkplayer-replay");
            this.controlsPlayLabel.dataset.tooltip = this.translateObject.replay;
        });

        //Video duration change
        this.videoElement.addEventListener("durationchange", () => {
            this.videoDuration = this.videoElement.duration;
            this.videoLengthSpan.innerText = this.timeFromSeconds(this.videoDuration);
        });

        //Buffered
        //this.videoElement.addEventListener("progress", this.changeBuffered.bind(this));

        //Play, pause
        this.centerPlayButton.addEventListener("click", this.togglePlay.bind(this));
        this.videoElement.addEventListener('pause', () => {
            this.videoBox.classList.add("jkplayer-paused");
            this.videoBox.classList.remove("jkplayer-playing");
            this.controlsPlayLabel.dataset.tooltip = this.translateObject.play;
        });

        this.videoElement.addEventListener('play', () => {
            this.controlsPlayLabel.dataset.tooltip = this.translateObject.pause;

            if(this.posterBox) {
                this.posterBox.remove();
            }

            this.videoBox.classList.remove("jkplayer-paused");
            this.videoBox.classList.add("jkplayer-playing");
        });

        
        this.centerReplayButton.addEventListener("click", () => {
            this.videoBox.classList.remove("jkplayer-replay");
            this.videoElement.currentTime = 0;
            this.videoElement.play();
        });

        //Volume
        this.videoElement.addEventListener("volumechange", () => {
            this.updateStorage("volume", this.videoElement.volume.toFixed(2));
            if(this.videoElement.volume === 0 || this.videoElement.muted) {
                this.videoBox.classList.add("jkplayer-muted");
                this.volumeLabel.dataset.tooltip = this.translateObject.unmute;
            }

            else {
                this.videoBox.classList.remove("jkplayer-muted");
                this.videoElement.muted = false;
                this.volumeLabel.dataset.tooltip = this.translateObject.mute;
            }

            this.volumeActive.style.width = Number(this.videoElement.volume * 100) + "%";
        });

        //Time events
        this.videoElement.addEventListener("timeupdate", () => {
            let width = this.widthFromTime(this.videoElement.currentTime);
            this.timelineRange.style.width = width + "%";
            this.timelineBuffered.style.left = width + "%";
            this.currentTime.innerText = this.timeFromSeconds(this.videoElement.currentTime);
        });

        //PIP events
        this.videoElement.addEventListener("enterpictureinpicture", () => {
            this.videoBox.classList.add("jkplayer-pip");
        });

        this.videoElement.addEventListener("leavepictureinpicture", () => {
            this.videoBox.classList.remove("jkplayer-pip");
        });

        //Loading
        this.videoElement.addEventListener("waiting", () => {
            this.videoBox.classList.add("jkplayer-loading");
        });

        this.videoElement.addEventListener("canplay", () => {
            this.videoBox.classList.remove("jkplayer-loading");
        });
    }

    setControlsEvents() {
        //Fullscreen
        this.fullscreenButton.addEventListener("click", this.toggleFullscreen.bind(this));
        document.addEventListener('fullscreenchange', () => {
            if(document.fullscreenElement) {
                this.videoBox.classList.add("jkplayer-fullscreen");
                this.fullscreenLabel.dataset.tooltip = this.translateObject.exitFullScreen;
            }

            else {
                this.videoBox.classList.remove("jkplayer-fullscreen");
                this.fullscreenLabel.dataset.tooltip = this.translateObject.fullScreen;
            }
        });

        //Play pause
        this.controlsPlayButton.addEventListener("click", this.togglePlay.bind(this));

        //Mute
        this.volumeButton.addEventListener("click", this.toggleMute.bind(this));

        this.volumeRange.addEventListener("wheel", (e) => {
            e.preventDefault()
            if(e.deltaY > 0) {
                this.changeVolume("-");
            }

            else {
                this.changeVolume("+");
            }
        });

        //Subtitles
        if(this.captionsButton) {
            this.captionsButton.addEventListener("click", () => {
                this.toggleCaptions();
            });
        }

        this.captionsChangeEvent = this.changeCaptions.bind(this);

        this.settingsButton.addEventListener("click", this.toggleSettings.bind(this));
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

                case "KeyI": 
                    this.togglePip();
                    break;

                case "KeyC": 
                    this.toggleCaptions();
                    break;

                case "KeyS": 
                    this.toggleSettings(e);
                    break;

                /*
                    TODO Start media key, pause media key
                */ 
            }
        });
    }

    setDesktopEvents() {
        //PIP button
        if(this.settingsBox) {
            this.pipLabel = document.createElement("label");
            this.pipLabel.dataset.tooltip = this.translateObject.pip;
            this.pipButton = document.createElement("button");
            this.pipButton.id = "jkplayer-pip-button";
            this.pipButton.className = "jkplayer-controls-button";
            this.pipLabel.appendChild(this.pipButton);
            this.settingsBox.insertAdjacentElement("afterend", this.pipLabel);
    
            //Picture in picture
            this.pipButton.addEventListener("click",this.togglePip.bind(this));
        }

        //Play pause
        this.videoElement.addEventListener("dblclick", (e) => {
            e.stopPropagation()
            this.toggleFullscreen();
        });
        
        this.videoElement.addEventListener("click", this.togglePlay.bind(this));

        //Hide when not active

        let awaitTimeout;
        let controlsAwait = () => {
            this.videoBox.classList.remove("jkplayer-hidden-controls");

            if(awaitTimeout) {
                clearTimeout(awaitTimeout);
            }

            awaitTimeout = setTimeout(() => {
                this.videoBox.classList.add("jkplayer-hidden-controls");
            }, 4000);

            //TODO await time by config
        }

        //Controls events
        this.videoBox.addEventListener("mouseenter", () => {
            this.videoBox.classList.remove("jkplayer-hidden-controls");
            document.addEventListener("mousemove", controlsAwait);
        });

        this.videoBox.addEventListener("mouseleave", () => {
            this.videoBox.classList.add("jkplayer-hidden-controls");
            document.removeEventListener("mousemove", controlsAwait);
        });

        //Change timeline position
        let moveTimeUpdate = (e) => {
            let bounding = this.timelineBox.getBoundingClientRect();
            let width = ((e.clientX - bounding.left) / bounding.width) * 100;
            width = width > 100 ? 100 : width;
            this.timelineRange.style.width =  width + "%";
            return width;
        }

        let finalTimeUpdate = (e) => {
            document.removeEventListener("mousemove", moveTimeUpdate);
            document.removeEventListener("mouseup", finalTimeUpdate);
            let width = moveTimeUpdate(e);
            width = width > 100 ? 100 : width;
            this.videoElement.currentTime = this.timeFromWidth(width);
            if(this.oldPlay) {
                this.videoElement.play();
            }
        }

        this.timelineBox.addEventListener("mousedown", (e) => {
            if(this.videoElement.paused) {
                this.oldPlay = false;
            }

            else {
                this.oldPlay = true;
                this.videoElement.pause();
            }

            if(this.posterBox) {
                this.posterBox.remove();
            }
            
            moveTimeUpdate(e);
            document.addEventListener("mousemove", moveTimeUpdate);
            document.addEventListener("mouseup", finalTimeUpdate);
        });

        //Volume
        let changeVolume = (e) => {
            if(e.offsetX > 0) {
                this.videoElement.muted = false;
                let bounding = this.volumeRange.getBoundingClientRect();
                let value = ((e.clientX - bounding.left) / this.volumeRange.offsetWidth);
                value > 1 ? value = 1 : value;
                value < 0 ? value = 0 : value;

                this.volumeActive.style.width = (value * 100) + "%";
                this.videoElement.volume = value;
            }
        }

        this.volumeRange.addEventListener("mousedown", (e) => {
            changeVolume(e);
            document.addEventListener("mousemove", changeVolume);

            document.addEventListener("mouseup", () => {
                document.removeEventListener("mousemove", changeVolume);
            });
        });

        //Thumb events
        this.timelineBox.addEventListener("mouseenter", () => {
            this.timelineThumb.style.display = "block";
        });

        this.timelineBox.addEventListener("mousemove", (e) => {
            this.changeTimelineThumb(e);
        });

        this.timelineBox.addEventListener("mouseleave", () => {
            this.timelineThumb.style.display = "none";
        });
    }

    setMobileEvents() {
        this.videoBox.classList.add("jkplayer-mobile");

        let touched = false;
        let touchedTimeout;
        let hideControlsTimeout;

        this.videoElement.addEventListener("touchstart", (e) => {
            if(touched) {
                e.preventDefault();
                e.stopPropagation();
                let half = this.videoBox.clientWidth / 2;
                if(e.touches[0].clientX > half) {
                    this.skipTime("+");
                }

                else {
                    this.skipTime("-");
                }
                clearTimeout(touchedTimeout);
            }

            touched = true;
            touchedTimeout = setTimeout(() => {touched = false}, 300);
            this.videoBox.classList.remove("jkplayer-hidden-controls");
            clearTimeout(hideControlsTimeout);
            hideControlsTimeout = setTimeout(() => {
                this.videoBox.classList.add("jkplayer-hidden-controls");
            }, 4000);
        });

        //Update time
        let moveTimeUpdate = (e) => {
            let bounding = this.timelineBox.getBoundingClientRect();
            let width = ((e.changedTouches[0].clientX - bounding.left) / bounding.width) * 100;
            width = width > 100 ? 100 : width;
            this.timelineRange.style.width =  width + "%";
            return width;
        }

        let finalTimeUpdate = (e) => {
            document.removeEventListener("touchmove", moveTimeUpdate);
            document.removeEventListener("touchend", finalTimeUpdate);
            let width = moveTimeUpdate(e);
            width = width > 100 ? 100 : width;
            this.videoElement.currentTime = this.timeFromWidth(width);
            if(this.oldPlay) {
                this.videoElement.play();
            }
        }

        this.timelineBox.addEventListener("touchstart", (e) => {
            if(this.videoElement.paused) {
                this.oldPlay = false;
            }

            else {
                this.oldPlay = true;
                this.videoElement.pause();
            }

            if(this.posterBox) {
                this.posterBox.remove();
            }
            moveTimeUpdate(e);
            document.addEventListener("touchmove", moveTimeUpdate);
            document.addEventListener("touchend", finalTimeUpdate);
        });

        //Volume
        let changeVolume = (e) => {
            if(e.touches[0].clientX > 0) {
                this.videoElement.muted = false;
                let bounding = this.volumeRange.getBoundingClientRect();
                let value = ((e.touches[0].clientX - bounding.left) / this.volumeRange.offsetWidth);
                value > 1 ? value = 1 : value;
                value < 0 ? value = 0 : value;

                this.volumeActive.style.width = (value * 100) + "%";
                this.videoElement.volume = value;
            }
        }

        this.volumeRange.addEventListener("touchstart", (e) => {
            changeVolume(e);
            document.addEventListener("touchmove", changeVolume);

            document.addEventListener("touchend", () => {
                document.removeEventListener("touchmove", changeVolume);
            });
        });
    }

    changeBuffered() {
        if(this.videoElement.buffered.length > 0) {
            let bufferedTime = this.videoElement.buffered.end(0);
            let bufferedPercent = (bufferedTime / this.videoDuration) * 100;
            this.timelineBuffered.style.width =  bufferedPercent + "%";
        }
    }

    videoOnload() {
        this.videoDuration = this.videoElement.duration;
        this.videoLengthSpan.innerText = this.timeFromSeconds(this.videoDuration);
        this.currentTime.innerText = this.timeFromSeconds(this.videoElement.currentTime);
        this.buildChapters(this.videoData.chapters);
    }

    changeTimelineThumb(e) {
        let timelineBound = this.timelineBox.getBoundingClientRect();
        let timelineWidth = this.timelineBox.clientWidth;
        let videoDuration = this.videoDuration;
        let progresstime = Math.floor(((e.clientX - timelineBound.left) / timelineWidth) * videoDuration);
        if(progresstime >= 0) {
            this.timelineThumbTime.innerText = this.timeFromSeconds(progresstime);
            this.timelineThumb.style.left = `${e.clientX - timelineBound.left}px`;

            if(e.target.classList.contains("jkplayer-chapter")) {
                this.timelineThumbName.innerText = e.target.dataset.name || "";
                this.timelineThumbName.style.color = e.target.style.backgroundColor || "";
            }
    
            for (var item of this.thumbnails) {
                var data = item.sec.find(x1 => x1.index === Math.floor(progresstime));
                if (data) {
                    if (item.data != undefined) {
                        this.timelineThumb.style.backgroundImage = `url(${item.data})`;
                        this.timelineThumb.style.backgroundPosition = `${data.backgroundPositionX}px ${data.backgroundPositionY}px`;
                        return;
                    }
                }
            }
        }
    }

    generateTimelineThumbPreview() {
        this.thumbnails = [];

        var thumbnailWidth = 158;
        var thumbnailHeight = 90;
        var horizontalItemCount = 5;
        var verticalItemCount = 5;

        let preview_video = document.createElement('video');
        preview_video.preload = "metadata";
        preview_video.width = "500";
        preview_video.height = "300"
        preview_video.controls = true;

        preview_video.src = this.videoElement.currentSrc;
        preview_video.addEventListener("loadeddata", async () => {
            preview_video.pause();
            var count = 1;
            var id = 1;
            var x = 0,
                y = 0;
            var array = [];
            var duration = parseInt(preview_video.duration);

            for (var i = 1; i <= duration; i++) {
                array.push(i);
            }

            var canvas;
            var i, j;

            for (i = 0, j = array.length; i < j; i += horizontalItemCount) {
                for (var startIndex of array.slice(i, i + horizontalItemCount)) {
                    var backgroundPositionX = x * thumbnailWidth;
                    var backgroundPositionY = y * thumbnailHeight;
                    var item = this.thumbnails.find((x) => x.id === id);

                    if (!item) {
                        canvas = document.createElement("canvas");
                        canvas.width = thumbnailWidth * horizontalItemCount;
                        canvas.height = thumbnailHeight * verticalItemCount;
                        this.thumbnails.push({
                        id: id,
                        canvas: canvas,
                            sec: [
                                {
                                    index: startIndex,
                                    backgroundPositionX: -backgroundPositionX,
                                    backgroundPositionY: -backgroundPositionY,
                                },
                            ],
                        });
                    } 
                    
                    else {
                        canvas = item.canvas;
                            item.sec.push({
                            index: startIndex,
                            backgroundPositionX: -backgroundPositionX,
                            backgroundPositionY: -backgroundPositionY,
                        });
                    }
                    var context = canvas.getContext("2d");
                    preview_video.currentTime = startIndex;
                    await new Promise((resolve) => {
                        var event = function () {
                            context.drawImage(
                                preview_video,
                                backgroundPositionX,
                                backgroundPositionY,
                                thumbnailWidth,
                                thumbnailHeight
                            );
                            x++;
                            preview_video.removeEventListener("canplay", event);
                            resolve();
                        };
                        preview_video.addEventListener("canplay", event);
                    });
                    count++;
                }

                x = 0;
                y++;
                if (count > horizontalItemCount * verticalItemCount) {
                    count = 1;
                    x = 0;
                    y = 0;
                    id++;
                }

                console.log("Generating")
            }

            this.thumbnails.forEach((item) => {
                item.canvas.toBlob((blob) => (item.data = URL.createObjectURL(blob)), "image/jpeg");
                delete item.canvas;
            });

            console.log("done...");
        });
    }

    toggleFullscreen() {
        if(document.fullscreenElement) {
            document.exitFullscreen();
        }
        
        else {
            try {
                this.videoBox.requestFullscreen();
            }

            catch(e) {
                console.error(e);
            }
        }
    }

    togglePlay() {
        this.videoBox.classList.remove("jkplayer-replay");
        if(this.videoElement.paused) {
            this.videoElement.play();
        }

        else {
            this.videoElement.pause();
        }
    }

    toggleMute() {
        if(this.videoElement.muted) {
            this.videoElement.muted = false;
            this.videoElement.volume = this.oldVolume || 1;
            this.updateStorage("muted", false);
        }

        else {
            this.videoElement.muted = true;
            this.oldVolume = this.videoElement.volume;
            this.videoElement.volume = 0;
            this.updateStorage("muted", true);
        }
    }

    toggleSettings(e) {
        e.stopPropagation();

        //Settings events
        if(this.videoBox.classList.contains("jkplayer-open-settings")) {
            this.videoBox.classList.remove("jkplayer-open-settings");
        }

        else {
            let oldActive = this.settingsBox.querySelector(".jkplayer-settings-screen:not(.jkplayer-settings-screen-main):not([hidden])");
            if(oldActive) {
                oldActive.setAttribute("hidden", "");
            }

            this.settingsBox.querySelector(".jkplayer-settings-screen-main").removeAttribute("hidden");
            let hideSettingsBox = (e) => {
                if(!this.settingsMenu.contains(e.target)) {
                    e.stopPropagation();
                    this.videoBox.classList.remove("jkplayer-open-settings");
                    document.removeEventListener("click", hideSettingsBox);
                }
            };
            document.addEventListener("click", hideSettingsBox);
            this.videoBox.classList.add("jkplayer-open-settings");
        }
    }

    changeVolume(direction = "+") {
        this.videoElement.muted = false;
        let volume = Number(this.videoElement.volume.toFixed(2));

        if(direction === "+") {
            volume += 0.05;
        }

        else {
            volume -= 0.05;
        }

        volume > 1 ? volume = 1 : volume;
        volume < 0 ? volume = 0 : volume;

        this.videoElement.volume = volume;
    }

    skipTime(direction = "+") {
        //TODO skip time by config
        if(direction === "-") {
            this.videoElement.currentTime -= 10;
        }

        else if(direction === "start") {
            this.videoElement.currentTime = 0;
        }

        else if(direction === "end") {
            this.videoElement.currentTime = this.videoDuration;
        }

        else {
            this.videoElement.currentTime += 10;
        }
    }

    togglePip() {
        if(document.pictureInPictureElement !== null) {
            document.exitPictureInPicture();
        }

        else {
            this.videoElement.requestPictureInPicture();
        }
    }

    changeVideoSource(resolution) {
        //TODO Error 404
        if(resolution === this.translateObject.auto) {
            console.log("Auto check resolution")
        }

        else {
            let source = this.videoElement.querySelector(`source[size="${resolution}"]`);
            if(source) {
                let canPlay = this.videoElement.canPlayType(source.type);
                if(canPlay === "") {
                    console.error(`Browser doesn't support ${source.type}`);
                    this.errorScreen(this.translateObject.unsupportedVideoByBrowser);
                }

                else {
                    let play;
                    this.videoElement.paused ? play = false : play = true;
                    this.updateStorage("quality", resolution);
                    let currentTime = this.videoElement.currentTime;
                    this.videoElement.src = source.src;
                    this.videoElement.currentTime = currentTime;
                    if(play) this.videoElement.play();
                }
            }
    
            else {
                console.error("Can't load video source");
                //TODO Source doesnt exists
            }
        }
    }

    changeVideoSpeed(speed) {
        this.videoElement.playbackRate = speed;
        this.updateStorage("speed", speed)
    }

    toggleCaptions(lang) {
        //Get active captions source
        let id = -1;
        for (let i = 0; i < this.videoElement.textTracks.length; i++) {
            if(this.videoElement.textTracks[i].mode === "hidden") {
                id = i;
                break;
            }
        }

        if(id >= 0) {
            this.videoBox.classList.remove("jkplayer-subtitles-enabled");
            this.videoElement.textTracks[id].mode = "disabled";
            this.videoElement.textTracks[id].removeEventListener('cuechange', this.captionsChangeEvent);
            this.updateStorage("captions", false);
        }

        else {
            //Select best captions language
            let language;
            if(lang) {
                language = lang;
            }

            else if(this.storageSettings.captions) {
                language = this.storageSettings.captions;
            }

            else {
                //Detect client language for default captions
                let browserLanguage = navigator.languages[0];
                if(browserLanguage.includes("-")) {
                    language = browserLanguage.split("-")[0];
                }

                else {
                    language = browserLanguage;
                }
            }

            let id = 0;
            for(let i = 0; i < this.videoElement.textTracks.length; i++) {
                if(this.videoElement.textTracks[i].language == language) {
                    id = i;
                    break;
                }
            }

            this.videoBox.classList.add("jkplayer-subtitles-enabled");
            this.videoElement.textTracks[id].mode = "hidden";
            this.videoElement.textTracks[id].addEventListener('cuechange', this.captionsChangeEvent);
            this.updateStorage("captions", language);
        }
    }

    changeCaptionsSource(lang) {
        //TODO Error 404
        for (let i = 0 ; i < this.videoElement.textTracks.length; i++) {
            if(this.videoElement.textTracks[i].mode === "hidden") {
                this.videoElement.textTracks[i].mode = "disabled";
                this.videoElement.textTracks[i].removeEventListener('cuechange', this.captionsChangeEvent);
            }
        }

        if(lang !== this.translateObject.disabled) {
            let id = -1;
            for (let i = 0; i < this.videoElement.textTracks.length; i++) {
                if(this.videoElement.textTracks[i].language === lang) {
                    id = i;
                    break;
                }
            }
    
            if(id >= 0) {
                this.videoBox.classList.add("jkplayer-subtitles-enabled");
                this.videoElement.textTracks[id].mode = "hidden";
                this.videoElement.textTracks[id].addEventListener('cuechange', this.captionsChangeEvent);
                this.updateStorage("captions", lang);
            }
        }

        else {
            this.updateStorage("captions", false);
        }
    }

    changeCaptions(e) {
        let activeCues = e.srcElement;
        if(activeCues.activeCues[0]) {
            this.captionsBox.innerHTML = activeCues.activeCues[0].text;
        }

        else {
            this.captionsBox.innerText = "";
        }
    }

    srtToVtt(data) {
        let srt = data.replace(/\r+/g, '');
        srt = srt.replace(/^\s+|\s+$/g, '');
        let cuelist = srt.split('\n\n');
        let result = "";

        let convertSrtCue = (caption) => {
            caption = caption.replace(/<[a-zA-Z\/][^>]*>/g, '');
            let cue = "";
            let s = caption.split(/\n/);
            while (s.length > 3) {
                for (let i = 3; i < s.length; i++) {
                    s[2] += "\n" + s[i]
                }
                s.splice(3, s.length - 3);
            }
    
            let line = 0;
            if (!s[0].match(/\d+:\d+:\d+/) && s[1].match(/\d+:\d+:\d+/)) {
                cue += s[0].match(/\w+/) + "\n";
                line += 1;
            }
    
            if (s[line].match(/\d+:\d+:\d+/)) {
                let m = s[1].match(/(\d+):(\d+):(\d+)(?:,(\d+))?\s*--?>\s*(\d+):(\d+):(\d+)(?:,(\d+))?/);
                if (m) {
                    cue += m[1]+":"+m[2]+":"+m[3]+"."+m[4]+" --> "+m[5]+":"+m[6]+":"+m[7]+"."+m[8]+"\n";
                    line += 1;
                }
    
                else {
                    return "";
                }
            }
    
            else {
                return "";
            }
    
            if (s[line]) {
              cue += s[line] + "\n\n";
            }
            return cue;
        }

        if (cuelist.length > 0) {
          result += "WEBVTT\n\n";
          for (let i = 0; i < cuelist.length; i=i+1) {
            result += convertSrtCue(cuelist[i]);
          }
        }
        return result;
    }

    timeFromSeconds(seconds) {
        //More than hour
        if(this.videoDuration > 3600) {
            let currentHours = Math.floor(seconds / 3600);
            seconds= Math.floor(seconds % 3600);
            let currentMin = Math.floor(seconds / 60);
            let currentSec = Math.floor(seconds % 60);
            currentHours < 10 ? currentHours = "0" + currentHours : currentHours;
            currentMin < 10 ? currentMin = "0" + currentMin : currentMin;
            currentSec < 10 ? currentSec = "0" + currentSec : currentSec;
    
            return `${currentHours}:${currentMin}:${currentSec}`;
        }

        //More than minute
        else if (this.videoDuration > 60) {
            let currentMin = Math.floor(seconds / 60);
            let currentSec = Math.floor(seconds % 60);
            currentMin < 10 ? currentMin = "0" + currentMin : currentMin;
            currentSec < 10 ? currentSec = "0" + currentSec : currentSec;
    
            return `${currentMin}:${currentSec}`;
        }

        else {
            seconds < 10 ? seconds = "0" + Math.floor(seconds) : seconds = Math.floor(seconds);
            return `00:${seconds}`;
        }
    }

    getSourceTypeFromFilename(filename) {
        let extension = filename.split(/[#?]/)[0].split('.').pop().trim().toLowerCase();
        let type;

        switch (extension) {
            case "mp4":
            case "m4v":
            case "mov":
                type = "video/mp4";
                break;

            case "ogv":
                type = "video/ogg";
                break;

            case "webm":
                type = "video/webm";
                break;
        }

        return type;
    }

    secondsFromTime(time) {
        let timeArray = time.split(":");
        if(timeArray.length === 1) {
            if(!isNaN(timeArray[0]) && timeArray[0] >= 0 && timeArray[0] <= 60 ) {
                return timeArray[0];
            }

            else {
                console.error("Wrong time format: " + time);
            }
        }

        else if(timeArray.length === 2) {
            if(!isNaN(timeArray[0]) && timeArray[0] >= 0 && timeArray[0] <= 60 && !isNaN(timeArray[1]) && timeArray[1] >= 0 && timeArray[1] <= 60) {
                return Number(timeArray[0] * 60) + Number(timeArray[1]);
            }

            else {
                console.error("Wrong time format: " + time);
            }
        }

        else if(timeArray.length === 3) {
            if(!isNaN(timeArray[0]) && timeArray[0] >= 0 && timeArray[0] <= 24 && !isNaN(timeArray[1]) && timeArray[1] >= 0 && timeArray[2] <= 60 && !isNaN(timeArray[2]) && timeArray[2] >= 0 && timeArray[2] <= 60) {
                return Number(timeArray[0] * 3600) + Number(timeArray[1] * 60) + Number(timeArray[2]);
            }

            else {
                console.error("Wrong time format: " + time);
            }
        }

        else {
            console.error("Wrong time format: " + time);
        }
    }

    widthFromTime(seconds) {
        return (seconds / this.videoDuration) * 100;
    }

    timeFromWidth(width) {
        return (width / 100) * this.videoDuration;
    }

    clean() {
        delete this.targetVideoNode;
    }
}