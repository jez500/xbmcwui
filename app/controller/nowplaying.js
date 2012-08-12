
var intrerval;

var nowplaying = {	
		
	//selectors
	selNowPlaying: '#now-playing',	
	selCurTime: '#time .time-current',
	selDuration: '#time .time-duration',
	selPlayingThumb: '.playing-thumb',
	selPlayingTitle: '.playing-title',
	selPlayingSubTitle: '.playing-sub-title',	//eg artist (not subtitles)
	
	progressBar: {},
		
	lastplayed: '',
				
	init: function(){
		
		nowplaying.initProgressBar();
		nowplaying.initVolume();
		nowplaying.update();
		
		intrerval = setInterval( function(){
			nowplaying.update();
		},  5000);
	},	
		
	update: function( response ){
		xbmcapi.getNowPlaying( nowplaying.updatePlaying );		
	},	
	
	
	/* our controller for now playing */	
	updatePlaying: function(result){
		xbmcapi.debug(result);
		var playbar = $('body'); //we add classes to the body for some state updates
		
		if(result.item != undefined && result.item.label != undefined){
			//something playing
			playbar.removeClass('show-controls').addClass('show-controls');
			//console.log(result);
			if(result.player != undefined){
				
				//populate some missing data if added via file
				result.item = templates.getPlaylistFileMissing( result.item );
				
				$(nowplaying.selCurTime).html( templates.nowPlayingTime( result.player.time ) );
				$(nowplaying.selDuration).html( templates.nowPlayingTime( result.player.totaltime ) );
				

								
				//console.log(result.player);
				if(result.player != undefined){
					if(result.player.percentage != undefined){
						$( "#progress" ).slider('value', result.player.percentage );
					}
					if(result.player.volume != undefined){
						$( "#volume" ).slider('value', result.player.volume );
					}
					//set control state as body classes
					
					if(result.player.repeat != undefined){
						$( "body" ).removeClass('repeat-all repeat-one repeat-off').addClass('repeat-' + result.player.repeat );
						$('.action-repeat').attr( 'data-task', nowplaying.nextRepeatState() ).attr('title', 'Repeat ' + result.player.repeat);
					}
					if(result.player.shuffled != undefined){
						var shuffuled = (result.player.shuffled ? 'on' : 'off');
						$('.action-random').attr( 'data-task', (result.player.shuffled ? 'UnShuffle' : 'Shuffle') ).attr('title', 'Shuffle ' + shuffuled);
						$( "body" ).removeClass('shuffle-on shuffle-off').addClass('shuffle-' + shuffuled );
					}					
				}
				

				//add playing status to correct row
				var songlist = $( ".song-list li" ); var songid, row, file;
				songlist.removeClass('playing');
				songlist.each(function(i,o){
					row = $(o);					
					songid = row.attr('data-songid');
					if(songid == undefined){
						file = row.attr('data-file'); 
						if(file != undefined && file == result.item.file){
							row.addClass('playing');
						}							
					} else {
						//console.log(songid, result.item.id);
						if(songid == result.item.songid ){
							row.addClass('playing');
						}						
					}
				});		
				
				//nowplaying menu
				$(nowplaying.selNowPlaying + ' .wui-menu-items').html(  nowplaying.nowPlayingMenuItems(result) );
				
				$(nowplaying.selNowPlaying).attr( 'data-albumid', result.item.albumid ) ;
				$(nowplaying.selNowPlaying).attr( 'data-artistid', result.item.artistid ) ;
				
				if(result.player.speed == 1){
					playbar.removeClass('paused').addClass('playing');
				}
				if(result.player.speed == 0){
					playbar.removeClass('playing').addClass('paused');
				}

                //update!
                $(nowplaying.selPlayingThumb).attr('src', templates.imagePath( result.item.thumbnail ) );
                $(nowplaying.selPlayingTitle).html(  result.item.label ) ;
                $(nowplaying.selPlayingSubTitle).html(  result.item.artist ) ;

				//if song has changed, do this...
				if(xbmcapi.nowplaying.changed == 1){
					//rebuild now playing block
					$('#now-playing-region').html( templates.nowPlayingBlock(xbmcapi.nowplaying) );
				}
				
				
			}
									
		} else {
			//nothing playing 
			playbar.removeClass('show-controls');
			$('#now-playing-region').html('');
		}
		
	},

	
	nowPlayingMenuItems: function(result){
		
		var items = '<div class="item view-playlist" data-task="view-playlist" data-query="' + result.item.artist + '"><i class="icon-eye-open"></i> View Playlist</div>' + 
					'<div class="item clear-playlist" data-task="clear-playlist" data-query="' + result.item.artist + '"><i class="icon-remove-sign"></i> Clear Playlist</div>' + 
					'<div class="spacer"></div>' + 
					(result.item.artist != '' ? 
							'<div class="item view-artist" data-task="search-query" data-query="' + result.item.artist + '"><i class="icon-search"></i> Artist</div>' : '' + 
							'<div class="item view-artist" data-task="view-artist" data-artistid="' + result.item.artistid + '"><i class="icon-user"></i> Artist</div>' + 
							'<div class="item view-album" data-task="view-album" data-artistid="' + result.item.artistid + '" data-albumid="' + result.item.albumid + '"><i class="icon-music"></i> Album</div>'
					);
		return items;
	},
	
	
	
	nextRepeatState: function(){
		var next = '';
		var state = xbmcapi.nowplaying.player.repeat;
		if(state == 'all'){ next = 'one'; }
		if(state == 'one'){ next = 'off'; }
		if(state == 'off'){ next = 'all'; }		
		return next;
	},
	
	
	
	initProgressBar: function( ){

		nowplaying.progressBar = $( "#progress" ).slider({
				range: "min",
				step: 1,
				value: 0,
				min: 0,
				max: 100,
				stop: function( event, ui ) {
					
					var params = {
						'playerid': 0,
						'value': ui.value 
					}; 
					
					xbmcapi.sendCommand(
							xbmcapi.buildCommand('Player.Seek', params),
							function(response){		
								
							}
						);					
					
				}
			});
		
	},
	
	initVolume: function(){
		
		$( "#volume" ).slider({
			orientation: "vertical",
			range: "min",
			step: 1,
			value: 0,
			min: 0,
			max: 100,
			stop: function( event, ui ) {
				
				var params = {
					'volume': ui.value 
				}; 
				
				xbmcapi.sendCommand(
						xbmcapi.buildCommand('Application.SetVolume', params),
						function(response){		
							
						}
					);					
				
			}
		});
		
		//volume toggle
		$('.action-volume i').click( function(e){ 
			e.preventDefault(); 
			$('.action-volume').toggleClass('open');
		});
		
	},
	
	
	
	initBrowserProgressBar: function( ){

		nowplaying.progressBar = $( "#browser-player-progress" ).slider({
				range: "min",
				step: 1,
				value: 0,
				min: 0,
				max: 100,
				stop: function( event, ui ) {
					
					var params = {
						'playerid': 0,
						'value': ui.value 
					}; 
					
					console.log('changed');
					
				}
			});
	},
	
	
	
	
	
	
	binds: function(){
		
		/**
		 * Playing
		 */
		
		//play bar
		$('.action-play').live('click', function(e){ e.preventDefault(); xbmcapi.sendPlayerAction('Player.PlayPause', nowplaying.update ); });
		$('.action-next').live('click', function(e){ e.preventDefault(); xbmcapi.sendPlayerAction('Player.GoNext', nowplaying.update ); });
		$('.action-prev').live('click', function(e){ e.preventDefault(); xbmcapi.sendPlayerAction('Player.GoPrevious', nowplaying.update ); });
		
		$('.action-repeat').live('click', function(e){ e.preventDefault(); xbmcapi.setRepeat( $(this).attr('data-task'), nowplaying.update ); });
		$('.action-random').live('click', function(e){ e.preventDefault(); 
			xbmcapi.sendPlayerAction('Player.' + $(this).attr('data-task'), function(){ 
					nowplaying.update(); 
					xbmcapi.getCurrentPlaylist( templates.getPlaylistPage ); //reload playlist (if we are on this page)
				} ); 
			});
		
		$('#playing-button').live('click', function(e){ e.preventDefault(); xbmcmusic.getPlayingPage(); });
		
		nowplaying.initBrowserProgressBar();
		
		//refresh playlist cache
		xbmcapi.getCurrentPlaylist(function(){});
		
	}
	
	
	
		
};