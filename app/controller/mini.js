/**
 * MiniPlayer controller
 * tries to extend base player functionality as much as possible
 */


var miniplayer = {

    /**
     * start
     */
    init: function(){

        //see if anything is playing
        xbmcapi.getActivePlayers( function(data){
            xbmcapi.getNowPlaying( function(data){
                miniplayer.readystate(data);
            });
        });

    },

    readystate: function(data){
        //we are loaded
        nowplaying.init();
        nowplaying.binds();

        xbmcmusic.binds();
        xbmcmusic.getPlayingPage();

        miniplayer.notify('stop', '');
    },



    notify: function(state, msg, autoclose){
        var o = $('#notify');
        if(state == 'start'){
            o.hide();
            o.html(msg);
            o.fadeIn();
            if(autoclose == 1){
                window.setTimeout(function(){
                    mainapp.notify('stop', '');
                }, 3000);
            }
        }
        if(state == 'stop'){
            o.fadeOut();
            //o.html(msg);
        }
    }

}



/* document ready for binds */
$(document).ready(function(){

    $('h2.title').click(function(){
        xbmcapi.getNowPlaying( miniplayer.readystate );
    })

    miniplayer.init();

});

