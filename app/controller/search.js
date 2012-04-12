
var search = {
	
	//wrapper for search	
	doSearch: function(val){
		if(val.length > 0){			
			search.resultPage( val );	
			$('body').addClass('search-query');
		} else {
			$('body').removeClass('search-query');
			out = '<div class="content-page"><h3>Search XBMC</h3>' + 
					'<p>Enter a search keyword to get started</p></div>';
			router.buildPage( 'op=search&nr=1',   out );
		}
		$('body').scrollTo( '0px', 300 );
	},	
	
	//get result sets
	resultPage: function(query){
		
		var artists = [];
		var albums = [];
		var songs = [];
		var ss = '';
		
		$(xbmcapi.allartists).each(function(i,o){
			query = query.toLowerCase();
			ss = o.artist;
			
			if (ss.toLowerCase().indexOf(query) != -1){
				artists.push(o);
			}
		});

		$(xbmcapi.parsedsongs).each(function(i,o){
			
			if(o == undefined){ return; }
			
			query = query.toLowerCase();
			ss = o.label;
			
			if (ss.toLowerCase().indexOf(query) != -1){
				albums.push(o);
			}
		});		
		
		$(xbmcapi.allsongs).each(function(i,o){
			
			if(o == undefined){ return; }
			
			query = query.toLowerCase();
			ss = o.label.toLowerCase();
			
			if (ss.search(query) != -1){
				songs.push(o);
			}
		});			
		
		search.themeMusicResults(artists, albums, songs, query);
		
	},
	
	
	themeMusicResults: function(artists, albums, songs, query){
		
		var out = '';	
		
		if(artists.length > 0){
			out += '<h3>Artists</h3>' + templates.artistsList(artists, 0);
		}
		if(albums.length > 0){
			out += '<h3>Albums</h3>' + templates.albumGalleryList(albums, 0);
		}
		if(songs.length > 0){
			out += '<h3>Songs</h3>' + templates.songList(songs, 0);
		}		
		
		if(out == '') {
			out = '<div class="content-page"><h3>No Results Found</h3><p>Try a different keyword or <a href="#" class="action-update-music">update the music library</a></p></div>';
		}
		
		router.buildPage( 'op=search&q=' + query, out );
	},
	
	binds: function(){
		
		/* search box */
		$('#searchinput').keyup(function(){
			var val = $(this).val();
			search.doSearch(val);
		});
		$('#clearsearch').click(function(){ $('#searchinput').val(''); search.doSearch(''); });
		$('#search-button').click(function(){  search.doSearch( $('#searchinput').val() ); });
		
		$('.action-update-music').live('click', function(e){
			e.preventDefault(); 
			xbmcapi.sendPlayerAction('AudioLibrary.Scan', nowplaying.update );
		});
		
		$('.search-me').live('click', function(){
			var val = $('.search-me').html();
			$('#searchinput').val(val); search.doSearch(val);
		});
		
	}
		
};



