

/*
 * play in browser
 */


var browserplayer = {
		 
		repeat: 'off',
		random: 'off',
		localPlay: { 'init': 1 },
		
		playPos: 0,
		plid: 0,
		
		nowplaying: { 'init': 1 },
		
		
		setPlayer: function(player){
			
			if(player == undefined || player == ''){ //toggle
				$('body').toggleClass('xbmc-player').toggleClass('browser-player');
			} else {
				if(player == 'xbmc'){
					$('body').addClass('xbmc-player').removeClass('browser-player');
				}
				if(player == 'browser'){
					$('body').removeClass('xbmc-player').addClass('browser-player');
				}				
			}
						
		},
		
		playInBrowser: function(plid, position){
			
			//get playlist
			var pl = playlists.getPlaylist(plid);
			
			//fix invalid positions
			if(position < 0){
				position = (pl.i.length - 1);
			}
			if(position >= pl.i.length){
				position = 0;
			}				
			
			//set properties
			browserplayer.plid = plid;
			browserplayer.playPos = position;
			
			//get playing item
			var item = {};
			$(pl.i).each(function(i,o){ if( i == position ){ item = o; } });			
			if(item.file == undefined){ return; }
			
			//get song meta
			var song = xbmcapi.getSongByFile( item.file );
			
			$('#myplaylists a:not(#pl-0) i').addClass('icon-chevron-right').removeClass('icon-play').removeClass('icon-pause');
	
			//sm
			var sm = soundManager;
			
			var last = 0;

			//get the path
			xbmcapi.prepareDownload(item.file, function(path){
				
				if(browserplayer.localPlay.init != 1){
					browserplayer.localPlay.stop(); //stop existing
				}
				
				
				//update change song binds
				browserplayer.playingNewSong(item, song);
				
				//kick of soundmanager
				browserplayer.localPlay = sm.createSound({
				       id:'browser-'+song.songid,
				       url: path,
				       autoPlay: false,
				       autoLoad: true,
				       stream: true,	
				       onerror: function(status) { xbmcapi.debug(['SoundManager failed to load: ' + status.type, status]); },
				       onplay: function(){
				    	   $('body').addClass('browser-playing').removeClass('browser-paused');
				    	   $('#pl-' + plid + ' i').removeClass('icon-chevron-right').addClass('icon-play');
				      },
				      // onstop:self.events.stop,
				      onpause:  function(){
				    	   $('body').removeClass('browser-playing').addClass('browser-paused');
				    	   $('#pl-' + plid + ' i').addClass('icon-pause').removeClass('icon-play');
				      },
				      onresume:function(){
			    	     $('body').addClass('browser-playing').removeClass('browser-paused');
			    	     $('#pl-' + plid + ' i').removeClass('icon-pause').addClass('icon-play');
			       	  },
				      onfinish: function(){ 
				    	  if(browserplayer.repeat == 'one'){ //play song again
				    		  browserplayer.playInBrowser(browserplayer.plid,  parseInt(browserplayer.playPos)  ); 
				    	  } else if(browserplayer.random == 'on') {
				    		  browserplayer.playInBrowser(browserplayer.plid, browserplayer.rand(0, (pl.i.length - 1) ));
				    	  } else if(browserplayer.repeat == 'all'){ //play all again
				    		  if(pl.i.length == (parseInt(browserplayer.playPos) + 1) ){ //if last song
				    			  browserplayer.playInBrowser(browserplayer.plid, 0 );  //back to the start
				    		  }
				    	  } else { //otherwise continue to the next item
				    		  browserplayer.playInBrowser(browserplayer.plid, ( parseInt(browserplayer.playPos) + 1) ); 
				    	  }
				    	   
				      },
				      whileplaying: function() {
				    	  
				    	    var pos = parseInt(this.position) / 1000;
				    	    var dur = parseInt(this.duration) / 1000;
				    	  
							var per = (pos / dur) * 100 ;
							
							//percentage
							per = Math.round(per);
																					
							browserplayer.nowplaying.player = {
								'position' : pos,
								'duration' : dur,
								'position' : browserplayer.playPos,
								'plid' : browserplayer.plid
							};
							
							
							$('#browser-time .time-current').html( templates.secondsToHms( pos ) );
							$('#browser-time .time-duration').html( templates.secondsToHms( dur ) );
							
							//update 100 times per song
							if(per != last){
								$( "#browser-progress" ).slider('value', per );

								//add playing status to correct row
								var songlist = $( ".song-list li" ); var row;
								songlist.removeClass('browser-playing');
								songlist.each(function(i,o){
									row = $(o);	
									if( row.attr('data-songid') == browserplayer.nowplaying.item.songid ){
										row.addClass('browser-playing');
									}
								});
								
							}
							last = per;
							
				       		  
				      }	
				});
											
				browserplayer.localPlay.play();				
				
			});
			

			

		},
		
		
		
		play: function(){
			if(browserplayer.localPlay.init != 1){
				browserplayer.localPlay.play(); //play existing
			}
		},
		
		pause: function(){
			if(browserplayer.localPlay.init != 1){
				browserplayer.localPlay.pause(); //pause existing
			}
		},		
		
		
		playingNewSong: function(item, song){
			
			//update nowplaying
			browserplayer.nowplaying.item = song;
			browserplayer.nowplaying.item.file = item.file; //incase not in library
			
			//update playing bits
			$('.browser-playing-thumb').attr('src', templates.imagePath( song.thumbnail) );
			$('.browser-playing-title').html(song.label);
			$('.browser-playing-sub-title').html(song.artist);
			
						
		},		
		
		
		//function to get random number upto m
		rand: function(minVal,maxVal){
		  var randVal = minVal+(Math.random()*(maxVal-minVal));		  
		  return Math.round(randVal);
		},
		
		
		
		binds: function(){
			
			
			$('.action-toggle-player').click(function(){
				browserplayer.setPlayer();
			});
			
			
			//main play controls
			$('#browser-player-controls .action-browser-play').live('click', function(){
				
				if(browserplayer.localPlay.init != 1){
					if($('body').hasClass('browser-playing')){
						browserplayer.pause();
					} else {
						browserplayer.play();
					}					
				}				
			});			
			$('#browser-player-controls .action-browser-next').click( function(){				
				if(browserplayer.localPlay.init != 1){
					browserplayer.playInBrowser(browserplayer.plid, (parseInt(browserplayer.playPos) + 1));			
				}				
			});
			$('#browser-player-controls .action-browser-prev').click( function(){				
				if(browserplayer.localPlay.init != 1){
					browserplayer.playInBrowser(browserplayer.plid, (parseInt(browserplayer.playPos) - 1));			
				}				
			});
				
			//now playing
			$('#browser-playing-button').click(function(){
				playlists.getPlaylistPage(browserplayer.plid);
			});
			
			//repeat
			$('.action-browser-repeat').click(function(){								
				if(browserplayer.repeat == 'off'){ browserplayer.repeat = 'all'; }
				else if(browserplayer.repeat == 'all'){ browserplayer.repeat = 'one'; }
				else if(browserplayer.repeat == 'one'){ browserplayer.repeat = 'off'; }
				
				$('body').removeClass('browser-repeat-off browser-repeat-all browser-repeat-one').addClass('browser-repeat-' + browserplayer.repeat);
				$(this).attr( 'title', 'Repeat ' + browserplayer.repeat );
			});			
			$('.action-browser-repeat').attr( 'title', 'Repeat ' + browserplayer.repeat ); //default
			
			//random
			$('.action-browser-random').click(function(){								
				if(browserplayer.random == 'off'){ browserplayer.random = 'on'; }
				else { browserplayer.random = 'off'; }
					
				$('body').removeClass('browser-shuffle-off browser-shuffle-on').addClass('browser-shuffle-' + browserplayer.random);
				$(this).attr( 'title', 'Random ' + browserplayer.random );
			});			
			$('.action-browser-random').attr( 'title', 'Random ' + browserplayer.random ); //default			
			

			//volume
			browserplayer.initVolume();
			
			//progress
			browserplayer.initProgressBar();
			
		},

		initProgressBar: function( ){

			browserplayer.progressBar = $( "#browser-progress" ).slider({
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
						
						var newpos = (ui.value / 100) * browserplayer.localPlay.duration;
						newpos = Math.round(newpos);
							
						browserplayer.localPlay.setPosition(newpos); 
						
					}
				});
			
		},
		
		initVolume: function(){
			
			$( "#browser-volume" ).slider({
				orientation: "vertical",
				range: "min",
				step: 1,
				value: 100,
				min: 0,
				max: 100,
				stop: function( event, ui ) {

					browserplayer.localPlay.setVolume(ui.value); 					
					
				}
			});
			
			//volume toggle
			$('.action-browser-volume i').click( function(e){ 
				e.preventDefault(); 
				$('.action-browser-volume').toggleClass('open');
			});
			
		}
		

};