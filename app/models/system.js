
/*
 * xbmc system object
 */


var system = {
	
	getStats: function(){
		
		var out = '<div class="content-page">' + 
					'<h3>Library Stats</h3>' + 
					'<div class="items">' + 
						'<p><label>Songs: </label><span>' + xbmcapi.allsongs.length + '</span></p>' + 
						'<p><label>Albums: </label><span></span>' + xbmcapi.parsedsongs.length + '</p>' + 
						'<p><label>Artists: </label><span></span>' + xbmcapi.allartists.length + '</p>' + 
					'</div>'; 
		
		if(xbmcapi.nowplaying.item != undefined){	
					out += '<h3>Now Playing</h3>';
					out += templates.nowPlayingBlock(xbmcapi.nowplaying);								
		}
										
		out += '</div>'; //end content page
		
		router.buildPage( 'op=stats', out);
		
	},	
		
	
	binds: function(){
		
		$('.op-stats').click(function(){
			system.getStats();						
		});
		
	}	
		
};




