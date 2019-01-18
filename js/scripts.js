const searchURL = 'https://www.googleapis.com/youtube/v3/search?order=date&part=snippet&type=video&maxResults=50&key=AIzaSyAHu80T94GGhKOzjBs9z5yr0KU8v48Zh60&q='
const statsURL = "https://www.googleapis.com/youtube/v3/videos?part=statistics&key=AIzaSyAHu80T94GGhKOzjBs9z5yr0KU8v48Zh60&id=";

const englishWordsURL = 'https://raw.githubusercontent.com/ManiacDC/TypingAid/master/Wordlists/WordList%20English%20Gutenberg.txt'
const spanishWordsURL = 'https://raw.githubusercontent.com/ManiacDC/TypingAid/master/Wordlists/Wordlist%20Spanish.txt'
const portugueseWordsURL = 'https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/Portuguese%20(Brazilian).dic'
const frenchWordsURL = 'https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/French.dic'
const russianWordsURL = 'https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/Russian.dic'
const indonesianWordsURL = 'https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/Indonesia.dic'
const germanWordsURL = 'https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/German.dic'
const swahiliWordsURL = 'https://raw.githubusercontent.com/elastic/hunspell/master/dicts/sw/sw_KE.dic'

// TODO: Load dictionaries asynchronous (or not at all)
const CJKUnifiedIdeographsBlock = [0x4E00, 0x9FCC];
const HangulSyllablesBlock = [0xAC00, 0xD7A3];
const DevanagariBlock = [0x0900, 0x097F];
const ArabicBlock = [0x0600, 0x06FF];
const BengaliBlock = [0x0980, 0x09FF];
const HiraganaBlock = [0x3040, 0x309F];
const KatakanaBlock = [0x30A0, 0x30FF];
const TeluguBlock = [0x0C00, 0x0C7F];
const TamilBlock = [0x0B80, 0x0BFF];

const viewCountThreshold = 500;
const keywordBlacklist = ["grammar", "pronounc", "pronunc", "say", "vocabulary", "spelling", "mean", "definition", "slideshow", "full", "ebook", "auto-generated by youtube", "amazon.com", "amazon.es", "amazon.co.uk", "bit.ly", "tukunen.org", "bitiiy.com", "http://po.st"];

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
            'onStateChange': onPlayerStateChange,
            'onError': onError
        },
        playerVars: {
            controls: 0,
            disablekb: 1,
            modestbranding: 1
        }
    });
}

var isPlayerReady = false;
function onPlayerReady(event) {
    console.log('YouTube API loaded.');
    isPlayerReady = true;
}

function onError(event) {
    console.log("YouTube error (code " + event.data + "). Restarting...");
    findVideo();
}

var staticSfx = new Audio('public/static.ogg');
staticSfx.loop = true;

var censorTimeout;
function onPlayerStateChange(event) {
    if(event.data == YT.PlayerState.PLAYING) {
        $('#static').addClass('hidden');
        staticSfx.pause();
        $('#censor').removeClass('hidden');
        censorTimeout = setTimeout(hideCensor, 4000);
    }
    else if(event.data == YT.PlayerState.ENDED) {
        skipVideo();
    }
}

var started = false;
function start() {
    if(started) {
        return;
    }
    staticSfx.play().then(
        function(result) {
            $('#static').removeClass('hidden');
            $('#overlay').removeClass('hidden');
            $('#player').removeClass('hidden');
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
    //useSearchTerm(getRandomCharactersFromUnicodeBlock(ArabicBlock, 2));
    //useSearchTerm(getRandomCharactersFromUnicodeBlock(DevanagariBlock, 2));
    //useSearchTerm(getRandomCharactersFromUnicodeBlock(BengaliBlock, 2));
    //useSearchTerm(getRandomCharactersFromUnicodeBlocks([HiraganaBlock, KatakanaBlock], 2));
    useSearchTerm(getRandomCharactersFromUnicodeBlocks([TamilBlock], 2));
    //$.ajax({
        //type: "GET",
        //url: swahiliWordsURL,
        //success: function(response) {
            //var randomLine = getRandomLineFromTextFile(response);
            //useSearchTerm(randomLine);
        //}
        //// TODO: Handle failure
    //});
}

function getRandomCharactersFromUnicodeBlocks(blocks, numCharacters) {
    var randomCharacters = "";
    for(var i = 0; i < numCharacters; i++) {
        var block = blocks[Math.floor(Math.random() * blocks.length)];
        randomCharacters += String.fromCharCode(block[0] + Math.random() * (block[1] - block[0] + 1));
    }
    return randomCharacters;
}

function getRandomLineFromTextFile(textFile) {
    var allLines = textFile.split("\n");
    var index = Math.floor(allLines.length * Math.random());
    return allLines[index].split("/")[0];
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
        console.log('No results! Restarting...');
        findVideo();
    }
    else if(isBlacklisted(response)) {
        findVideo();
    }
    else {
        console.log(response.items.length + " videos found.");
        var videoChoice = Math.floor(Math.random() * response.items.length);
        var videoId = response.items[videoChoice].id.videoId;
        console.log("videoChoice is " + videoChoice);
        console.log("videoId is " + videoId);
        $.ajax({
            type: "GET",
            url: statsURL + videoId,
            success: function(statsResponse) {
                if(statsResponse == undefined || statsResponse.items == undefined || statsResponse.items[0] == undefined) {
                    console.log("Stats unavailable. Restarting...");
                    findVideo();
                }
                else {
                    var viewCount = statsResponse.items[0].statistics.viewCount;
                    if(viewCount > viewCountThreshold) {
                        console.log("Too many views: " + viewCount + ". Restarting...");
                        findVideo();
                    }
                    else {
                        console.log("Playing video with " + viewCount + " views.");
                        player.loadVideoById(videoId);
                    }
                }

            }
            // TODO: Handle failure
        });
    }
}

function isBlacklisted(response) {
    var title = response.items[0].snippet.title.toLowerCase();
    var description = response.items[0].snippet.description.toLowerCase();
    console.log("Title: " + title);
    console.log("Description: " + description);
    for(var i = 0; i < keywordBlacklist.length; i++) {
        if(title.includes(keywordBlacklist[i]) || description.includes(keywordBlacklist[i])) {
            console.log('Title or description contained blacklisted word or phrase: ' + keywordBlacklist[i] + '. Restarting...');
            return true;
        }
    }
    return false;
}

$(document).click(function(e) {
    // Require user input to start if Chrome blocks autoplay
    // TODO: Handle mobile tap(?)
    if(!started) {
        start();
    }
    else if($('#static').hasClass("hidden")) {
        skipVideo();
    }
});

function skipVideo() {
    if(censorTimeout != undefined) {
        clearTimeout(censorTimeout);
        console.log("Cleared censorTimeout.");
    }
    staticSfx.play();
    player.pauseVideo();
    $('#static').removeClass('hidden');
    $('#censor').addClass('hidden');
    findVideo();
}

function hideCensor() {
    $('#censor').addClass('hidden');
}
