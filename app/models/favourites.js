
/*
 * manage ratings of items 
 */



var favourites = {
		
	activeFavourites: {},
	
	
	/**
	 * Get and set wrappers
	 */
	getAllFavourites: function(){		
		favourites.activeFavourites = $.jStorage.get('favourites', {});		
	},	
	saveAllFavourites: function(){
		$.jStorage.set('favourites', favourites.activeFavourites);
	},
	
	
   /**
	* get status of an item
	* eg. album, 65
	* returns 0 = normal, 1 = voted up, -1 = voted down
	*/
	getStatus: function(type, id){
		//refresh
		favourites.getAllFavourites();
		
		var key = type + id;
		var status = favourites.activeFavourites[ key ];
		if(status == undefined){
			status = 0;
		}
		return status;
		
	},
	
	/**
	 * Set the status on an item
	 * @param type
	 *  item type, eg. album, artist, genre
	 * @param id
	 *  item id
	 * @param status
	 *  1, 0, -1
	 */
	//set status of an item
	// status = 1, 0, -1
	setStatus: function(type, id, status){
		var key = type + id;
		favourites.activeFavourites[ key ] = status;
		favourites.saveAllFavourites();
	},
	
	
	
	/**
	 * Favourites Pages "Thumbs Up"
	 */
	getFavouritesPage: function(){
		
		var out = '';
		var params = {
			'genres': [],
			'artists': [],
			'albums': [],
			'songs' : []
		};
						
		$(xbmcapi.allmusicgenres).each(function(i,o){
			if(o == undefined){ return; }			
			if(favourites.getStatus('genre', o.label) > 0){
				params.genres.push(o);
			}
		});
		
		$(xbmcapi.allartists).each(function(i,o){
			if(o == undefined){ return; }			
			if(favourites.getStatus('artist', o.artistid) > 0){
				params.artists.push(o);
			}
		});

		$(xbmcapi.parsedsongs).each(function(i,o){			
			if(o == undefined){ return; }			
			if(favourites.getStatus('album', o.albumid) > 0){
				params.albums.push(o);
			}			
		});		
		
		$(xbmcapi.allsongs).each(function(i,o){
			if(o == undefined){ return; }			
			if(favourites.getStatus('song', o.songid) > 0){
				params.songs.push(o);
			}	
		});			
		
		out = templates.themeMixedMusicResults(params);		
		router.buildPage( 'op=thumbs-up', '<div id="thumbs-up-result">' + out + '</div>' );
	},
	
	
	
	
	/**
	 * fav class
	 */
	favClasses: function(type, id){
		if(id == undefined){ return ''; }
		status = favourites.getStatus(type, id);
		return ( status > 0 ? 'status-fav' : ( status < 0 ? 'status-not-fav' : '' ) );
	},	
	
	
	
	
	/**
	 * ui
	 */
	binds: function(){
		
		
		$('.op-favourites').click(function(){
			favourites.getFavouritesPage();
			$('ul.nav li a').removeClass('active');
			$(this).addClass('active');
			$('body').scrollTo(0,300);
		});
		
		
		$('.favourite-button').live('click', function(){
			//vars
			var item = $(this),
				type = item.attr('data-type'),
				p = item.closest('.' + type + '-item');

			var id = item.attr('data-id');
			var status = item.attr('data-status');
			var existing = favourites.getStatus(type, id);
			
			//toggle back to normal status
			if(status == existing){
				status = 0;
			}
			
			//set correct class on parent
			if(status > 0){ p.addClass('status-fav').removeClass('status-not-fav'); }
			if(status < 0){ p.addClass('status-not-fav').removeClass('status-fav');	}		
			if(status == 0){ p.removeClass('status-not-fav').removeClass('status-fav');	}
			
			//toggle selected on parent (to revert back)
			if(p.hasClass('song')){
				p.toggleClass('selected');
			}
			
			//save
			favourites.setStatus(type, id, status);
		});
		
		favourites.getAllFavourites();
	}
	
		
};

