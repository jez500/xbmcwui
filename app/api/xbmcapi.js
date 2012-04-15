
/**
 * XBMC API - Abstracts JSON RPC calls
 * makes things easy
 * 
 * Author: Jeremy Graham - impakt
 */





var xbmcapi = {

	/*********************************************************************************************
	 * Properties
	 ********************************************************************************************/		
		
	//max limits for lists
	maxItems: 12000, //bigest overhead in the app - this is the amount of songs to store and iterate over
	
	//caches
	allartists: [],
	allartistsObj: [],
	allalbums: [],
	allalbumsObj: [],
	allsongs: [],
	allmusicgenres: [],
	parsedsongs: [],
	activeplayers: [],
	playlist: [],
	nowplaying: {'changed': 0},
	parsedartists: [],
	sourcefolders: [],
	songByFile: {},
	songByGenre: {},
	songByFileAlt: {},
	songById: {},
	
	debugState: false,
	
	lastCommand: '',
	
	
	/*********************************************************************************************
	 * Talk to XBMC
	 ********************************************************************************************/	
	
	/* Send a command to xbmc */
	sendCommand: function(command, onSuccess, onError, onComplete, asyncRequest) {
		if (typeof asyncRequest == 'undefined'){
			asyncRequest = true;
		}

		xbmcapi.lastCommand = command;
		
		if (!this.xbmcHasQuit) {
			$.ajax({
				async: asyncRequest,
				type: 'POST',
				url: './jsonrpc?jqm',
				data: command,
				dataType: 'json',
				cache: false,
				timeout: this.timeout,
				success: function(result, textStatus, XMLHttpRequest) {

					// its possible to get here on timeouts. --> error
					if (XMLHttpRequest.readyState==4 && XMLHttpRequest.status==0) {
						if (onError) {
							onError({"error" : { "ajaxFailed" : true, "xhr" : XMLHttpRequest, "status" : textStatus }});
						}
						return;
					}

					// Example Error-Response: { "error" : { "code" : -32601, "message" : "Method not found." } }
					if (result.error) {
						if (onError) { onError(result); } else {
							xbmcapi.failedSendCommand('found a problem! This was the last command: ' + xbmcapi.lastCommand , result );
						}
						return;
					}

					if (onSuccess) { onSuccess(result); }
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					if (onError) {
						onError({"error" : { "ajaxFailed" : true, "xhr" : XMLHttpRequest, "status" : textStatus, "errorThrown" : errorThrown }});
					}
				},
				complete: function(XMLHttpRequest, textStatus) {
					if (onComplete) { onComplete(); }
				}
			});
		}
	},

	/* get all artists */
	getIntrospect: function(){
		
		xbmcapi.sendCommand(
			'{"jsonrpc": "2.0", "method": "JSONRPC.Introspect", "id": 1}',
			function(response){
				console.log(response.result);
			},
			function (response){ xbmcapi.failedSendCommand('JSONRPC.Introspect', response); }
		);

	},
	
	
	
	/********************************************************************************************
	 * player
	 ********************************************************************************************/
	
	/* send player action 
	 * Actions dont require the response 
	 */
	sendPlayerAction: function(action, success_callback ){
						
		if(xbmcapi.activeplayers[0] != undefined){
			
			var params = {'playerid' : xbmcapi.activeplayers[0].playerid }	;
			
			xbmcapi.sendCommand(
				xbmcapi.buildCommand(action, params),
				function(response){
					//success
					if(success_callback) { success_callback( response ); };
				}
			);		
		
		}
	},	
	
	
	/* Get Active Players
	 */
	getActivePlayers: function(){
		
		xbmcapi.sendCommand(
				xbmcapi.buildCommand('Player.GetActivePlayers'),
				function(response){					
					xbmcapi.activeplayers = response.result;										
				}
			);		
		
	},	
		
	
	/* set Repeat
	 */
	setRepeat: function(state, success_callback){
		var params = {
				'playerid' : xbmcapi.activeplayers[0].playerid,
				'state' : '"' + state + '"'
		};
		xbmcapi.sendCommand(
			xbmcapi.buildCommand('Player.Repeat', params),
			function(response){
				//success
				if(success_callback) { success_callback( response ); };
			}
		);			
	},	
	
	
	
			
	/**
	 * Get Now Playing 
	 */
	getNowPlaying: 	function( success_callback ){
						
		if(xbmcapi.activeplayers[0] != undefined){
			
			var params = {'playerid' : xbmcapi.activeplayers[0].playerid }	;
			params.properties = '["title", "artist", "artistid", "album", "albumid", "genre", "track", "duration", "year", "rating", "playcount", "albumartist", "file", "thumbnail"]';
			
			//get item details
			xbmcapi.sendCommand(
				xbmcapi.buildCommand('Player.GetItem', params),
				function(response){
					
					//detect song change
					xbmcapi.nowplaying.changed = 0;					
					if(xbmcapi.nowplaying.item != undefined && response.result.item.file != xbmcapi.nowplaying.item.file){
						xbmcapi.nowplaying.lastitem = xbmcapi.nowplaying.item;
						xbmcapi.nowplaying.changed = 1;
					}
					if(xbmcapi.nowplaying.item == undefined){
						xbmcapi.nowplaying.changed = 1;
					}
					xbmcapi.nowplaying.item = response.result.item;
					
					//player params
					var playerparams = {
						'playerid' : xbmcapi.activeplayers[0].playerid,
						'properties' : '[ "playlistid", "speed", "position", "totaltime", "time", "percentage", "shuffled", "repeat", "canrepeat", "canshuffle", "canseek" ]'
					};
					
					//get play position, etc
					xbmcapi.sendCommand(
							xbmcapi.buildCommand('Player.GetProperties', playerparams),	
							function(response){ 
								xbmcapi.nowplaying.player = response.result;
								//getvolume
								xbmcapi.sendCommand(
										xbmcapi.buildCommand('Application.GetProperties', {'properties': '[ "volume", "muted"]'}),	
										function(response){
											//anoying how I have to make another call to get the status of this
											//why is it not part of the player properties!
											xbmcapi.nowplaying.player.volume = response.result.volume;
											xbmcapi.nowplaying.player.muted = response.result.muted;
											
											success_callback( xbmcapi.nowplaying );
										}
								);																 
							}
					);
										
				},
				function(respose){
					//nothing playling
					$('body').removeClass('playing');
					xbmcapi.nowplaying.lastitem = xbmcapi.nowplaying.item;
					xbmcapi.nowplaying.item = {};
					xbmcapi.nowplaying.changed = 0;
				}
			);		
					
		} else {
			//no active players? nothing playing
			xbmcapi.nowplaying = [];
			success_callback( xbmcapi.nowplaying ); 
			
			//we should keep checking for active players incase something has since started
			xbmcapi.getActivePlayers();
		}
	},	
			

	
	
	/*********************************************************************************************
	 * Playlist
	 ********************************************************************************************/	
	
	
	/* get playlist */
	getCurrentPlaylist: function( success_callback ){
							
			var params = {'playlistid' : 0 };
			params.properties = '["title", "artist", "artistid", "album", "albumid", "genre", "track", "duration", "year", "rating", "playcount", "albumartist", "file", "thumbnail"]';
			
			xbmcapi.sendCommand(
					xbmcapi.buildCommand('Playlist.GetItems', params),
					function(response){ 
						var items = response.result.items;
						xbmcapi.debug(items); 
						xbmcapi.playlist = items;
						success_callback(items); 
						}
					);
				
	},
	
	playPlaylistPosition: function(position, success_callback ){
		//console.log(position);
		var params = {};
		params.item = '{"playlistid": 0, "position" : ' + position + ' }';
		xbmcapi.sendCommand(											
				xbmcapi.buildCommand('Player.Open', params),
				function(response){
					//song started
					if(success_callback) { success_callback( response ); };
				}
		);
		
	},
	
	/**
	 * Add a list of files 
	 * bit tricky as order is important
	 * 
	 * @param i 
	 *	what item in the queue we are adding
	 * @param queue 
	 *  array of filenames
	 * @param success_callback 
	 *  called when done
	 * @param play
	 *  if set to "play" will play from position 0
	 */
	playlistAddFiles: function(i, queue, play ){
		
		var params = {"playlistid": 0, "item" :  '{"file": ' + queue[i] + '}'  };
		xbmcapi.sendCommand(											
				xbmcapi.buildCommand('Playlist.Add', params),
				function(response){
					var next = i + 1;
					if(queue[next] != undefined){ xbmcapi.playlistAddFiles(next, queue, play); }
					else {
						if(play == 'play') { xbmcapi.playPlaylistPosition(0, function(){ } ); };
					}
				}
		);
		
	},
	
	/**
	 * Add a list of songids
	 * 
	 * @param i 
	 *	what item in the queue we are adding
	 * @param queue 
	 *  array of filenames
	 * @param success_callback 
	 *  called when done
	 * @param play
	 *  if set to "play" will play from position 0
	 */
	playlistAddSongs: function(i, queue, play ){
		console.log(queue, queue[i]);
		var params = {"playlistid": 0, "item" :  '{"songid": ' + queue[i] + '}'  }; 
		xbmcapi.sendCommand(											
				xbmcapi.buildCommand('Playlist.Add', params),
				function(response){
					var next = i + 1;
					if(queue[next] != undefined){ xbmcapi.playlistAddSongs(next, queue, play); }
					else {

						if(play == 'play') { xbmcapi.playPlaylistPosition(0, function(){ } ); };
					}
				}
		);
		
	},	
	
	
	/**
	 * Add a list of mixed items
	 * 
	 * @param i 
	 *	what item in the queue we are adding
	 * @param queue 
	 *  array of filenames
	 * @param success_callback 
	 *  called when done
	 * @param play
	 *  if set to "play" will play from position 0
	 * 
	 */	
	playlistAddMixed: function(i, queue, success_callback){
		
		//invalid file added? move to next
		if(queue[i] == undefined || (queue[i].file == undefined && queue[i].songid == undefined)){
			var next = i + 1;
			if(queue[next] != undefined){ xbmcapi.playlistAddMixed(next, queue, success_callback); }
			else {
				if(success_callback != undefined){
					success_callback();
				}
			}
			return;
		}
		
		var add;
		if(parseInt(queue[i].songid) > 0){
			add = '"songid" : ' + queue[i].songid;
		} else {
			add = '"file" : "' + queue[i].file + '"';
		}
		
		var params = {"playlistid": 0, "item" :  '{' + add + '}'  }; 
		xbmcapi.sendCommand(											
				xbmcapi.buildCommand('Playlist.Add', params),
				function(response){
					var next = i + 1;
					if(queue[next] != undefined){ xbmcapi.playlistAddMixed(next, queue, success_callback); }
					else {
						if(success_callback != undefined){
							success_callback();
						}
					}
				}
		);		
		
	},
	
	
	playlistRemoveItem: function(position, success_callback){

		var params = {"playlistid": 0, "position" :  position   }; 
		xbmcapi.sendCommand(											
				xbmcapi.buildCommand('Playlist.Remove', params),
				function(response){

						if(success_callback != undefined){
							success_callback();
						}
					
				}
		);		
	},
	
	
	playlistClear: function( success_callback ){
		
		var params = {"playlistid": 0  };
		xbmcapi.sendCommand(											
				xbmcapi.buildCommand('Playlist.Clear', params),
				function(response){
					if(success_callback) { success_callback( response ); }
				}
		);
		
	},
	
	
	
	
	/********************************************************************************************
	 * Music
	 ********************************************************************************************/

	/**
	 * Play a song by first adding related to the playlist 
	 * and then selecting the position in the playlist to play
	 * 
	 * @param object playParams
	 *  object containing play information
	 *  {
	 *		position: 0,
	 *		fieldName: "artistid",
	 *		fieldValue: 356,
	 *		playlistAction: "add",
	 *		play: true
	 *	}
	 * fieldName
	 *  name of the field to filter add by. eg. albumid, aritstid
	 * fieldValue
	 *  value of fieldName
	 * playlistAction
	 *  "replace" or "add" to playlist 
	 * play
	 *  play song (or just add to queue) 
	 *  
	 * @param function success_callback
	 *  execute on success
	 *  
	 */
	playMusic: function(playParams, playsuccess_callback){

		//music playlist? I think this is how this works? @todo: confirm
		var params = {'playlistid' : 0 };	
		
		//clear or add
		var firstCommand = 'Playlist.Clear';		
		if(playParams.playlistAction == 'add'){
			firstCommand = 'Playlist.GetItems'; // so we can get a count/offest
		}
		
		//first clear playlist or just get a count
		xbmcapi.sendCommand(
				xbmcapi.buildCommand(firstCommand, params), 
				function(response){			
					var addparams = params;
					addparams.item = '{"' + playParams.fieldName + '" : ' + playParams.fieldValue + '}';
					if(playParams.playlistAction == 'add' && response.result.items != undefined){
						position = response.result.items.length + playParams.position; //adjust the 
					}
					//add the new items to the playlist
					xbmcapi.sendCommand(
							xbmcapi.buildCommand('Playlist.Add', addparams),
							function(response){
								//if do we want to play what we just added or return here
								if(playParams.play != true){
									if(success_callback != undefined) { success_callback( response ); };
									return;
								}
								//play it then...
								var params = {};
								params.item = '{"playlistid": 0, "position" : ' + playParams.position + ' }';
								xbmcapi.sendCommand(											
										xbmcapi.buildCommand('Player.Open', params),
										function(response){
											//song started
											if(success_callback != undefined) { success_callback( response ); }
										}
								);										
							}
					);										
				}
			);	
	
	},
	
	
	
	/* get all genres */
	getMusicGenres: function( success_callback ){
		
		if(xbmcapi.allmusicgenres.length > 0){ //cache
			return success_callback(xbmcapi.allmusicgenres);
		}		
		
		var paramItems = { 'limits' : '{"start": 0, "end": ' + xbmcapi.maxItems + '}' }; 

		xbmcapi.sendCommand(
			xbmcapi.buildCommand('AudioLibrary.GetGenres', paramItems),
			function(response){
				
				if(response != undefined && response.result){
					var result = response.result.genres;
					xbmcapi.allmusicgenres = result;
					if(success_callback) { success_callback( result );	}
				}
			}
		);
						
	},	
	
	
	/* get all artists */
	getArtists: function( success_callback, params ){
		
		if(xbmcapi.allartists.length > 0){ //cache
			return success_callback(xbmcapi.allartists);
		}
		
		var paramItems = { 'limits' : '{"start": 0, "end": ' + xbmcapi.maxItems + '}' }; 
		
		//set gender?
		if(params != undefined && params.genreid != undefined){
			paramItems.genreid = params.genreid;
		}
				
		xbmcapi.sendCommand(
			xbmcapi.buildCommand('AudioLibrary.GetArtists', paramItems),
			function(response){				
				if(response != undefined && response.result){
					var result = response.result.artists;
					
					//add albums (and songs) to the artist list - enrich!
					for(var i in result){
						var artist = result[i];
						//this calls a big foreach, but it is faster than a xbmc call
						//@TODO: work out how to deal with js arrays better
						artist.items = xbmcapi.getArtistAlbums(artist.artistid); 
						result[i] = artist;
					}					
										
					xbmcapi.allartists = result;
					if(success_callback) { success_callback(result);	}
				}
			}
		);
						
	},
	
	getArtistAlbums: function (id){
		var out = []; 
		for(var i in xbmcapi.parsedsongs){
			var album = xbmcapi.parsedsongs[i];	
			if(id == album.artistid){
				out.push(album);
			}
		}	
		
		return out;
	},
	
	
	/* get all albums */
	getAlbums: function( success_callback, params ){

		if(xbmcapi.allalbums.length > 0){ //cache
			return success_callback(xbmcapi.allalbums);
		}
		
		var paramItems = { 'limits' : '{"start": 0, "end": ' + xbmcapi.maxItems + '}' };
		
		//set artist?
		if(params != undefined && params.artistid != undefined){
			paramItems.artistid = params.artistid;
		}
		
		xbmcapi.sendCommand(
			xbmcapi.buildCommand('AudioLibrary.GetAlbums', paramItems),
			function(response){				
				if(response != undefined && response.result){
					var result = response.result.albums;
					xbmcapi.allartists = result;
					success_callback(result);	
				}
			}
		);
						
	},	
	

	/* get all songs */
	getSongs: function( success_callback, params ){
		
		if(xbmcapi.allsongs.length > 0){ //cache
			return success_callback(xbmcapi.allsongs);
		}
		
		var paramItems = { 'properties' : '["title", "artist", "artistid", "album", "albumid", "genre", "track", "duration", "year", "rating", "playcount", "albumartist", "file", "thumbnail"]'};
				
		//set artist?
		if(params != undefined && params.artistid != undefined){
			paramItems.artistid = params.artistid;
		}
		
		//set album?
		if(params != undefined && params.albumid != undefined){
			paramItems.albumid = params.albumid;
		}
		
		xbmcapi.sendCommand(
			xbmcapi.buildCommand('AudioLibrary.GetSongs', paramItems),
			function(response){				
				if(response != undefined && response.result){
					var result = response.result.songs;
					xbmcapi.allsongs = result;
					success_callback(result);	
				}
			}
		);
						
	},	
	
	
	getSongByFile: function(path){
	
		if(path == undefined || path == ''){
			return;
		}
		
		var song = xbmcapi.songByFile[ path ];
		//no inital match, try alt
		if(song == undefined){
			song = xbmcapi.songByFileAlt[ path ]; //alternate dictionary due to inconsistant filename urls
		}
		//no library match, we must return something
		if(song == undefined){ 
			var name = path.split('/').pop(); //filename is label
			song = {'file' : path, 'label' : name }; 
		}
		return song;
		
	},
	

	/**
	 * Artists and Albums are retrieved via hashes
	 */
	getArtist: function(id){
		var p = {'artistid' : id};
		return xbmcapi.allartistsObj[xbmcapi.hashAritst(p)];		
	},
	getAlbum: function(id){
		var p = {'albumid' : id};
		return xbmcapi.albumsObj[xbmcapi.hashAlbum(p)];		
	},
	getSong: function(id){
		var key = 'song' + id;
		return xbmcapi.songById[ key ];		
	},	
	
	
	
	
	
	/*********************************************************************************************
	 * Parsers
	 ********************************************************************************************/
	
	
	
	/* merges songs into albums and makes search index 
	 * should only run once
	 */ 
	parseMusic: function( success_callback ){
		
		//get data
		var allsongs = xbmcapi.allsongs;		
		var loadedAlbumList = xbmcapi.parseSongSet(allsongs);
		var parsedArtists = xbmcapi.parseAlbumSet(loadedAlbumList);

		//console.log(allsongs,loadedAlbumList, parsedArtists);
		
		//cache all those mofos!
		xbmcapi.parsedartists = parsedArtists.artists;
		//xbmcapi.playlist = parsedArtists.playlist;		
		xbmcapi.parsedsongs = parsedArtists.albums;
		
		parsedArtists.genres.sort(function(a,b){ return xbmcapi.aphabeticalSort(a.label, b.label);	});
		xbmcapi.allmusicgenres = parsedArtists.genres;
		
		//these objects can be referenced by id
		//eg  xbmcapi.allartistsObj.artist56 or xbmcapi.albumsObj.album884
		xbmcapi.allartistsObj = parsedArtists.artistsObj;
		xbmcapi.albumsObj = parsedArtists.albumsObj;
		
		//this line skips the artist query, which is slower than the song query?
		xbmcapi.allartists = xbmcapi.parsedartists;
		
		//do something
		success_callback(parsedArtists.albums);
	},		
	
	
	
	
	
	/* parse songs into albums */
	parseSongSet: function(allsongs){
						
		var loadedAlbumList = [];	
		
		for(var i in allsongs){
			var song = allsongs[i];
			//make an entry for the album
			var albumid = song.albumid;
			if(albumid == ''){ albumid = 0 ; }
			
			//make alterations to songs
			
			
			//make new album obj if not exist
			if(loadedAlbumList[albumid] == undefined){				
				loadedAlbumList[albumid] = {
						label: 	(song.album == '' ? 'untitled' : song.album),
						albumid: song.albumid,
					    thumbnail: song.thumbnail,
						artist: song.artist,
						artistid: song.artistid,
						year: song.year,
						items: []
				};				
			}
			if(song != undefined && loadedAlbumList[albumid] != undefined){
				loadedAlbumList[albumid].items.push(song);		
			}		
			
			//sort genres
			if(song.genre == ''){ song.genre = 'No Genre'; }
			if(xbmcapi.songByGenre[ song.genre ] == undefined){
				xbmcapi.songByGenre[ song.genre ] = {
					label: song.genre,
					items: []
				};
			}
			if(song != undefined && xbmcapi.songByGenre[song.genre] != undefined){
				xbmcapi.songByGenre[song.genre].items.push(song);		
			}				
			
			
			//a very handy dictionary for song files (lookup by filename/id)
			var key = 'song' + song.songid;
			xbmcapi.songByFile[ song.file ] = song;
			xbmcapi.songByFileAlt[ xbmcapi.uniformPath(song.file) ] = song;
			xbmcapi.songById[ key ] = song;
		}

		
		
		//return results
		return loadedAlbumList;
		
	},

	
	
	/* parse songs into albums */
	parseAlbumSet: function(loadedAlbumList){
		
		var artistsObj = {};
		var playlist = [];
		var albums = [];
		var albumsObj = {};
		var artists = [];
		var playlistpos = 0;		
				
		// we now want to sort
		for(var i in loadedAlbumList){
			var album = loadedAlbumList[i];
			var items = album.items;
			
			//sort
			items.sort(function(a,b){ 
				return a.track - b.track; 
			});
			
			//playlist / song loop
			for(var s in items){
				playlist.push( items[s] );
				items[s].playlistpos = playlistpos;
				playlistpos++;
			}
			 		
			//artists list
			
			if(artistsObj[xbmcapi.hashAritst(album)] == undefined){
				artistsObj[xbmcapi.hashAritst(album)] = {
					'items' : [],
					'label' : album.artist,
					'artistid' : album.artistid,
					'thumbnail' : album.thumbnail,
					'artist' : album.artist
				};
			}
			artistsObj[xbmcapi.hashAritst(album)].items.push(album);
						
			//back into master
			loadedAlbumList[i].items = items;	
			
			//further parsing and hashing/indexing
			albumsObj[ xbmcapi.hashAlbum( album ) ] = loadedAlbumList[i];
			albums.push(loadedAlbumList[i]);
		}
		
		//for sort
		for(var i in artistsObj){
			artists.push(artistsObj[i]);
		}
		
		//sort
		artists.sort(function(a, b){			
			return xbmcapi.aphabeticalSort(a.label, b.label);			
		});
		
		albums.sort(function(a,b){
			return xbmcapi.aphabeticalSort(a.label, b.label);
		});
		
		//genre sort
		for(var g in xbmcapi.songByGenre){			
			xbmcapi.songByGenre[g].albums = xbmcapi.parseGenericSongSet(xbmcapi.songByGenre[g].items); //turn songs into album sets
		}
		
		//return results
		var allresults = {
				'artists':  artists,
				'albums' : albums,
				'playlist' : playlist,
				'artistsObj' : artistsObj,
				'albumsObj' : albumsObj,
				'genres' : xbmcapi.objToArray(xbmcapi.songByGenre) 
			};
		
		localStorage.setItem('allmusic', 'booo');
		
		return allresults;		
		
	},	
	
	
	/** 
	 * Return Songs with album info 
	 * order is important as the songs are in the playlist so we may have dupes in the playlist
	 * */	
	parsePlaylistSongSet: function(songs){
		
		var loadedAlbumList = [];		
		var last = 0, last_c = 0, c = 0;
		
		for(var i in songs){
			var song = songs[i];
			if(song == undefined){ continue; }
			//make an entry for the album
			var albumid = song.albumid;
			if(albumid == ''){ albumid = 0 ; }
			
			//make alterations to songs
			
			
			//make new album obj if not exist
			if(last != song.albumid){				
				loadedAlbumList[c] = {
						label: 	(song.album == '' ? 'untitled' : song.album),
						albumid: song.albumid,
						thumbnail: song.thumbnail,
						artist: song.artist,
						artistid: song.artistid,
						items: []
				};	
				last_c = c;
			} else {
				c = last_c;
			}
			if(song != undefined && loadedAlbumList[c] != undefined){
				loadedAlbumList[c].items.push(song);		
			}		
			
			last = song.albumid;
			c++;
		}

		
		
		//return results
		return loadedAlbumList;		
		
	},	
	
	
	
	/** 
	 * Return Songs with album info 
	 * order not important, grouping by album is takes preference
	 * more lightweight than playlist parse 
	 * */	
	parseGenericSongSet: function(songs){
		
		var loadedAlbumList = {};		
		
		for(var i in songs){
			var song = songs[i];
			if(song == undefined){ continue; }
			
			//make an entry for the album
			var albumid = song.albumid;
			if(albumid == ''){ albumid = 0 ; }
			
			var albumHash = xbmcapi.hashAlbum(song);
			
			//make alterations to songs
			if(loadedAlbumList[ albumHash ] == undefined){
				loadedAlbumList[ albumHash ] = {
						label: 	(song.album == '' ? 'untitled' : song.album),
						albumid: song.albumid,
						thumbnail: song.thumbnail,
						artist: song.artist,
						artistid: song.artistid,
						items: []			
				};
			}
			
			if(song != undefined && loadedAlbumList[ albumHash ] != undefined){
				loadedAlbumList[ albumHash ].items.push(song);		
			}		
		}		
				
		var albums = xbmcapi.objToArray(loadedAlbumList);
		
		//return results
		return albums;				
	},		
	
	
	
	
	/*********************************************************************************************
	 * Files
	 ********************************************************************************************/		
	
	
	getFileSources: function(type, success_callback){
		
		var params = {'media' : '"' + type + '"'};
		
		xbmcapi.sendCommand(
				xbmcapi.buildCommand('Files.GetSources', params),
				function(response){				
					if(response != undefined && response.result){
						var result = response.result;
						xbmcapi.sourcefolders = result.sources;
						success_callback(result);	
					}
				}
			);		
		
	},
	
		
	getDirectory: function(path, success_callback){
		
		var params = {'directory' : '"' + path + '"'};
		
		xbmcapi.sendCommand(
				xbmcapi.buildCommand('Files.GetDirectory', params),
				function(response){				
					if(response != undefined && response.result){
						var result = response.result;
						success_callback(result);	
					}
				}
			);		
		
	},	
	
	
	
	
	
	prepareDownload: function(path, success_callback, item){
		
		var params = {'path' : '"' + path + '"'};
		
		xbmcapi.sendCommand(
				xbmcapi.buildCommand('Files.PrepareDownload', params),
				function(response){			
					if(success_callback != undefined ){
						var result = response.result.details.path;
						success_callback(result, item);	
					}
				}
			);			
		
	},
	
	
	
	
	
	
	
	

	/*********************************************************************************************
	 * Generic Helpers used by this api
	 ********************************************************************************************/
	
	//uniform paths 
	uniformPath: function(path){
		//remove user/pass- this can be replaced with regex (removes credentials in the url)	
		var t = path.split('@');
		var m = t[0].split('://');
		var newurl = m[0] +  '://' + t[1]; //join back together

		return newurl;
	},
	
	objToArray: function(obj){
		var items = [];
		for(var i in obj){
			items.push(obj[i]);
		}
		return items;
	},
		
	
	/* Alphabetical sort callback */
	aphabeticalSort: function(a,b){
		var nameA=a.toLowerCase(), nameB=b.toLowerCase();
		if (nameA < nameB){ //sort string ascending
		  return -1;
		}
		if (nameA > nameB){
		  return 1;
		}
		return 0; //default return value (no sorting)
	},
	
	/*	hashArtist */
	hashAritst: function(obj){		
		return 'artist' + obj.artistid; 
	},
	/*	hashAlbum */
	hashAlbum: function(obj){		
		return 'album' + obj.albumid; 
	},	
	
	

	
	/* build a json rpc command using the method and an array of params */
	buildCommand: function(method, params){
					
		var paramStr = '';
		
		var i = 1; 
		paramStr  += ', "params": {';
		for(var param in params){
			var value = params[param];
			if(i != 1){ paramStr += ', '; }
			paramStr += '"' + param + '": ' + value;				
			i++;
		}
		paramStr += '}'; 
		
		var command = '{"jsonrpc": "2.0", "method": "' + method + '"'; 
		if(i > 1){ command += paramStr; }
		command += ', "id": 1}';			
		
		xbmcapi.debug(command);
		return command;
		
	},
	
		
	/* failed response */
	failedSendCommand: function(command, response){		
		console.log(response);
		console.log('Error calling: ' + command + ' - Error Response Message: ' + response.error.message);		
	},

	/* debug */
	debug: function(obj){
		if(xbmcapi.debugState == true){
			console.log(obj);
		}		
	}
		
};
