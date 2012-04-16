
/*
 * xbmc system object
 */


var system = {
	
	getStats: function(){
		var out;
		out = '<div class="content-page">' + 
					'<h3>Library Stats</h3>' + 
					'<div class="items">' + 
						'<p><label>Songs: </label><span>' + xbmcapi.allsongs.length + '</span></p>' + 
						'<p><label>Albums: </label><span></span>' + xbmcapi.parsedsongs.length + '</p>' + 
						'<p><label>Artists: </label><span></span>' + xbmcapi.allartists.length + '</p>' + 
					'</div>'; 
		
		out += '<h3>Toolbox</h3>' + 
				'<div class="items">' + 
					'<p><a href="#op=scan" class="op-scan-music-library">Scan music library</a></p>' + 
				'</div>'; 		
		
		if(xbmcapi.nowplaying.item != undefined){	
					out += templates.nowPlayingBlock(xbmcapi.nowplaying);								
		}
										
		out += '</div>'; //end content page
		
		router.buildPage( 'op=stats', out);
		
	},	
		
	
	binds: function(){
		
		$('.op-stats').click(function(){
			system.getStats();						
		});
		
		$('.op-scan-music-library').live('click', function(){
			xbmcapi.scanMusic( function(res){ mainapp.notify('start', 'Scan of music started',1); }  );
			return false;
		});
		
	}	
		
};




