$(function() {
    var staticSfx = new Audio('public/static.ogg');
    staticSfx.loop = true;

    var started = false;

    function start() {
        staticSfx.play().then(
            function(result) {
                $('#static').removeClass('hidden');
                $('#playicon').addClass('hidden');
                started = true;
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

    $(document).click(function(e) {
        if(!started) {
            start();
        }
    });
});
