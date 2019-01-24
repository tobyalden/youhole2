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
const vietnameseWordsURL = 'https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/Vietnamese_vi_VN.dic'
const italianWordsURL = 'https://raw.githubusercontent.com/titoBouzout/Dictionaries/master/Italian.dic'
const dictionaries = [englishWordsURL, spanishWordsURL, portugueseWordsURL, frenchWordsURL, russianWordsURL, indonesianWordsURL, germanWordsURL, swahiliWordsURL, vietnameseWordsURL, italianWordsURL];

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

const unicodeBlocks = [[CJKUnifiedIdeographsBlock], [HangulSyllablesBlock], [DevanagariBlock], [ArabicBlock], [BengaliBlock], [HiraganaBlock, KatakanaBlock], [HiraganaBlock, KatakanaBlock], [TeluguBlock], [TamilBlock]];
// Hiragana & Katakana Blocks appear twice to account for Japan's strong YouTube presence:
// https://www.statista.com/statistics/280685/number-of-monthly-unique-youtube-users/

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
            modestbranding: 1,
            playsinline: 1
        }
    });
}

var isPlayerReady = false;
function onPlayerReady(event) {
    log('YouTube API loaded.');
    isPlayerReady = true;
}

function onError(event) {
    log("YouTube error (code " + event.data + "). Restarting...");
    findVideo();
}

//var staticSfx = new Audio('public/static.mp3');
//staticSfx.loop = true;

var started = false;
var censorTimeout;
function onPlayerStateChange(event) {
    if(event.data == YT.PlayerState.PLAYING) {
        if(!started) {
            player.pauseVideo();
            start();
        }
        else {
            $('#static').addClass('hidden');
            //staticSfx.pause();
            $('#censor').removeClass('hidden');
            censorTimeout = setTimeout(hideCensor, 4000);
        }
    }
    else if(event.data == YT.PlayerState.ENDED) {
        skipVideo();
    }
}

function start() {
    if(started) {
        return;
    }
    $('#static').removeClass('hidden');
    $('#overlay').removeClass('hidden');
    //$('#player').removeClass('hidden');
    //$('#playicon').addClass('hidden');
    started = true;
    findVideo();
}

//function start() {
    //if(started) {
        //return;
    //}
    //staticSfx.play().then(
        //function(result) {
            //$('#static').removeClass('hidden');
            //$('#overlay').removeClass('hidden');
            //$('#player').removeClass('hidden');
            ////$('#playicon').addClass('hidden');
            //started = true;
            //findVideo();
        //},
        //function(error) {
            //if(error instanceof DOMException && error.name == 'NotAllowedError') {
                //// Chrome's autoplay policy prevented the audio from playing:
                //// https://developers.google.com/web/updates/2017/09/autoplay-policy-changes
                //$('#player').removeClass('hidden');
                //log('NotAllowedError');
            //}
            //else {
                //log('another error: ' + error.name);
            //}
        //}
    //);
//}

//start();

function findVideo() {
    //if(isPlayerReady) {
        getSearchTerm();
    //}
    //else {
        //setTimeout(findVideo, 100);
    //}
}

function getSearchTerm() {
    var useDictionary = Math.random() >= 0.5;
    if(useDictionary) {
        var dictionary = dictionaries[Math.floor(Math.random() * dictionaries.length)];
        log('Using dictionary: ' + dictionary);
        $.ajax({
            type: "GET",
            url: dictionary,
            success: function(response) {
                var randomLine = getRandomLineFromTextFile(response);
                useSearchTerm(randomLine);
            }
            // TODO: Handle failure
        });
    }
    else {
        var unicodeBlock = unicodeBlocks[Math.floor(Math.random() * unicodeBlocks.length)];
        log('Using Unicode block: ' + unicodeBlock);
        useSearchTerm(getRandomCharactersFromUnicodeBlocks(unicodeBlock, 2));
    }
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
    log('Using search term: ' + searchTerm);
    $.ajax({
        type: "GET",
        url: searchURL + encodeURI(searchTerm),
        success: playVideo,
        // TODO: Handle failure
    });
}

function playVideo(response) {
    if (response.items.length < 1) {
        log('No results! Restarting...');
        findVideo();
    }
    else if(isBlacklisted(response)) {
        findVideo();
    }
    else {
        log(response.items.length + " videos found.");
        var videoChoice = Math.floor(Math.random() * response.items.length);
        var videoId = response.items[videoChoice].id.videoId;
        log("videoChoice is " + videoChoice);
        log("videoId is " + videoId);
        $.ajax({
            type: "GET",
            url: statsURL + videoId,
            success: function(statsResponse) {
                if(statsResponse == undefined || statsResponse.items == undefined || statsResponse.items[0] == undefined) {
                    log("Stats unavailable. Restarting...");
                    findVideo();
                }
                else {
                    var viewCount = statsResponse.items[0].statistics.viewCount;
                    if(viewCount > viewCountThreshold) {
                        log("Too many views: " + viewCount + ". Restarting...");
                        findVideo();
                    }
                    else {
                        log("Playing video with " + viewCount + " views.");
                        player.loadVideoById(videoId);
                    }
                }

            }
            // TODO: Handle failure
        });
    }
}

function log(message) {
    $('#errors').append(message + '<br>');
    console.log(message);
}

function isBlacklisted(response) {
    var title = response.items[0].snippet.title.toLowerCase();
    var description = response.items[0].snippet.description.toLowerCase();
    log("Title: " + title);
    log("Description: " + description);
    for(var i = 0; i < keywordBlacklist.length; i++) {
        if(title.includes(keywordBlacklist[i]) || description.includes(keywordBlacklist[i])) {
            log('Title or description contained blacklisted word or phrase: ' + keywordBlacklist[i] + '. Restarting...');
            return true;
        }
    }
    return false;
}

$(document).click(function(e) {
    // Require user input to start if Chrome blocks autoplay
    // TODO: Handle mobile tap(?)
    log("Click!");
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
        log("Cleared censorTimeout.");
    }
    //staticSfx.play();
    player.pauseVideo();
    $('#static').removeClass('hidden');
    $('#censor').addClass('hidden');
    findVideo();
}

function hideCensor() {
    $('#censor').addClass('hidden');
}
