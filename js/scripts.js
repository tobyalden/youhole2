const searchURL = 'https://www.googleapis.com/youtube/v3/search?order=date&part=snippet&type=video&maxResults=50&key=AIzaSyAHu80T94GGhKOzjBs9z5yr0KU8v48Zh60&q='

// Loading the YouTube API (must be done in global scope)
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
var player;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: 'M7lc1UVf-VE',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

var isPlayerReady = false;
function onPlayerReady(event) {
    console.log('YouTube API loaded.');
    isPlayerReady = true;
}

var staticSfx = new Audio('public/static.ogg');
staticSfx.loop = true;

function onPlayerStateChange(event) {
    if(event.data == YT.PlayerState.PLAYING) {
        // TODO: What if jQuery isn't loaded?
        $('#static').addClass('hidden');
        staticSfx.pause();
        $('#player').removeClass('hidden');
    }
}

$(function() {
    var started = false;
    function start() {
        if(started) {
            return;
        }
        staticSfx.play().then(
            function(result) {
                $('#static').removeClass('hidden');
                $('#playicon').addClass('hidden');
                started = true;
                findVideo();
            },
            function(error) {
                if(error instanceof DOMException && error.name == 'NotAllowedError') {
                    // Chrome's autoplay policy prevented the audio from playing:
                    // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
                    $('#playicon').removeClass('hidden');
                }
            }
        );
    }

    start();

    function findVideo() {
        if(isPlayerReady) {
            var word = 'turtles';
            console.log('lets find turtles');
            $.ajax({
                url: searchURL + word,
                type: "GET",
                success: playVideo
            });
        }
        else {
            setTimeout(findVideo, 100);
        }
    }

    function playVideo(responseJSON) {
        console.log('found something');
        // TODO: handle no results
        var videoChoice = Math.floor(Math.random() * responseJSON.items.length);
        var videoId = responseJSON.items[videoChoice].id.videoId;
        player.loadVideoById(videoId);
    }

    $(document).click(function(e) {
        // Require user input to start if Chrome blocks autoplay
        if(!started) {
            start();
        }
    });
});
