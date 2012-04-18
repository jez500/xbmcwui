
/*
 *  Site Router
 *   - manage loading content, navigation, etc.
 */




var router = {
	
	localPlay: {},
	
	pageTarget: '#content-target',
	
	cache: {},
	
	/**
	 * builds page
	 *  @param id
	 *   the hash of the page #id
	 *  @param content
	 *   the content to render to the page target
	 *  @param params
	 *   extra settings 
	 *  
	 */
	buildPage: function(id, content, params){		
		
		//cache
		window.location.hash = id;
		router.cache[ id ] = content;
		
		//build	
		router._buildPage(content);
	},
	
	
	appendPage: function(content){
		$(router.pageTarget).append(content);
	},
	
	
	//moves the page to the give selector, taking into account the offset for the header
	scrollTo: function( selector ){
		if( $( selector ).length > 0 ){
			var scrollitem = $( selector ).offset();		
			$('body').scrollTo( scrollitem.top - 55, 300 );	
		}
	},
	
	
	//get page from cache
	renderCachedPage: function( id ){		
		return router.cache[ id ];		
	},
	

	//does not get cached
	_buildPage: function(content){
		
		$(router.pageTarget).html(content);	
		
		//remove menu active classes, modules must readd this after this has been called (prevents stale active states)
		$('ul.nav li a').removeClass('active');
		
		//decorate songs
		$('.album-row-item').each(function(i,o){ $(o).find('ul.songs li').last().addClass('last'); });
		
		//music selections
		xbmcmusic.selectedItems();	
		
		
		//@TODO
		//Move as much as possible OUT of here, as it gets called when not req
		
		//stop selecting
		$( "#content-target" ).disableSelection();

		$('.custom-playlist-list .tracks li').each(function(i,o){ 
			$(o).attr('data-position', i );
		});
		
	
		
		//browser playlist (remove button)
		templates.setPlaylistSongMenu('.custom-playlist li.song .fill-item');
	},	
	
	
	download: function(path){
		window.location.href = path;
	},
	
	//deprecated
	playInBrowser: function(plid, position){
		
		var pl = playlists.getPlaylist(plid);
		
		var sm = soundManager;
		
		router.localPlay = sm.createSound({
		       id:'song'+song.songid,
		       url:path 
		      });
		
		router.localPlay.play();
		
	},
	
	
	externalUrl: function(url){
		window.open(url, '_blank');
	},
	
	bindWuiMenu: function(){
		
		
		/**
		 * wui-menu 
		 */
		//toggle open
		$('.wui-menu').live('click', function(){
			var btn = $(this);
			if(btn.hasClass('open')){
				btn.removeClass('open'); //close
			} else {
				$('.wui-menu').removeClass('open'); // close all
				btn.addClass('open'); //open this one
			}		
		});		
		//bind events to the menu items
		$('.wui-menu-items .item').live('click', function(){
			var btn = $(this),
				op = btn.attr('data-task');
			
			if(op == 'play-parent-artist'){
				xbmcapi.playMusic({
				 	position: 0,
					fieldName: 'artistid',
					fieldValue: btn.parent().attr('data-artistid'),
					playlistAction: "replace",
					play: true
				}, nowplaying.update );				
			}
			if(op == 'play-parent-artist-add'){
				xbmcapi.playMusic({
				 	position: 0,
					fieldName: 'artistid',
					fieldValue: btn.parent().attr('data-artistid'),
					playlistAction: "add",
					play: false
				}, nowplaying.update );
			}
			
			if(op == 'play-album'){
				xbmcapi.playMusic({
				 	position: 0,
					fieldName: 'albumid',
					fieldValue: btn.attr('data-albumid'),
					playlistAction: "replace",
					play: true
				}, nowplaying.update );				
			}		
			if(op == 'play-parent-album'){
				xbmcapi.playMusic({
				 	position: 0,
					fieldName: 'albumid',
					fieldValue: btn.parent().attr('data-albumid'),
					playlistAction: "replace",
					play: true
				}, nowplaying.update );	
			}	
			if(op == 'play-parent-album-add'){
				xbmcapi.playMusic({
				 	position: 0,
					fieldName: 'albumid',
					fieldValue: btn.parent().attr('data-albumid'),
					playlistAction: "add",
					play: false
				}, nowplaying.update );	
			}	
			
			
			if(op == 'view-artist'){
				xbmcmusic.getArtist(btn.attr('data-artistid'));			
			}
			
			if(op == 'view-album'){
				xbmcmusic.getArtist(btn.attr('data-artistid'), btn.attr('data-albumid'));	
			}	
			if(op == 'view-parent-album'){
				xbmcmusic.getArtist(btn.parent().attr('data-artistid'), btn.parent().attr('data-albumid'));	
			}	
			
			if(op == 'view-playlist'){
				xbmcmusic.getPlayingPage();
			}			
			
			if(op == 'clear-playlist'){
				xbmcapi.playlistClear( nowplaying.update );
				$('#playlist').html('');
			}				
			
			if(op == 'play-parent-song'){
				xbmcapi.playMusic(btn.parent().attr('data-position'), 'albumid', btn.parent().attr('data-albumid'), nowplaying.update );
			}		
			
			if(op == 'search-query'){
				var val = $(this).attr('data-query');
				$('#searchinput').val(val);
				search.doSearch(val);
			}		
			
			
			if(op == 'download-song'){
//				var file = $(this).attr('data-file');
//				xbmcapi.prepareDownload( file, router.download );
			}
			
			if(op == 'play-song-in-browser'){
				var file = $(this).attr('data-file');
				var song = xbmcapi.songByFile[ file ];
				xbmcapi.prepareDownload( file, router.playInBrowser, song );
			}			
			
			
		});		
				
		
	}
		
		
};





/**
 * BBQ 
 */
$(function(){
	  
	  // Keep a mapping of url-to-container for caching purposes.
	  router.cache = {
	    // If url is '' (no fragment), display this div's content.
	    '': $(router.pageTarget)
	  };
	  
	  // Bind an event to window.onhashchange that, when the history state changes,
	  // gets the url from the hash and displays either our cached content or fetches
	  // new content to be displayed.
	  $(window).bind( 'hashchange', function(e) {
		  
	    // Get the hash (fragment) as a string, with any leading # removed. Note that
	    // in jQuery 1.4, you should use e.fragment instead of $.param.fragment().
	    var url = e.fragment;

	    //TURNED OFF - req more work
	  //  router._buildPage( router.renderCachedPage( url ) );
	    
	  });
	  
	  // Since the event is only triggered when the hash changes, we need to trigger
	  // the event now, to handle the hash the page may have loaded with.
	  $(window).trigger( 'hashchange' );
	  
	});




















