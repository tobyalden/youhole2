const searchURL = 'https://www.googleapis.com/youtube/v3/search?order=date&part=snippet&type=video&safeSearch=none&maxResults=50&key=AIzaSyAHu80T94GGhKOzjBs9z5yr0KU8v48Zh60&q='
const statsURL = "https://www.googleapis.com/youtube/v3/videos?part=statistics&key=AIzaSyAHu80T94GGhKOzjBs9z5yr0KU8v48Zh60&id=";

const englishWordsURL = 'https://raw.githubusercontent.com/tobyalden/youhole2/master/dictionaries/google-10000-english-usa.txt'
const spanishWordsURL = 'https://raw.githubusercontent.com/tobyalden/youhole2/master/dictionaries/spanish.txt'
const portugueseWordsURL = 'https://raw.githubusercontent.com/tobyalden/youhole2/master/dictionaries/pt_50k.txt'
const frenchWordsURL = 'https://raw.githubusercontent.com/tobyalden/youhole2/master/dictionaries/fr_50k.txt'
const russianWordsURL = 'https://raw.githubusercontent.com/tobyalden/youhole2/master/dictionaries/ru_50k.txt'
const indonesianWordsURL = 'https://raw.githubusercontent.com/tobyalden/youhole2/master/dictionaries/Indonesia.dic.txt'
const germanWordsURL = 'https://raw.githubusercontent.com/tobyalden/youhole2/master/dictionaries/de_50k.txt'
const swahiliWordsURL = 'https://raw.githubusercontent.com/tobyalden/youhole2/master/dictionaries/sw_KE.dic.txt'
const vietnameseWordsURL = 'https://raw.githubusercontent.com/tobyalden/youhole2/master/dictionaries/Vietnamese_vi_VN.dic.txt'
const italianWordsURL = 'https://raw.githubusercontent.com/tobyalden/youhole2/master/dictionaries/it_50k.txt'
const dictionaries = [englishWordsURL, englishWordsURL, englishWordsURL, spanishWordsURL, portugueseWordsURL, frenchWordsURL, russianWordsURL, russianWordsURL, indonesianWordsURL, germanWordsURL, swahiliWordsURL, vietnameseWordsURL, italianWordsURL];
// English and Russian dictionaries appear more than once to account for their strong YouTube presence:
// https://www.statista.com/statistics/280685/number-of-monthly-unique-youtube-users/

const CJKUnifiedIdeographsBlock = [0x4E00, 0x9FCC];
const HangulSyllablesBlock = [0xAC00, 0xD7A3];
const DevanagariBlock = [0x0900, 0x097F];
const ArabicBlock = [0x0600, 0x06FF];
const BengaliBlock = [0x0980, 0x09FF];
const HiraganaBlock = [0x3040, 0x309F];
const KatakanaBlock = [0x30A0, 0x30FF];
const TeluguBlock = [0x0C00, 0x0C7F];
const TamilBlock = [0x0B80, 0x0BFF];
const LatinBlock = [0x0000, 0x007F];

const unicodeBlocks = [[CJKUnifiedIdeographsBlock], [HangulSyllablesBlock], [DevanagariBlock], [ArabicBlock], [BengaliBlock], [HiraganaBlock, KatakanaBlock], [HiraganaBlock, KatakanaBlock], [TeluguBlock], [TamilBlock], [LatinBlock], [LatinBlock], [LatinBlock]];
// Hiragana & Katakana blocks appear twice to account for Japan's strong YouTube presence:
// https://www.statista.com/statistics/280685/number-of-monthly-unique-youtube-users/
// Latin block appears three times because it's so versatile

const viewCountThreshold = 500;
const keywordBlacklist = [];

var debug = true;
if(!document.fullscreenEnabled) {
    $("#fullscreen").addClass("hidden");
}

// https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
window.addEventListener('resize', () => {
  // We execute the same script as before
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
});

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
        videoId: 'vUySIPTxtvQ',
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
    $('#playicon').removeClass('hidden');
    isPlayerReady = true;
}

function onError(event) {
    log("YouTube error (code " + event.data + "). Restarting...");
    findVideo();
}

var staticSfx = new Audio('public/static.mp3');
staticSfx.loop = true;

