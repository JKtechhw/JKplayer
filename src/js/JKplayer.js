'use strict';

/*
    //TODO Volume indicator
    TODO Playlist
    TODO Skip time indicator
    //TODO Skip time from config
    //TODO Check sources before adding
    //TODO ? Manipulate with captions
    //TODO Play singe touch
    TODO Doubletouch event
    TODO Contextmenu
    //TODO Allow download
    TODO Update to api
    //TODO Detect double sources with same quality
    //TODO Build chapters only ones
    TODO ? Reload when loading
    TODO Auto video quality
    //TODO build controls earlier
    TODO Google cast
    //TODO Video element is muted
    TODO Debugging levels
    TODO ? Developer tools
    TODO Notifications
    TODO Preload icons
    TODO Captions disable in settings menu
    TODO Save progress to session storage
    //TODO Display % hovering on volume
    TODO Buffered
    TODO Test media keys
    TODO Controls settings menu with arrows
    TODO Build from object
*/

class JKplayer {
    constructor(targetID, settings = [], videoData = {}) {
        this.targetVideoNode = document.querySelector(targetID);
        this.playerSettings = settings;
        if(this.targetVideoNode) {
            if(this.targetVideoNode.nodeName.toLowerCase() === "video") {
                this.videoData = videoData;

                //You can translate player here
                this.translateObject = {
                    download: "Stáhnout",
                    quality: "Kvalita",
                    captions: "Titulky",
                    cast: "Chrome cast",
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

                this.debugging(this.playerSettings.debugging);
                this.setPlayer();
            }

            else {
                console.error("Target element isn't video");
            }
        }

        else {
            console.error("Target video element doesn't exist!");
        }
    }
    
    async setPlayer() {
        this.preloadIcons(this.playerSettings.pathToIcons || "/src/icons/");
        await this.buildVideoBox();
        this.setVideoEvents();

        //if(navigator.userAgentData.mobile) {
        ///** Use navigator.userAgentData.mobile, navigator.userAgent just for developing tools */
        if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            console.log("Device is mobile");
            this.setMobileEvents();
        }

        else {
            console.log("Device is desktop");
            this.setDesktopEvents();
        }

        if(this.playerSettings.allowKeyboardShortcuts !== false) {
            this.setKeys();
        }

        this.loadLocalStorage();
        this.clean();
    }

    errorScreen(message) {
        //Display error
        localStorage.removeItem("jkplayer")
        let errorBox = document.createElement("div");
        errorBox.id = "jkplayer-error-box";
        errorBox.innerText = message;
        this.videoBox.replaceWith(errorBox);
    }

    async loadLocalStorage() {
        //Load local storage with settings
        let localStorageSettings;
        if(localStorage.getItem("jkplayer")) {
            console.log("Loading data from local storage");
            localStorageSettings = await JSON.parse(localStorage.getItem("jkplayer"));
        }

        else {
            console.log("Saving data to local storage");
            localStorage.setItem("jkplayer", "{}");
            localStorageSettings = {};
        }

        //Apply settings from local storage
        this.videoElement.volume = 0.44;
        await localStorageSettings.volume ? this.videoElement.volume = localStorageSettings.volume : this.videoElement.volume = 1;
        this.oldVolume = this.videoElement.volume;
        await localStorageSettings.muted || this.videoElement.hasAttribute("muted") ? this.videoElement.muted = true : this.videoElement.muted = false;

        if(this.videoElement.muted || this.videoElement.volume === 0) {
            this.volumeLabel.dataset.tooltip = this.translateObject.unmute;
        }

        else {
            this.volumeLabel.dataset.tooltip = this.translateObject.mute;
        }

        localStorageSettings.speed ? this.videoElement.playbackRate = localStorageSettings.speed : this.videoElement.playbackRate = 1;
        localStorageSettings.captions ? this.changeCaptionsSource(localStorageSettings.captions) : null;
        localStorageSettings.quality ? this.changeVideoSource(localStorageSettings.quality) : null;

        //Session storage
        let sessionStorageSettings;

        if(sessionStorage.getItem("jkplayer")) {
            console.log("Loading data from session storage");
            sessionStorageSettings = await JSON.parse(sessionStorage.getItem("jkplayer"));
            console.log("Setting time from session storage");
        }
        
        else {
            console.log("Saving data to session storage");
            sessionStorage.setItem("jkplayer", "{}");
            sessionStorageSettings = {};
        }

        this.videoElement.currentTime = sessionStorageSettings.time ? sessionStorageSettings.time : 0;
    }

