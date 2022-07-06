'use struct';

class JKplayer {
    constructor(targetID, settings = [], videoData = {}) {
        this.targetVideoNode = document.querySelector(targetID);
        if(this.targetVideoNode) {
            if(this.targetVideoNode.nodeName.toLowerCase() === "video") {
                this.videoData = videoData;
                //TODO check media status
                this.preloadIcons("/src/icons/");
                this.buildVideoBox();
                this.checkSubtitles();
                this.setPlayer();
                this.setEvents();

                if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
                    console.log("Mobile device");
                    this.setMobileEvents();
                }

                else {
                    console.log("Desktop");
                    this.setDesktopEvents();
                }

                this.setKeys();
                this.generateTimelineThumbPreview();
                this.clean();
            }

            else {
                console.error("Target element isn't video");
            }
        }

        else {
            console.error("Target video element doesn't exist!");
        }
    }

    preloadIcons(pathToIcons) {
        let icons = [
            "captions-disabled.svg",
            "captions.svg",
            "compress.svg",
            "expand.svg",
            "pause.svg",
            "pip.svg",
            "play.svg",
            "replay.svg",
            "right.svg",
            "settings.svg",
            "volume-low.svg",
            "volume-max.svg",
            "volume-muted.svg"
        ]

        icons.forEach(imageName => {
            let img = new Image();
            img.src = pathToIcons + imageName;
        });
    }

    async setPlayer() {
        if(this.videoElement.hasAttribute("controls")) {
            this.videoElement.removeAttribute("controls");
        }

        if(!this.videoElement.hasAttribute("playsinline")) {
            this.videoElement.setAttribute("playsinline", "");
        }

        //TODO Autoplay event
    }

    buildVideoBox() {
        this.videoBox = document.createElement("div");
        this.videoBox.setAttribute("tabindex", 0);
        this.videoBox.id = "jkplayer-box";
        this.videoBox.classList.add("jkplayer-paused");

        //Apend existing video element
        this.videoBox.appendChild(this.targetVideoNode.cloneNode(true));

        //Create poster box
        this.posterBox = document.createElement("div");
        this.posterBox.id = "jkplayer-poster";
        this.posterBox.style.backgroundImage = `url(${this.targetVideoNode.poster})`;
        this.targetVideoNode.removeAttribute("poster");
        this.videoBox.appendChild(this.posterBox);

        //Create captions box
        this.captionsBox = document.createElement("div");
        this.captionsBox.id = "jkplayer-captions";
        this.videoBox.appendChild(this.captionsBox);

        //Build controls panel
        this.buildControlsPanel();

        //Create center play button
        this.centerPlayButton = document.createElement("button");
        this.centerPlayButton.id = "jkplayer-center-play-button";
        this.videoBox.appendChild(this.centerPlayButton);

        //Create replay play button
        this.centerReplayButton = document.createElement("button");
        this.centerReplayButton.id = "jkplayer-center-replay-button";
        this.videoBox.appendChild(this.centerReplayButton);

        this.videoElement = this.videoBox.querySelector("video");
        this.targetVideoNode.replaceWith(this.videoBox);
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

    addChapters(chapters) {
        let videoDuration = this.videoDuration / 100;
        if(chapters) {
            console.log("Adding Chapters");
            chapters.forEach((chapterData, index) => {
                if(isNaN(chapterData.position)) {
                    chapterData.position = this.secondsFromTime(chapterData.position);
                }
                if(chapterData.position <= this.videoDuration && chapterData.position >= 0) {
                    let chapter = document.createElement("div");
                    chapter.classList.add("jkplayer-chapter");
                    chapter.style.left = (chapterData.position / videoDuration) + "%";
                    chapter.style.backgroundColor = chapterData.color;
                    let endTime = chapters[index + 1] ? this.secondsFromTime(chapters[index + 1].position) : this.videoDuration;
                    chapter.style.width = `calc(${this.widthFromTime(endTime - chapterData.position)}% - 3px)`;
                    chapter.dataset.name = chapterData.name || "";
                    this.timelistChaptersBox.appendChild(chapter);
                }

                else {
                    console.warn("Time chapter is out of range");
                }
            });
        }

        else {
            console.log("No chapters are provided");
            let chapter = document.createElement("div");
            chapter.classList.add("jkplayer-chapter");
            chapter.style.width = "100%";
            chapter.style.left = "0";
            this.timelistChaptersBox.appendChild(chapter);
        }
    }

    setEvents() {
        //Prevent context menu
        this.videoBox.addEventListener("contextmenu", (e) => {
            console.log("Context menu prevented");
            e.preventDefault();
        });

        //Video onload data
        this.videoElement.addEventListener("loadeddata", this.videoOnload.bind(this));

        this.posterBox.addEventListener("click", () => {
            this.videoElement.play();
            this.posterBox.remove();
            delete this.posterBox;
        })

        //Reply
        this.videoElement.addEventListener("ended", () => {
            this.videoBox.classList.add("jkplayer-replay");
        });

        this.centerReplayButton.addEventListener("click", () => {
            this.videoBox.classList.remove("jkplayer-replay");
            this.videoElement.play();
        }); 

        //Fullscreen
        this.fullscreenButton.addEventListener("click", this.toggleFullscreen.bind(this));
        document.addEventListener('fullscreenchange', () => {
            if(document.fullscreenElement) {
                this.videoBox.classList.add("jkplayer-fullscreen");
            }

            else {
                this.videoBox.classList.remove("jkplayer-fullscreen");
            }
        });

        //Play, pause
        this.centerPlayButton.addEventListener("click", this.togglePlay.bind(this));
        this.controlsPlayButton.addEventListener("click", this.togglePlay.bind(this));

        this.videoElement.addEventListener('pause', () => {
            this.videoBox.classList.add("jkplayer-paused");
            this.videoBox.classList.remove("jkplayer-playing");
        });

        this.videoElement.addEventListener('play', () => {
            this.videoBox.classList.remove("jkplayer-paused");
            this.videoBox.classList.add("jkplayer-playing");
        });

        //Mute
        this.volumeButton.addEventListener("click", this.toggleMute.bind(this));
        this.videoElement.addEventListener("volumechange", (e) => {
            if(e.target.volume === 0 || e.target.muted) {
                this.videoBox.classList.add("jkplayer-volume-muted");
                this.videoBox.classList.remove("jkplayer-volume-max");
                this.volumeSlider.value = 0;
            }

            else if(e.target.volume >= 0.7) {
                this.videoBox.classList.add("jkplayer-volume-max");
                this.videoBox.classList.remove("jkplayer-volume-muted");
                this.volumeSlider.value = this.videoElement.volume;
            }

            else {
                this.videoBox.classList.remove("jkplayer-volume-muted");
                this.videoBox.classList.remove("jkplayer-volume-max");
                this.volumeSlider.value = this.videoElement.volume;
            }
        });

        this.volumeSlider.addEventListener("input", () => {
            console.log("Video volume changed to " + this.volumeSlider.value);
            this.videoElement.volume = this.volumeSlider.value;
        });

        //Thumb events
        this.timelineBox.addEventListener("mouseenter", (e) => {
            console.log("Display thumb");
            this.timelineThumb.style.display = "block";
        });

        this.timelineBox.addEventListener("mousemove", (e) => {
            console.log("Update thumb");
            this.changeTimelineThumb(e);
        });

        this.timelineBox.addEventListener("mouseleave", (e) => {
            console.log("Hide thumb");
            this.timelineThumb.style.display = "none";
        });

        //Time events
        this.videoElement.addEventListener("timeupdate", () => {
            let width = this.widthFromTime(this.videoElement.currentTime);
            this.timelineRange.style.width = width + "%";
            this.currentTime.innerText = this.timeFromSeconds(this.videoElement.currentTime);
        });

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
        }

        this.timelineBox.addEventListener("mousedown", () => {
            document.addEventListener("mousemove", moveTimeUpdate);
            document.addEventListener("mouseup", finalTimeUpdate);
        });

        //Controls events
        this.videoBox.addEventListener("mouseenter", () => {
            console.log("Display controls");
            this.videoBox.classList.remove("jkplayer-hidden-controls");
        });

        //Subtitles
        this.subtitlesButton.addEventListener("click", this.toggleSubtitles.bind(this));

        this.videoBox.addEventListener("mouseleave", () => {
            console.log("Hide controls");
            this.videoBox.classList.add("jkplayer-hidden-controls");
        });

        //Settings events
        let hideSettingsBox = (e) => {
            if(!this.settingsMenu.contains(e.target)) {
                this.videoBox.classList.remove("jkplayer-open-settings");
                document.removeEventListener("click", hideSettingsBox);
            }
        };

        this.settingsButton.addEventListener("click", (e) => {
            e.stopPropagation()
            document.addEventListener("click", hideSettingsBox);
            this.videoBox.classList.toggle("jkplayer-open-settings");
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
            console.log("Loading");
        });

        this.videoElement.addEventListener("canplay", () => {
            console.log("Loaded");
        })

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

                case "KeyI": 
                    this.togglePip();
                    break;

                case "KeyC": 
                    this.toggleSubtitles();
                    break;

                /*
                    TODO Start media key, pause media key
                */ 
            }
        });
    }

    setDesktopEvents() {
        //PIP button
        this.pipButton = document.createElement("button");
        this.pipButton.id = "jkplayer-pip-button";
        this.pipButton.className = "jkplayer-controls-button";
        this.settingsBox.insertAdjacentElement("afterend", this.pipButton);

        //Picture in picture
        this.pipButton.addEventListener("click",this.togglePip.bind(this));

        //Play pause
        this.videoElement.addEventListener("click", this.togglePlay.bind(this));

        this.videoElement.addEventListener("dblclick", (e) => {
            e.stopPropagation()
            this.toggleFullscreen();
        });
    }

    setMobileEvents() {
        this.videoElement.addEventListener("dblclick", (e) => {
            e.preventDefault();
            e.stopPropagation();
            let half = this.videoBox.clientWidth / 2;
            if(e.offsetX > half) {
                this.skipTime("+");
            }

            else {
                this.skipTime("-");
            }
        });
    }

    videoOnload() {
        this.videoDuration = this.videoElement.duration;
        this.videoLengthSpan.innerText = this.timeFromSeconds(this.videoDuration);
        this.currentTime.innerText = this.timeFromSeconds(this.videoElement.currentTime);
        this.addChapters(this.videoData.chapters);

        
        let gcd = function gcd (a, b) {
            return (b == 0) ? a : gcd (b, a%b);
        }

        let aspectRatio = gcd(this.videoElement.videoHeight, this.videoElement.videoWidth)
        this.videoBox.style.aspectRatio = `${this.videoElement.videoWidth / aspectRatio} / ${this.videoElement.videoHeight / aspectRatio}`;

        //setInterval(this.getBufferedTimeline.bind(this), 10000);
    }

    getBufferedTimeline() {
        let buffered = this.videoElement.buffered.end(0);
        //this.timelineBuffered.style.width = (buffered / this.videoDuration) * 100 + "%";
        console.log(buffered)
    }

    changeTimelineThumb(e) {
        let timelineBound = this.timelineBox.getBoundingClientRect();
        let timelineWidth = this.timelineBox.clientWidth;
        let videoDuration = this.videoDuration;
        let progresstime = Math.floor(((e.clientX - timelineBound.left) / timelineWidth) * videoDuration);
        if(progresstime >= 0) {
            this.timelineThumbTime.innerText = this.timeFromSeconds(progresstime);
            this.timelineThumb.style.left = `max(${e.clientX - timelineBound.left}px, 35px)`;

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

        let preview_video = document.createElement('video')
        preview_video.preload = "metadata";
        preview_video.width = "500";
        preview_video.height = "300"
        preview_video.controls = true;
        preview_video.src = this.targetVideoNode.currentSrc;
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
            console.log("Exiting full screen");
        }
        
        else {
            try {
                this.videoBox.requestFullscreen();
                console.log("Entering full screen");
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
            console.log("Play");
        }

        else {
            this.videoElement.pause();
            console.log("Paused");
        }
    }

    toggleMute() {
        if(this.videoElement.muted) {
            this.videoElement.muted = false;
            this.volumeSlider.value = this.prevVolume;
            console.log("Unmuted");
        }

        else {
            this.videoElement.muted = true;
            this.prevVolume = this.volumeSlider.value;
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

    skipTime(direction = "+") {
        //TODO skip time by config
        if(direction === "-") {
            this.videoElement.currentTime -= 5;
        }

        else if(direction === "start") {
            this.videoElement.currentTime = 0;
        }

        else if(direction === "end") {
            this.videoElement.currentTime = this.videoDuration;
        }

        else {
            this.videoElement.currentTime += 5;
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

    toggleSubtitles() {
        if(this.videoBox.classList.contains("jkplayer-subtitles-enabled")) {
            this.videoBox.classList.remove("jkplayer-subtitles-enabled");
            this.videoElement.textTracks[0].mode = "disabled";
            this.videoElement.textTracks[0].removeEventListener('cuechange', this.changeCues.bind(this));
        }

        else {
            this.videoBox.classList.add("jkplayer-subtitles-enabled");
            let activeCues = this.videoElement.textTracks[0];
            activeCues.mode = "hidden";
            this.videoElement.textTracks[0].addEventListener('cuechange', this.changeCues.bind(this));
        }
    }

    changeCues(e) {
        let activeCues = e.srcElement; 
        if(activeCues.activeCues[0]) {
            this.captionsBox.innerHTML = activeCues.activeCues[0].text;
        }

        else {
            this.captionsBox.innerText = "";
        }
    }

    checkSubtitles() {
        let textTracks = this.videoElement.querySelectorAll("track")
        textTracks.forEach(async track => {
            if(track.src.substring(track.src.lastIndexOf('.')+1) === "srt") {
                let captions = await fetch(track.src);
                captions = await captions.text();
                captions = this.srtToVtt(captions);
                const blob = new Blob([captions], {type : "text/plain;charset=utf-8"});
                track.src = URL.createObjectURL(blob);
            }
        });
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