var started = false;
var firstVideoFound = false;
var censorTimeout;
function onPlayerStateChange(event) {
    if(event.data == YT.PlayerState.BUFFERING && !started) {
        player.pauseVideo();
        start();
    }
    if(event.data == YT.PlayerState.PLAYING && firstVideoFound) {
        $('#player').css('opacity', 1);
        $('#static').addClass('hidden');
        staticSfx.pause();
        $('#censor').removeClass('hidden');
        censorTimeout = setTimeout(hideCensor, 4000);
    }
    else if(event.data == YT.PlayerState.ENDED) {
        skipVideo();
    }
}

function start() {
    if(started) {
        return;
    }
    staticSfx.play();
    $('#static').removeClass('hidden');
    $('#overlay').removeClass('hidden');
    $('#playicon').addClass('hidden');
    $('#warning').addClass('hidden');
    started = true;
    findVideo();
}

function findVideo() {
    var useDictionary = Math.random() >= 0.5;
    if(useDictionary) {
        var dictionary = dictionaries[Math.floor(Math.random() * dictionaries.length)];
        log('Using dictionary: ' + dictionary);
        $.ajax({
            type: "GET",
            url: dictionary,
            success: function(response) {
                var randomLine = getRandomLinesFromTextFile(response, Math.round(1 + Math.random()));
                useSearchTerm(randomLine);
            },
            error: handleAjaxError
        });
    }
    else {
        var unicodeBlock = unicodeBlocks[Math.floor(Math.random() * unicodeBlocks.length)];
        log('Using Unicode block: ' + unicodeBlock);
        useSearchTerm(getRandomCharactersFromUnicodeBlocks(unicodeBlock, 2));
    }
}

function handleAjaxError(xhr) {
    log('Error! Request Status: ' + xhr.status + ' Status Text: ' + xhr.statusText + ' ResponseText: ' + xhr.responseText, true);
    findVideo();
}

function getRandomCharactersFromUnicodeBlocks(blocks, numCharacters) {
    var randomCharacters = "";
    for(var i = 0; i < numCharacters; i++) {
        var block = blocks[Math.floor(Math.random() * blocks.length)];
        randomCharacters += String.fromCharCode(block[0] + Math.random() * (block[1] - block[0] + 1));
    }
    return randomCharacters;
}

function getRandomCharactersFromString(string, numCharacters) {
    var randomCharacters = "";
    var characters = string.split("");
    for(var i = 0; i < numCharacters; i++) {
        randomCharacters += characters[Math.floor(Math.random() * characters.length)];
    }
    return randomCharacters;
}

function getRandomLinesFromTextFile(textFile, numLines) {
    var allLines = textFile.split("\n");
    var randomLines = [];
    for(var i = 0; i < numLines; i++) {
        var index = Math.floor(allLines.length * Math.random());
        randomLines.push(allLines[index].split("/")[0].split(" ")[0]);
    }
    return randomLines.join(" ");
}

function useSearchTerm(searchTerm) {
    log('Using search term: ' + searchTerm);
    $.ajax({
        type: "GET",
        url: searchURL + encodeURI(searchTerm),
        success: playVideo,
        error: handleAjaxError
    });
}

function playVideo(response) {
    if (response.items.length < 1) {
        log('No results! Restarting...');
        findVideo();
    }
    else {
        log(response.items.length + " videos found.");
        var videoChoice = Math.floor(Math.random() * response.items.length);
        var videoId = response.items[videoChoice].id.videoId;
        log("videoChoice is " + videoChoice);
        log("videoId is " + videoId);
        if(isBlacklisted(response.items[videoChoice])) {
            findVideo();
        }
        else {
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
                            firstVideoFound = true;
                            player.loadVideoById(videoId);
                        }
                    }

                },
                error: handleAjaxError
            });
        }
    }
}

function log(message, isError = false) {
    if(!isError && !debug) {
        return;
    }
    console.log(message);
    //$('#errors').append(message + '<br>');
}

function isBlacklisted(video) {
    var title = video.snippet.title.toLowerCase();
    var description = video.snippet.description.toLowerCase();
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

$("#fullscreen").click(function(e) {
    document.body.requestFullscreen();
});

document.onfullscreenchange = function(e) {
    if(e.currentTarget.fullscreen) {
        $("#fullscreen").addClass("hidden");
    }
    else {
        $("#fullscreen").removeClass("hidden");
    }
}

$(document).on('click keypress', function(e) {
    if(e.target.id == "fullscreen") {
        return;
    }
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
    staticSfx.play();
    player.pauseVideo();
    $('#static').removeClass('hidden');
    $('#censor').addClass('hidden');
    findVideo();
}

function hideCensor() {
    $('#censor').addClass('hidden');
}