    updateLocalStorage(name, value) {
        console.log(`Updating "${name}" in local storage to ${value}`);
        let settings = JSON.parse(localStorage.getItem("jkplayer"));
        settings[name] = value;
        localStorage.setItem("jkplayer", JSON.stringify(settings));
        this.storageSettings = settings;
    }

    updateSessionStorage(name, value) {
        console.log(`Updating "${name}" in session storage to ${value}`)
        let settings = JSON.parse(sessionStorage.getItem("jkplayer"));
        settings[name] = value;
        sessionStorage.setItem("jkplayer", JSON.stringify(settings));
        this.storageSettings = settings;
    }

    preloadIcons(pathToIcons) {
        let icons = [
            "captions-disabled.svg",
            "captions.svg",
            "cast.svg",
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
            console.log(`Preloading icon: ${imageName}`);
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

        await this.targetVideoNode.replaceWith(this.videoBox);

        //Create new video element
        await this.buildVideoElement();

        //Create poster box
        if(this.targetVideoNode.poster) {
            console.log("Creating poster for video");
            this.posterBox = document.createElement("div");
            this.posterBox.id = "jkplayer-poster";
            this.posterBox.style.backgroundImage = `url(${this.targetVideoNode.poster})`;
            this.videoWrapper.appendChild(this.posterBox);
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
            //Create center play button
            this.centerPlayButton = document.createElement("button");
            this.centerPlayButton.id = "jkplayer-center-play-button";
            this.videoBox.appendChild(this.centerPlayButton);

            //Create replay play button
            this.centerReplayButton = document.createElement("button");
            this.centerReplayButton.id = "jkplayer-center-replay-button";
            this.videoBox.appendChild(this.centerReplayButton);

            this.buildControlsPanel();
            this.setControlsEvents();
        }
    }

    async buildVideoElement() {
        //Create wrapper
        this.videoWrapper = document.createElement("div");
        this.videoWrapper.id = "jkplayer-wrapper";

        //Create video element
        this.videoElement = document.createElement("video");
        this.videoElement.id = this.targetVideoNode.id;
        this.videoWrapper.appendChild(this.videoElement);

        //Set attributes from original element
        if(this.targetVideoNode.hasAttribute("playsinline")) {
            this.videoElement.setAttribute("playsinline", "");
            this.videoElement.setAttribute("webkit-playsinline", "");
            console.log("Setting playsinline for video element");
        }

        if(this.targetVideoNode.hasAttribute("crossorigin")) {
            this.videoElement.setAttribute("crossorigin", this.videoElement.getAttribute("crossorigin"));
            console.log("Setting crossorigin for video element");
        }

        if(this.targetVideoNode.hasAttribute("loop")) {
            this.videoElement.setAttribute("loop", "");
            console.log("Setting loop for video element");
        }

        if(this.targetVideoNode.hasAttribute("muted")) {
            this.videoElement.setAttribute("muted", "");
            console.log("Setting muted for video element");
        }

        if(this.targetVideoNode.hasAttribute("preload")) {
            this.videoElement.setAttribute("preload", this.targetVideoNode.getAttribute("preload") || "");
            console.log("Setting preload for video element");
        }

        //Add background for pip
        this.targetVideoNode.poster ? this.videoElement.poster = this.targetVideoNode.poster : null;
        this.videoBox.appendChild(this.videoWrapper);
        this.videoSources = [];
        this.textSources = [];

        //Add source from video element
        if(this.targetVideoNode.src) {
            try {
                console.log("Adding source from video tag");
                let source = document.createElement("source");
                source.src = this.targetVideoNode.src;
                this.targetVideoNode.insertAdjacentElement("afterbegin", source)
            }

            catch(e) {
                console.error(e);
            }
        }

        //Add all remains sources
        let sources = this.targetVideoNode.querySelectorAll("source");
        if(sources.length >= 1) {
            for await (const source of sources) {
                try {
                    let newSource = document.createElement("source");
                    newSource.src = source.src;
                    newSource.type = source.type || this.getSourceTypeFromFilename(source.src);
                    //If element cant be played by browser
                    if(this.videoElement.canPlayType(newSource.type) === "") {
                        console.error(`Browser doesn't support ${newSource.type} video format`);
                        this.errorScreen(this.translateObject.unsupportedVideoByBrowser);
                        continue;
                    }
                    
                    //Set video size
                    if(newSource.hasAttribute("size")) {
                        newSource.setAttribute("size", source.getAttribute("size"));
                    }
    
                    else {
                        let height = await this.getVideoData(source.src);
                        newSource.setAttribute("size", height.videoHeight);
                    }

                    //Check multiple sources with same size
                    if(this.videoSources.some(element => element.getAttribute("size") === newSource.getAttribute("size"))) {
                        console.warn(`Multiple sources for size: ${newSource.getAttribute("size")}`);
                        continue;
                    }
    
                    //Add source to sourcelist
                    this.videoElement.appendChild(newSource);
                    this.videoSources.push(newSource);
                    console.log("Adding video source " + newSource.getAttribute("size"));
                }
    
                catch(e) {
                    console.error(e);
                }
            }
        }

        else {
            this.errorScreen(this.translateObject.cantPlayVideo);
            return;
        }

        //Sort video sources by size
        this.videoSources.sort((a, b) => {
            return b.getAttribute("size") - a.getAttribute("size");
        });

        //Add captions tracks
        let textTracks = this.targetVideoNode.querySelectorAll("track");
        if(textTracks.length > 0) {
            for await (const track of textTracks) {
                try {
                    //Check file encoding
                    let captions = await fetch(track.src);
                    captions = await captions.text();
                    if(captions.includes("�")) {
                        console.error(`Caption source ${track.src} isn't utf-8`);
                        return;
                    }

                    else {
                        //Check format for webvtt
                        let src;
                        if(captions.startsWith("WEBVTT")) {
                            src = track.src;
                        }

                        //Convert srt to vtt
                        else if(track.src.substring(track.src.lastIndexOf('.') + 1) === "srt") {
                            captions = this.srtToVtt(captions);
                            console.log("Successfully converted from srt to vtt");
                            const blob = new Blob([captions], {type : "text/plain;charset=utf-8"});
                            src = URL.createObjectURL(blob);
                        }

                        else {
                            console.error(`Unsupported captions format from ${track.src}`);
                            return;
                        }

                        //Create track source
                        let newTrack = document.createElement("track");
                        newTrack.kind = "captions";
                        newTrack.label = track.label;
                        newTrack.srclang = track.srclang;
                        newTrack.src = src;
                        this.videoElement.appendChild(newTrack);
                        this.textSources.push(newTrack);
                        console.log("Adding captions source " + newTrack.srclang);
                    }
                }

                catch(e) {
                    console.error(e);
                }
            }
        }
    }

    buildControlsPanel() {
        console.log("Building controls panel");
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

        this.buildChapters(this.videoData.chapters);

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

        //Cast button
        this.setupCast();

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

        if(this.playerSettings.allowTimelineThumbnail) {
            this.thumbnailVideoPlayer = document.createElement("video");
            this.thumbnailVideoPlayer.src = this.videoSources[this.videoSources.length - 1].src;
        }
    }

    setupCast() {
        console.log("Setting chrome cast");
        //Create button
        this.castLabel = document.createElement("label");
        this.castLabel.dataset.tooltip = this.translateObject.cast;
        this.castButton = document.createElement("div");
        this.castButton.id = "jkplayer-cast";
        this.castButton.classList.add("jkplayer-controls-button");
        this.castLabel.appendChild(this.castButton);
        this.videoControlsBox.appendChild(this.castLabel);
    }

    buildSettingsBox() {
        this.settingsOptions = [];
        let storageSettings = localStorage.getItem("jkplayer") ? JSON.parse(localStorage.getItem("jkplayer")) : {};

        if(this.textSources.length > 0) {
            let captionsOption = {
                name: this.translateObject.captions, active: storageSettings.captions || this.translateObject.disabled, value: [{name: this.translateObject.disabled, value: false}]
            }

            for(let i = 0; i < this.textSources.length; i++) {
                let option = {name: this.textSources[i].label, value: this.textSources[i].srclang}
                captionsOption.value.push(option);
            }

            this.settingsOptions.push(captionsOption);
        }

        if(this.videoSources.length > 1) {
            let qualityOptions = {
                name: this.translateObject.quality, active: storageSettings.quality || this.translateObject.auto, value: [{name: this.translateObject.auto, value: this.translateObject.auto}]
            }

            for(let i = 0; i < this.videoSources.length; i++) {
                let option = { name: this.videoSources[i].getAttribute("size") + "p", value: this.videoSources[i].getAttribute("size")}
                qualityOptions.value.push(option);
            }

            this.settingsOptions.push(qualityOptions);
        }

        if(this.playerSettings.allowDownload) {
            let downloadOptions = {
                name: this.translateObject.download, active: "", value: []
            }

            for(let i = 0; i < this.videoSources.length; i++) {
                let option = { name: this.videoSources[i].getAttribute("size") + "p", value: this.videoSources[i].src}
                downloadOptions.value.push(option);
            }

            this.settingsOptions.push(downloadOptions);
        }

        let speedOptions =  this.playerSettings.speedOptions ||  [0.25, 0.50, 0.75, 1, 1.25, 1.5, 1.75, 2, 4];
        let videoSpeed = { name: this.translateObject.speed, active: storageSettings.speed || 1, value: []};

        speedOptions.forEach(time => {
            let option = {name: time + "×", value: time}
            videoSpeed.value.push(option);
        });
        this.settingsOptions.splice(this.settingsOptions.length - 1, 0, videoSpeed);

        let mainScreen = document.createElement("div");
        mainScreen.classList.add("jkplayer-settings-screen");
        mainScreen.classList.add("jkplayer-settings-screen-main");
        this.settingsMenu.appendChild(mainScreen);

        this.settingsOptions.forEach(option => {
            let mainOptionElement = document.createElement("div");
            mainOptionElement.classList.add("jkplayer-settions-option");
            mainOptionElement.dataset.screenName = option.name;
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

                    submenuOption.value ? optionElement.dataset.icon = submenuOption.value : null;
                }

                else if(option.name === this.translateObject.quality) {
                    optionElement.addEventListener("click", () => {
                        this.changeVideoSource(submenuOption.value);
                    });

                    if(!isNaN(submenuOption.value)) {
                        if(submenuOption.value >= 4320) {
                            optionElement.dataset.icon = "8K";
                        }

                        else if(submenuOption.value >= 2160) {
                            optionElement.dataset.icon = "4K";
                        }

                        else if(submenuOption.value >= 2160) {
                            optionElement.dataset.icon = "UHD";
                        }

                        else if(submenuOption.value >= 1080) {
                            optionElement.dataset.icon = "HD";
                        }

                        else if(submenuOption.value >= 720) {
                            optionElement.dataset.icon = "HD";
                        }

                        else {
                            optionElement.dataset.icon = "SD";
                        }
                    }
                }

                else if(option.name === this.translateObject.speed) {
                    optionElement.addEventListener("click", () => {
                        this.changeVideoSpeed(submenuOption.value);
                    });
                }

                else if(option.name === this.translateObject.download) {
                    optionElement.addEventListener("click", (e) => {
                        console.log("Downloading " + submenuOption.value);
                        let downloadElement = document.createElement("a");
                        downloadElement.href = submenuOption.value;
                        downloadElement.setAttribute("download", "");
                        downloadElement.click();
                        downloadElement.remove();
                    });
                }

                optionElement.onclick = (e) => {
                    if (e.target.parentElement.querySelector(".active")) {
                        e.target.parentElement.querySelector(".active").classList.remove("active");
                    }

                    if(option.name !== this.translateObject.download) {
                        optionValue.innerText = submenuOption.name;
                        e.target.classList.add("active");
                    }

                    this.videoBox.classList.remove("jkplayer-open-settings");
                }

                optionElement.innerText = submenuOption.name;
                optionScreen.appendChild(optionElement);
            });

            this.settingsMenu.appendChild(optionScreen);
        });
    }

    buildChapters(chapters) {
        //Create default chapters
        console.log("Settings default chapters");
        let chapter = document.createElement("div");
        chapter.classList.add("jkplayer-chapter");
        chapter.style.width = "100%";
        chapter.style.left = "0";
        this.timelistChaptersBox.appendChild(chapter);

        if(chapters && Array.isArray(chapters) && chapters.length > 1) {
            console.log("Adding chaptes");
            let buildChapters = () => {
                this.timelistChaptersBox.innerHTML = "";
                let videoDuration = this.videoDuration / 100;
                //Sort chapters by time
                chapters.sort((a, b) => {
                    return a.time.localeCompare(b.time);
                });

                chapters.forEach((chapterData, index) => {
                    let time;
                    if(isNaN(chapterData.time)) {
                        time = this.secondsFromTime(chapterData.time);
                    }
    
                    else {
                        time = chapterData.time;
                    }
    
                    if(time <= this.videoDuration && time >= 0) {
                        let chapter = document.createElement("div");
                        chapter.classList.add("jkplayer-chapter");
                        let endTime = chapters[index + 1] ? this.secondsFromTime(chapters[index + 1].time) : this.videoDuration;
                        if(endTime > this.videoDuration) {
                            console.warn("Cropping chapter, end time is out of range");
                            endTime = this.videoDuration;
                        }
    
                        let width = this.widthFromTime(endTime - time);
                        let left = (time / videoDuration);
    
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
                this.videoElement.removeEventListener("loadedmetadata", buildChapters);
            }

            this.videoElement.addEventListener("loadedmetadata", buildChapters);
        }
    }

    setVideoEvents() {
        //Prevent context menu
        this.videoWrapper.addEventListener("contextmenu", (e) => {
            console.log("Contextmenu");
            e.stopPropagation();
            e.preventDefault();
            let bounding = this.videoBox.getBoundingClientRect();
            this.buildContextMenu(e.clientX - bounding.left,e.clientY - bounding.top);
        });

        this.videoBox.addEventListener("contextmenu", (e) => {
            console.log("Context menu prevent");
            e.preventDefault();
        });

        //Video onload data
        this.videoElement.addEventListener("loadedmetadata", () => {
            console.log("Event: loadedmetadata");
            this.videoOnload();
        });

        //Reply
        this.videoElement.addEventListener("ended", () => {
            console.log("Event: ended");
            this.videoBox.classList.add("jkplayer-replay");
            this.controlsPlayLabel.dataset.tooltip = this.translateObject.replay;
        });

        //Video duration change
        this.videoElement.addEventListener("durationchange", () => {
            console.log("Event: durationchange");
            this.videoDuration = this.videoElement.duration;
            this.videoLengthSpan.innerText = this.timeFromSeconds(this.videoDuration);
        });

        //saveProgress
        if(this.playerSettings) {
            let saveTimeLoop;
            let saveCurrentTime = (e) => {
                if(e.type === "play") {
                    saveTimeLoop = setInterval(() => {
                        this.updateSessionStorage("time", this.videoElement.currentTime);
                    }, this.playerSettings.saveTimeInterval * 1000 ?? 60000);
                }

                else {
                    clearInterval(saveTimeLoop);
                }
            }

            this.videoElement.addEventListener("play", saveCurrentTime);
            this.videoElement.addEventListener("pause", saveCurrentTime);
        }

        //Buffered
        this.videoElement.addEventListener("progress", this.changeBuffered.bind(this));

        //Play, pause
        this.centerPlayButton.addEventListener("click", this.togglePlay.bind(this));
        this.videoElement.addEventListener('pause', () => {
            console.log("Event: pause");
            this.videoBox.classList.add("jkplayer-paused");
            this.videoBox.classList.remove("jkplayer-playing");
            this.controlsPlayLabel.dataset.tooltip = this.translateObject.play;
        });

        this.videoElement.addEventListener('play', () => {
            console.log("Event: play");
            this.controlsPlayLabel.dataset.tooltip = this.translateObject.pause;

            if(this.posterBox) {
                this.posterBox.remove();
            }

            this.videoBox.classList.remove("jkplayer-paused");
            this.videoBox.classList.add("jkplayer-playing");
        });

        //PIP events
        this.videoElement.addEventListener("enterpictureinpicture", () => {
            console.log("Event: enterpictureinpicture");
            this.videoBox.classList.add("jkplayer-pip");
        });

        this.videoElement.addEventListener("leavepictureinpicture", () => {
            console.log("Event: leavepictureinpicture");
            this.videoBox.classList.remove("jkplayer-pip");
        });

        //Loading
        this.videoElement.addEventListener("waiting", () => {
            console.log("Event: waiting");
            this.videoBox.classList.add("jkplayer-loading");
        });

        this.videoElement.addEventListener("canplay", () => {
            console.log("Event: canplay");
            this.videoBox.classList.remove("jkplayer-loading");
        });

    }

    setControlsEvents() {
        console.log("Settings events for controls");
        //Fullscreen
        this.fullscreenButton.addEventListener("click", this.toggleFullscreen.bind(this));
        document.addEventListener('fullscreenchange', () => {
            console.log("Event: fullscreenchange");
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
            e.preventDefault();
            console.log("Event: wheel");
            if(e.deltaY > 0) {
                this.changeVolume("-");
            }

            else {
                this.changeVolume("+");
            }
        });

        //Subtitles
        if(this.captionsButton) {
            this.captionsButton.addEventListener("click", this.toggleCaptions.bind(this));
        }

        this.captionsChangeEvent = this.changeCaptions.bind(this);

        this.settingsButton.addEventListener("click", this.toggleSettings.bind(this));


        this.centerReplayButton.addEventListener("click", () => {
            console.log("Play event from center play button menu");
            this.videoBox.classList.remove("jkplayer-replay");
            this.videoElement.currentTime = 0;
            this.videoElement.play();
        });

        //Volume
        this.videoElement.addEventListener("volumechange", () => {
            console.log("Event: volumechange");
            this.updateLocalStorage("volume", this.videoElement.volume.toFixed(2));
            if(this.videoElement.volume === 0 || this.videoElement.muted) {
                this.videoBox.classList.add("jkplayer-muted");
                this.volumeLabel.dataset.tooltip = this.translateObject.unmute;
                this.volumeActive.style.width = "0%";
                this.updateLocalStorage("muted", true);
            }

            else {
                this.videoBox.classList.remove("jkplayer-muted");
                this.videoElement.muted = false;
                this.volumeLabel.dataset.tooltip = this.translateObject.mute;
                this.volumeActive.style.width = Number(this.videoElement.volume * 100) + "%";
                this.updateLocalStorage("muted", false);
            }
        });

        //Time events
        this.videoElement.addEventListener("timeupdate", () => {
            console.log("Event: timeupdate");
            let width = this.widthFromTime(this.videoElement.currentTime);
            this.timelineRange.style.width = width + "%";
            this.timelineBuffered.style.left = width + "%";
            this.currentTime.innerText = this.timeFromSeconds(this.videoElement.currentTime);
        });
    }

    setKeys() {
        document.addEventListener("keydown", (e) => {
            switch(e.code) {
                case "KeyK": 
                case "Space":
                    this.togglePlay();
                    e.preventDefault(); 
                    break;

                case "KeyF": 
                    this.toggleFullscreen();
                    e.preventDefault(); 
                    break;

                case "KeyM": 
                    this.toggleMute();
                    e.preventDefault(); 
                    break;

                case "ArrowRight": 
                    this.skipTime("+");
                    e.preventDefault(); 
                    break;

                case "ArrowLeft": 
                    this.skipTime("-");
                    e.preventDefault(); 
                    break;

                case "ArrowUp": 
                    this.changeVolume("+");
                    e.preventDefault(); 
                    break;

                case "ArrowDown": 
                    this.changeVolume("-");
                    e.preventDefault(); 
                    break;

                case "Home": 
                    this.skipTime("start");
                    e.preventDefault(); 
                    break;

                case "End": 
                    this.skipTime("end");
                    e.preventDefault(); 
                    break;

                case "KeyI": 
                    this.togglePip();
                    e.preventDefault(); 
                    break;

                case "KeyC": 
                    this.toggleCaptions();
                    e.preventDefault(); 
                    break;

                case "KeyS": 
                    this.toggleSettings(e);
                    e.preventDefault(); 
                    break;
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
        this.videoWrapper.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            console.log("Event: dblclick");
            this.toggleFullscreen();
        });
        
        this.videoWrapper.addEventListener("click", this.togglePlay.bind(this));

        //Hide when not active
        let awaitTimeout;
        let controlsAwait = () => {
            this.videoBox.classList.remove("jkplayer-hidden-controls");

            if(awaitTimeout) {
                clearTimeout(awaitTimeout);
            }

            awaitTimeout = setTimeout(() => {
                this.videoBox.classList.add("jkplayer-hidden-controls");
            }, this.playerSettings.timeToHideControls * 1000 || 4000);
        }

        //Controls events
        this.videoBox.addEventListener("mouseenter", () => {
            console.log("Event: mouseenter");
            this.videoBox.classList.remove("jkplayer-hidden-controls");
            document.addEventListener("mousemove", controlsAwait);
        });

        this.videoBox.addEventListener("mouseleave", () => {
            console.log("Event: mouseleave");
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
            this.timelineThumb.style.opacity = 1;
        });

        this.timelineBox.addEventListener("mousemove", (e) => {
            this.changeTimelineThumb(e.clientX, e.target);
        });

        this.timelineBox.addEventListener("mouseleave", () => {
            this.timelineThumb.style.opacity = 0;
        });
    }

    setMobileEvents() {
        this.videoBox.classList.add("jkplayer-mobile");

        let touched = false;
        let touchedTimeout;
        let hideControlsTimeout;

        this.videoBox.addEventListener("touchstart", (e) => {
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
            }, this.playerSettings.timeToHideControls * 1000 || 3000);
        });

        //Update time
        let moveTimeUpdate = (e) => {
            this.changeTimelineThumb(e.changedTouches[0].clientX, document.elementFromPoint(e.changedTouches[0].clientX, e.changedTouches[0].clientY));
            let bounding = this.timelineBox.getBoundingClientRect();
            let width = ((e.changedTouches[0].clientX - bounding.left) / bounding.width) * 100;
            width = width > 100 ? 100 : width;
            this.timelineRange.style.width =  width + "%";
            return width;
        }

        let finalTimeUpdate = (e) => {
            this.timelineThumb.style.opacity = 0;
            document.removeEventListener("touchmove", moveTimeUpdate);
            document.removeEventListener("touchend", finalTimeUpdate);
            let width = moveTimeUpdate(e);
            width = width > 100 ? 100 : width;
            this.videoElement.currentTime = this.timeFromWidth(width);
            if(this.oldPlay) {
                this.videoElement.play();
            }
        }

        this.timelineBox.addEventListener("touchstart", async (e) => {
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

            this.timelineThumb.style.opacity = 1;
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
        console.log("Updating buffered indicator");
        if(this.videoDuration > 0) {
          for(var i = 0; i < this.videoElement.buffered.length; i++) {
                if (this.videoElement.buffered.start(this.videoElement.buffered.length - 1 - i) < this.videoElement.currentTime) {
                    this.timelineBuffered.style.width = `calc(${(this.videoElement.buffered.end(this.videoElement.buffered.length - 1 - i) / this.videoDuration) * 100}% - ${this.timelineRange.style.width})`;
                    break;
                }
            }
        }
    }

    buildContextMenu(x, y) {
        console.log("Building context menu");
        let oldContextBox = this.videoBox.querySelector("#jkplayer-contextmenu");
        if(oldContextBox) {
            oldContextBox.remove();
        }
        let contextBox = document.createElement("div");
        contextBox.id = "jkplayer-contextmenu";
        let contextMenuOptions = ["Klávesové zkratky", "Smyčka", "Smazat data"]
        contextMenuOptions.forEach(option => {
            let optionElement = document.createElement("div");
            optionElement.innerText = option;
            contextBox.appendChild(optionElement);
        })
        contextBox.style.left = x + "px";
        contextBox.style.top = y + "px";
        this.videoBox.appendChild(contextBox);

        document.addEventListener("mousedown", () => {
            console.log("Closing context menu");
            contextBox.remove();
        }, { once: true });
    }

    videoOnload() {
        if(this.videoElement.currentSrc) {
            let aspectRatio = this.playerSettings.aspectRatio ? this.playerSettings.aspectRatio : `${this.videoElement.videoWidth} / ${this.videoElement.videoHeight}`;
            this.videoBox.style.aspectRatio = aspectRatio;
            this.currentTime.innerText = this.timeFromSeconds(this.videoElement.currentTime);
        }

        else {
            console.error("Video source isn't provided");
            this.errorScreen(this.translateObject.cantPlayVideo);
        }
    }

    async changeTimelineThumb(clientX, target) {
        let timelineBound = this.timelineBox.getBoundingClientRect();
        let timelineWidth = this.timelineBox.clientWidth;
        let videoDuration = this.videoDuration;
        let progresstime = Math.floor(((clientX - timelineBound.left) / timelineWidth) * videoDuration);
        if(progresstime >= 0) {
            this.timelineThumbTime.innerText = this.timeFromSeconds(progresstime);
            this.timelineThumb.style.left = `${clientX - timelineBound.left}px`;

            if(target.classList.contains("jkplayer-chapter")) {
                if(target.dataset.name) {
                    this.timelineThumb.classList.remove("jkplayer-no-chaptername");
                    this.timelineThumbName.innerText = target.dataset.name || "";
                    this.timelineThumbName.style.color = target.style.backgroundColor || "";
                }

                else {
                    this.timelineThumb.classList.add("jkplayer-no-chaptername");
                    this.timelineThumbName.innerText = "";
                }
            }

            if(this.playerSettings.allowTimelineThumbnail) {
                this.generateTimelineThumb(Math.floor(((clientX - timelineBound.left) / timelineWidth) * videoDuration));
            }
        }
    }

    async generateTimelineThumb(currentTime) {
        console.log("Generating preview for thumb");
        this.timelineThumb.classList.add("jkplayer-preview");
        this.thumbnailVideoPlayer.currentTime = currentTime;
        const canvas = document.createElement("canvas");
        canvas.width = 158;
        canvas.height = 90;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(this.thumbnailVideoPlayer, 0, 0, canvas.width, canvas.height);

        ctx.canvas.toBlob(   
            blob => {
                this.timelineThumb.style.backgroundImage = `url(${URL.createObjectURL(blob)})`;
            },
            "image/jpeg",
            0.75
        );
    }

    toggleFullscreen() {
        if(document.fullscreenElement) {
            console.log("Exiting full screen");
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            
            else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            
            else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
        
        else {
            console.log("Entering full screen");
            try {
                if (this.videoBox.requestFullscreen) {
                    this.videoBox.requestFullscreen();
                }
                
                else if (this.videoBox.webkitRequestFullscreen) {
                    this.videoBox.webkitRequestFullscreen();
                }
                
                else if (this.videoBox.msRequestFullscreen) {
                    this.videoBox.msRequestFullscreen();
                }
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
            this.updateLocalStorage("muted", false);
        }

        else {
            this.videoElement.muted = true;
            this.oldVolume = this.videoElement.volume;
            this.updateLocalStorage("muted", true);
        }
    }

    toggleSettings(e) {
        e.stopPropagation();

        //Settings events
        if(this.videoBox.classList.contains("jkplayer-open-settings")) {
            console.log("Hiding settings box");
            this.videoBox.classList.remove("jkplayer-open-settings");
        }

        else {
            console.log("Opening settings box");
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
        if(direction === "-") {
            this.videoElement.currentTime -= this.playerSettings.skipTimeBack ?? 10;
        }

        else if(direction === "start") {
            this.videoElement.currentTime = 0;
        }

        else if(direction === "end") {
            this.videoElement.currentTime = this.videoDuration;
        }

        else {
            this.videoElement.currentTime += this.playerSettings.skipTimeFront ?? 10;
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
        if(resolution === this.translateObject.auto) {
            console.log("Auto check resolution");
        }

        else {
            let source = this.videoElement.querySelector(`source[size="${resolution}"]`);
            if(source) {
                let play;
                this.videoElement.paused ? play = false : play = true;
                this.updateLocalStorage("quality", resolution);
                let currentTime = this.videoElement.currentTime;
                this.videoElement.src = source.src;
                this.videoElement.currentTime = currentTime;
                if(play) this.videoElement.play();
            }
    
            else {
                console.error("Can't load video source");
                //TODO Source doesnt exists
            }
        }
    }

    changeVideoSpeed(speed) {
        this.videoElement.playbackRate = speed;
        this.updateLocalStorage("speed", speed)
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
            let optionInSettings = this.settingsMenu.querySelector(`.jkplayer-settings-screen-main [data-screen-name="${this.translateObject.captions}"] .jkplayer-settings-active-value`);
            optionInSettings.innerText = this.translateObject.disabled;
            this.videoBox.classList.remove("jkplayer-subtitles-enabled");
            this.videoElement.textTracks[id].mode = "disabled";
            this.videoElement.textTracks[id].removeEventListener('cuechange', this.captionsChangeEvent);
            this.updateLocalStorage("captions", false);
        }

        else {
            //Select best captions language
            let language;
            if(lang && typeof lang === "string") {
                language = lang;
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
            console.log(language)
            this.updateLocalStorage("captions", language);
        }
    }

    changeCaptionsSource(lang) {
        this.captionsBox.innerText = "";
        for (let i = 0 ; i < this.videoElement.textTracks.length; i++) {
            if(this.videoElement.textTracks[i].mode === "hidden") {
                this.videoElement.textTracks[i].mode = "disabled";
                this.videoElement.textTracks[i].removeEventListener('cuechange', this.captionsChangeEvent);
            }
        }

        if(lang) {
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
                this.updateLocalStorage("captions", lang);
            }
        }

        else {
            this.videoBox.classList.remove("jkplayer-subtitles-enabled");
            this.updateLocalStorage("captions", false);

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

    async getVideoData(src) {
        return new Promise((resolve, reject) => {
            let videoElement = document.createElement("video");
            videoElement.addEventListener("loadedmetadata", () => {
                resolve ({
                    videoWidth: videoElement.videoWidth,
                    videoHeight: videoElement.videoHeight,
                    videoDuration: videoElement.duration
                });
            });

            videoElement.addEventListener("error", (e) => {
                reject(e);
            });

            videoElement.src = src;
        });
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
            
            default:
                type = "video/" + extension;
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

    async debugging(enabled) {
        let logToConsole = console.log;
        let errorToConsole = console.error;
        let warnToConsole = console.warn;

        if(enabled) {
            console.log = (e) => {
                logToConsole(e);
            }
    
            console.error = (e) => {
                errorToConsole(e);
            }
    
            console.warn = (e) => {
                warnToConsole(e);
            }
    
            console.log("Debugging is enabled");
        }

        else {
            console.log = (e) => {}
    
            console.error = (e) => {}
    
            console.warn = (e) => {}
        }
    }

    clean() {
        this.videoElement.load();
        delete this.targetVideoNode;
        console.log("Cleaning...");
    }
}