const searchURL = 'https://www.googleapis.com/youtube/v3/search?order=date&part=snippet&type=video&maxResults=50&key=AIzaSyAHu80T94GGhKOzjBs9z5yr0KU8v48Zh60&q='
const englishWordsURL = 'https://raw.githubusercontent.com/ManiacDC/TypingAid/master/Wordlists/WordList%20English%20Gutenberg.txt'
const spanishWordsURL = 'https://raw.githubusercontent.com/ManiacDC/TypingAid/master/Wordlists/Wordlist%20Spanish.txt'
const CJKUnifiedIdeographsBlock = [0x4E00, 0x9FCC];

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
            getSearchTerm();

        }
        else {
            setTimeout(findVideo, 100);
        }
    }

    function getSearchTerm() {
        useSearchTerm(getRandomCharacterFromUnicodeBlock(CJKUnifiedIdeographsBlock));
        //$.ajax({
            //type: "GET",
            //url: spanishWordsURL,
            //success: function(response) {
                //var randomLine = getRandomLineFromTextFile(response);
                //useSearchTerm(randomLine);
            //}
            //// TODO: Handle failure
        //});
    }

    function getRandomCharacterFromUnicodeBlock(block) {
        var randomCharacter = String.fromCharCode(block[0] + Math.random() * (block[1] - block[0] + 1));
        return randomCharacter;
    }

    function getRandomLineFromTextFile(textFile) {
        var allLines = textFile.split("\n");
        var index = Math.floor(allLines.length * Math.random());
        return allLines[index];
    }

    function useSearchTerm(searchTerm) {
        console.log('Using search term: ' + searchTerm);
        $.ajax({
            type: "GET",
            url: searchURL + encodeURI(searchTerm),
            success: playVideo,
            // TODO: Handle failure
        });
    }

    function playVideo(response) {
        if (response.items.length < 1) {
            console.log('no results!');
        }
        var videoChoice = Math.floor(Math.random() * response.items.length);
        var videoId = response.items[videoChoice].id.videoId;
        player.loadVideoById(videoId);
    }

    $(document).click(function(e) {
        // Require user input to start if Chrome blocks autoplay
        if(!started) {
            start();
        }
    });
});
