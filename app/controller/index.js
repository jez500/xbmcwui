/*
 * Main controller
 */

var mainapp = {
	
	//vars
		
	contentTarget: '#content-target', //where all content goes, constantly gets replaced with new content	
	window: $(window), //cache
	
	
	/*********************************************************************************************
	 * Init Steps
	 * 
	 * Main intended usage for this is music so we load the entrie library (all songs) to an array
	 * Then do a shitload of parsing and we result our ablums, artists, genres and songs. All of 
	 * which can be retrived via the xbmcapi object
	 * 
	 ********************************************************************************************/		
	
	//Step 1
	//Start the request
	
	init: function(){
			
		mainapp.notify('start', 'Loading Music' );
		
		
		//show loading dialog
		mainapp.dialog('<p>' + mainapp.loaderAnimation + ' <span class="lt">Loading the music library</span></p>', { 
			title: 'Loading Application', 
			height: 140
		});
		//if it has been 10secs update the user
		setTimeout(function(){
			$('#dialog .lt').html('Still loading...');
		}, 10000);
		
		
		xbmcapi.getActivePlayers();
		mainapp.bodyBlur();
						
		$('.toggler').click(function(e){
			$(this).parent().toggleClass('open');
			return false;
		});
		xbmcapi.getSongs( mainapp.songsCallback );	
		
	},
	
	
	//Step 2
	//Parse into albums, artists, genres
	
	songsCallback: function(result){	
		
		//$('#dialog').html('Reading...' );	
		
		xbmcapi.parseMusic( mainapp.initApp );	
		
	},
	
		
	//Step 3
	//Final Step, ready for action!
	
	initApp: function(result){
		
		//player interface is now good to go
		nowplaying.init();
		
		//default to music homepage
		xbmcmusic.getHome();
		
		//stop loading message
		mainapp.notify('stop', '');	
		
		//hide loading dialg / overlay
		mainapp.dialogClose();		
		
		//switch to music
		mainapp.openMusic();		
				
	},
	

	
	
	screenLog: function(text){		
		$('#screen-log').append('<div class="log-row">' + text + '</div>');		
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
		

	},
	
	
	
	/* helpers */
	
	/* loading start/stop */
	loading: function(action, msg){
		var body = $('body');
		if(msg == undefined || msg == ''){ msg = '';	}
		body.removeClass('loading');
		if(action == 'start'){
			body.addClass('loading');			
		} 
		$('#loading-msg').html(msg);		
	},
	
	nearbottom: function(e) {

		var pixelsFromWindowBottomToBottom = 0 + $(document).height() - (mainapp.window.scrollTop()) - $(window).height();
	    var pixelsToBottom = 600;
	    
	    return (pixelsFromWindowBottomToBottom < pixelsToBottom);

	},
	
	loaderAnimation: '<div class="loader"><span></span><span></span><span></span></div>​', 
	
	
	/*
	 * switches to music mode 
	 */
	openMusic: function(){
		
		//open music sidebar to indicate ready
		$('.music-parent, .myplaylists-wrapper').addClass('open');
			
	},	
	
	
	/*
	 * switches to video mode 
	 */
	openVideo: function(){
		
		//close music sidebar to indicate ready
		$('.music-parent, .myplaylists-wrapper').removeClass('open');
	
	},	
		
	
	
	//hide all dialogs
	bodyBlur: function(){	
		
	},
	
	
	
	dialogSelector: "#dialog",
	
	/**
	 * Wrapper for dialog box init
	 * @param options
	 *  http://jqueryui.com/demos/dialog/
	 */
	dialogInit: function( options ){
		
		var settings = {
			autoOpen: false,
			height: "auto",
			width: 350,
			modal: true ,
			resizable: false
		};
		
		settings = jQuery.extend(settings, options);
		
		$( mainapp.dialogSelector ).dialog( settings );
		
	},
	
	
	/**
	 * Wrapper for dialog box init
	 * @param content
	 *  content for the dialog
	 * @param options
	 *  http://jqueryui.com/demos/dialog/
	 */	
	dialog: function(content, options){
		
		$( mainapp.dialogSelector ).dialog( "option", "height", "auto"); 
		$( mainapp.dialogSelector ).dialog( "option", "title", " ");
		
		//set content and options
		$( mainapp.dialogSelector ).html(content);
		$( mainapp.dialogSelector ).dialog( "option", options );
		
		//fix scrollTo issue with dialog		
		$( mainapp.dialogSelector ).bind( "dialogopen", function(event, ui) {			
			$('.ui-widget-overlay, .ui-dialog').css('position', 'fixed');
			$('.dialog-menu a:last').addClass('last');
		});
		
		//open
		$( mainapp.dialogSelector ).dialog( "open" );
	},
	
	dialogClose: function(){		
		$( mainapp.dialogSelector ).dialog( "close" );
	}
	
	
	
		
};





/* document ready for binds */
$(document).ready(function(){
	
	// logo action 
	$('#logo').click(function(){ xbmcmusic.getHome(); });
		
	// bind player / now playing 
	nowplaying.binds();
	
	// bind music to ui 
	xbmcmusic.binds();
		
	//files binds
	files.binds();

	//system binds
	system.binds();	
	
	// bind search 
	search.binds();
	
	// bind template items (pager)
	templates.binds();
	
	//debug
	xbmcapi.getIntrospect();

	
	// bind dropdown menus
	router.bindWuiMenu();
	
	playlists.initPlaylist();

	//sound manager	
	soundManager.url = '/lib/soundmanager/swf/';
	soundManager.preferFlash = true; 
	soundManager.flashVersion = 9; // optional: shiny features (default = 8)
	soundManager.useFlashBlock = false;	
	soundManager.onready(function() {
		  // Ready to use; soundManager.createSound() etc. can now be called.
	});
	
	browserplayer.binds();
	
	//get dialog ready for action
	mainapp.dialogInit();
		
	//start it up
	mainapp.init();	
	
});



