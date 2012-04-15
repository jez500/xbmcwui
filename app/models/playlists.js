
/*
 * Handles user generated playlists with local browser storage (jstorage)  
 *  all data that is saved gets slimed down a bit (eg. property names)
 */ 


var playlists = {
	
	
	activePlaylists: [],
	activePlid: 0,
	xbmcNextPlay: 0,
		
	/*
	 * n = name
	 * l = locked
	 * i = array of items
	 */	
	defaultPlaylists: [
	                   	{id: 0, n: 'XBMC Playlist', i: [] }, 
	                   	{id: 1, n: 'Browser Playlist', i: []}
	],	
		
	
	//load in playlists (or defaults)
	initPlaylist: function(){
		
		//add new pl
		$('.new-playlist .icon-plus-sign').live('click', playlists.addPlaylist); //button press
		$('#newplaylist').keypress(function(e) {  if(e.which == 13) { playlists.addPlaylist(); } }); //enter press
		
		//toggle add
		$('.pl-new-toggle').click(function(){
			$('.new-playlist').toggle();
			$(this).toggleClass('icon-plus-sign').toggleClass('icon-minus-sign');
		});
		$('.new-playlist').hide();
		
		$('.playlist-link').live('click', function(e){
			e.preventDefault();		
			if($(this).attr('id') == 'pl-0'){
				//xbmc playlist
				browserplayer.setPlayer('xbmc');
				xbmcmusic.getPlayingPage();
			} else {
				//local playlist
				browserplayer.setPlayer('browser');
				playlists.getPlaylistPage( $(this).attr('data-id') );
			}
			
			
		});
		
		//play in browser
		$('.custom-playlist-list .tracks li').live('dblclick', function(e){ 	
			e.preventDefault();			 
			var p = $(this);			
			var plid = p.closest('.custom-playlist').attr('data-id');			
			browserplayer.playInBrowser(plid, p.attr('data-position'));
			browserplayer.setPlayer('browser');
			mainapp.notify('start', 'Playling in browser', 1);
		});	
		
		//remove item from playlist
		$('.custom-playlist li.song .op-playlist-remove-item').live('click', function(){ 
			var pos = $(this).parent().parent().attr('data-position'); 
			playlists.removePlaylistItem( pos , playlists.activePlid); 
			$(this).remove();
			templates.positionNumbers('.custom-playlist li.song');
			mainapp.notify('start', 'Removed item from playlist', 1);
		});
		
		
			
		  //bind button click actions
		  $('.playlist-buttons a').live('click', function(e){
			  e.preventDefault();
			  
			  var o = $(this), p = o.parent().parent();
			  var task = o.attr('data-task');
			  var plid = p.attr('data-plid');

			  var pl = playlists.getPlaylist(plid);	
			  
				  
			  if(task == 'op-pl-add-xbmc'){
				  playlists.addItemToPlaylist(0, 'playlist', plid);
				  mainapp.notify('start', 'Music from "' + pl.n + '" added to the XBMC playlist', 1);
			  }
			  if(task == 'op-pl-play-xbmc'){
				  xbmcapi.playlistClear(function(r){
					  console.log('clear', r);
					  playlists.addItemToPlaylist(0, 'playlist', plid);
					  setTimeout(function(){
						  xbmcapi.playPlaylistPosition(0, function(){ browserplayer.setPlayer('xbmc'); xbmcmusic.getPlayingPage(); } ); //kick off playing in 1 sec
					  }, 1000);
				  });
				  mainapp.notify('start', 'XBMC playlist updated, Music started', 1);
			  }
			  if(task == 'op-pl-play-browser'){
				  browserplayer.playInBrowser(plid, 0);
				  mainapp.notify('start', 'Now playing "' + pl.n + '" in browser', 1);
			  }
			  if(task == 'op-pl-export'){
				  playlists.exportPlaylist(plid);
			  }		
			  if(task == 'op-pl-remove'){
				  if(confirm("Are you sure?")){
					  playlists.removePlaylist(plid);
					  browserplayer.setPlayer('xbmc'); 
					  xbmcmusic.getPlayingPage(); 
					  mainapp.notify('start', 'Playlist "' + pl.n + '" Removed', 1);
				  }				  
			  }
			  if(task == 'op-pl-rename'){
					var newname = prompt('Enter a new name', pl.n);
					playlists.renamePlaylistItem(plid, newname);
					playlists.getPlaylistPage(plid);
					mainapp.notify('start', 'Playlist renamed to "' + newname + '"', 1);
			  }	
			  if(task == 'op-pl-clear'){
					playlists.clearPlaylist(plid);
					playlists.getPlaylistPage(plid);
					mainapp.notify('start', 'Playlist "' + pl.n + '" cleared', 1);
			  }				  
		  });
		
		
		  $('.custom-playlist ul.songs:not(.ui-sortable)').live('mouseover', function(){
				//sortable
				$(this).sortable({
					'axis': 'y',
					'delay': 0,
					'handle' : '.reorder-handle',
					'update' : function(e, p){ 
						playlists.reorderPlaylist(e, p);  
					},
					'connectWith' : ".custom-playlist ul.songs"
				});				  
		  });
		  

		  
		  //to keep all the drag binds up to date we need to do some workarounds
		  //when drag a dragable rebind drop targets that have not been defined
		  $('.ui-draggable').live('mousemove', function(){  
			  
			//add droppable
			$('#myplaylists li a:not(.ui-droppable)').droppable({
				activeClass: "dropper-inbound",
				hoverClass: "dropper-over",
				accept: ".protector, .covers, .cover",
				drop: function( event, ui ) {
					console.log(event, ui);
					var plid = $(this).attr('data-id');
					$(ui.draggable).each(function(i,o){
						var ob = $(o);
						playlists.addItemToPlaylist(plid, ob.attr('data-type'), ob.attr('data-id'));
					});
					$(this).effect('highlight');
					playlists.getPlaylists();	
				}
			});	
			
		  });
		
		
		//get storage
		playlists.activePlaylists = $.jStorage.get('playlists', []);
		
		//defaults if req
		if( playlists.activePlaylists.length == 0 ){
			playlists.activePlaylists = playlists.defaultPlaylists;
			playlists.activePlaylists[1].id = playlists.hashCode(playlists.activePlaylists[1].n);
		}
		
		playlists.getPlaylists();
		

		
	},
	
	//put the playlists in the dom
	getPlaylists: function(){
		
		//save any changes to storage
		$.jStorage.set('playlists', playlists.activePlaylists);
		
		//remove existing list
		$('.playlist-link').remove(); 
		
		//build playlists list
		$(playlists.activePlaylists).each(function(i,o){
									
			if(o.id != undefined && o.n.length > 1 ){
				$('#myplaylists').append('<li><a class="playlist-link" id="pl-' + o.id + '" data-id="' + o.id + '">' + 
						'<i class="icon-' + (o.id == 0 ? 'play' : 'chevron-right' ) + '"></i>' + (o.id == 0 ? '<i class="icon-pause"></i>' : '' ) + 
						'<span class="t">' + o.n + '</span></li>');					
			} else {
				//find out the cause!
			}
		
		});
		
	},
	
	
	//playlist dialog
	addMusicToPlaylistDialog: function( type, id, play ){
		
		var menu = {
			classes: 'select-playlist',
			items: []
		};
		$(playlists.activePlaylists).each(function(i,o){
			menu.items.push({ classes: "option", data: { task: "select", 'plid': o.id }, title:  o.n  });
		});
		var content = templates.makeDialogMenu(menu);
		mainapp.dialog(content, {title: 'Select a playlist'});
		
		//update playlist
		xbmcapi.getCurrentPlaylist( nowplaying.update );
		
		//click bind
		$('#dialog .select-playlist a').click(function(e,o){
			e.preventDefault();				
			
			var plid = $(this).attr('data-plid');
			var pl = playlists.getPlaylist(plid);
			mainapp.dialogClose();
			
			var xbmcpl = xbmcapi.playlist;
			
			
			
						
		    //add the type to the playlist
			playlists.addItemToPlaylist(plid, type, id);
			console.log(xbmcpl);
			//play should be a filename if it matches, play
			if(play != undefined && play != ''){
				var pos = 0;
				if(play == 'first'){
					pos = pl.i.length;  //plays the first of the new songs added
					if(plid == 0){ if(xbmcpl == undefined){pos = 0;} else {pos = xbmcpl.length;}  } //play first added in xbmc					
				} else {
					//otherwise, get posistion from filename, last match found
					$(pl.i).each(function(i,o){ 
						if(o.file == play){ 
							pos = i;
						}
					});					
				}
				console.log(pos);								
				//Play...
				//XBMC - it takes a while to add to pl as we do 1 song at a time, so we add this delay @TODO: find a better solution
				if(plid == 0){ 
					playlists.xbmcNextPlay = pos;
					setTimeout(function(){								
						xbmcapi.playPlaylistPosition(playlists.xbmcNextPlay, nowplaying.update);
						mainapp.notify('start', 'Now Playling in XBMC', 1);	
					}, 3000);
				} else { 
					//BROWSER
					browserplayer.playInBrowser(plid, pos);
					browserplayer.setPlayer('browser');
					mainapp.notify('start', 'Playling in browser', 1);							
				}
				return;							
			}
			
			
		});
	},
	
	
	
	reorderPlaylist: function(e, p){

		var newpl = [];
		var pl = playlists.getPlaylist( playlists.activePlid );
		$('.custom-playlist ul.songs li.song').each(function(i,o){
			newpl.push({ 'file' : $(o).attr('data-file') });
		});

		$(playlists.activePlaylists).each(function(i,o){
			if(o.id == playlists.activePlid){
				playlists.activePlaylists[i].i = newpl; //set new playlist
			}
		});		
		
		//save to storage
		$.jStorage.set('playlists', playlists.activePlaylists);
		
		//reset order attr
		templates.positionNumbers('.custom-playlist .tracks li.song');
		
		mainapp.notify('start', 'Playlist order updated', 1);
		
	},
	
	addPlaylist: function(){		
		var val = $('#newplaylist').val();		
		if(val.length < 2){
			alert('Name not long enough');
		} else {
			var e = 0;
			$(playlists.activePlaylists).each(function(i,o){
				if(o.name == val){ 	e = 1;	}
			});
			if(e == 1){
				alert('Name exists');
			} else {
				//ok to save/update
				var pl = {id: playlists.hashCode(val), n: val, i: []};			
				playlists.activePlaylists.push(pl);	//add the new playlist to activeplaylists								
				playlists.getPlaylists(); //save and reload playlists
				$('.pl-new-toggle').trigger('click'); //hide input
				$('#newplaylist').val(''); //clear contents			
				mainapp.notify('start', 'Playlist added', 1);
			}
		}
	},
	
	removePlaylist: function(id){
		var newplaylist = [];
		$(playlists.activePlaylists).each(function(i,o){
			if(o.id != id){
				newplaylist.push(o);
			}
		});
		playlists.activePlaylists = newplaylist;
		playlists.getPlaylists(); //save and reload playlists
	},
	
	
	renamePlaylistItem: function(id, name){
		var newplaylist = [];
		$(playlists.activePlaylists).each(function(i,o){
			if(o.id == id){
				o.n = name;				
			}
			newplaylist.push(o);
		});
		playlists.activePlaylists = newplaylist;
		playlists.getPlaylists(); //save and reload playlists
	},
	
	
	/*
	 * Drop callback, add items to the playlist 
	 */
	addItemToPlaylist: function(plid, type, id){
		//console.log(plid, type, id);
		var msgType = 'Music'; //default
		var msgPlName = 'Untitled'; //default		
		
		var newplaylist = [], newplaylistitems = [];
		$(playlists.activePlaylists).each(function(i,o){
			if(o.id == plid){
				
				if(plid != 0){
					newplaylistitems = o.i; //start off with existing playlist if not xbmc
				}
				
				msgPlName = o.n; //default
				
				//add to a playlist FROM a playlist, wowzers!
				if(type == 'playlist'){
					var clonePl = playlists.getPlaylist(id);
					$(clonePl.i).each(function(i,s){
						newplaylistitems.push({'file': s.file});	//add item to playlist	
					});	
					msgType = 'Playlist songs';
				}
				
				//add an entire genre
				if(type == 'genre'){
					var thisgenre = xbmcapi.songByGenre[ id ]; //get songs from genre
					$(thisgenre.items).each(function(i,s){
						newplaylistitems.push({'file': s.file});	//add item to playlist	
					});		
					msgType = 'Genre';
				}					
				
				//add to local playlist
				if(type == 'albumid'){
					var thisalbum = xbmcapi.getAlbum(id); //get songs from album
					$(thisalbum.items).each(function(i,s){
						newplaylistitems.push({'file': s.file});	//add item to playlist	
					});	
					msgType = 'Album';
				}	
				if(type == 'artistid'){
					var thisalbum = xbmcapi.getArtist(id); //get songs from album
					$(thisalbum.items).each(function(i,a){
						$(a.items).each(function(i,s){
							newplaylistitems.push({'file': s.file});	//add item to playlist	
						});	
					});		
					msgType = 'Artist';
				}	
				if(type == 'file'){
					var inc = 0;	
					//add selected files
					var selected = playlists.getSelectedSongs();					
					$(selected).each(function(i,s){					 
						newplaylistitems.push({'file' : s.file});
						if(s.file == id){	inc = 1;	} //dragged file is included in selection
					});
					if(inc == 0){ //inc in selection
						newplaylistitems.push({'file': id});	//add dragged item to playlist	
					}	
					$('#content-target li.selected').removeClass('selected');
					xbmcmusic.selectedItems('library');	
					msgType = 'Songs';
				}				
				//add song to playlist
				if(type == 'songid'){
					var s = xbmcapi.getSong(id); 
					newplaylistitems.push({'file': s.file});
					msgType = 'Song';
				}	
				
				o.i = newplaylistitems;

				if(plid == 0){
					//also add to xbmc
					xbmcapi.playlistAddMixed(0, newplaylistitems, function(){  });
				} 
			}
			newplaylist.push(o);
		});		
		playlists.activePlaylists = newplaylist;
		console.log(newplaylist);
		
		mainapp.notify('start', msgType + ' added to playlist: ' + msgPlName, 1);
	},
	
	
	
	//returns al the li's with the selected class as an array of songs
	getSelectedSongs: function(){
		var song, selected = [];
		$('#content-target li.selected').each(function(i,s){
			if($(s).attr('data-songid') != undefined){ //in library
				song = xbmcapi.getSong($(s).attr('data-songid'));
			} else { //not in library
				song = {'file': $(s).attr('data-file')};
			}
			selected.push(song);
		});
		return selected;
	},
	
	
	getPlaylistPage: function(id){
		
		var list = [];
		
		//load playlist
		var pl = playlists.getPlaylist(id);
		if(pl.id == undefined){
			return;
		}
		
		//total time
		var tottime = 0;
		$(pl.i).each(function(i,o){ 
			var song = xbmcapi.getSongByFile( o.file );			
			if(song != undefined){
				tottime = parseInt(tottime) + parseInt(song.duration); 
			}			
		});		
		
		//top html
		var coolStats = ' <span class="light">' + pl.i.length + ' songs ( ' + templates.secondsToHms(tottime, 'long') + ' )</span>'; 		
		var out = '<div class="custom-playlist" id="plp-' + pl.id + '" data-id="' + pl.id + '">' + 
					'<h3 class="playlist-title">' + pl.n + coolStats + '</h3>' + 
				    playlists.getPlaylistPageMenu(pl.id);
		
		//songs
		$(pl.i).each(function(i,o){
			var song = xbmcapi.getSongByFile( o.file );
			list.push(song);
		});
	
		items = xbmcapi.parsePlaylistSongSet(list);
	
		out += templates.albumList(items, 0, 'custom-playlist');
		
		//bottom html
		out += '</div>';
		
		router.buildPage('custom-playlist&id=' + pl.id, out);		
		playlists.activePlid = pl.id; //last viewed playlist		
		$('body').scrollTo( 0 );		
		$('ul.nav li a#pl-' + pl.id).addClass('active');
		
	},
	
	getPlaylistPageMenu: function(plid){
		
		  var structure = {
			   classes: "playlist-buttons",
			   data: { 'plid': plid},
			   items: [
			   	{ classes: "action", data: { task: "op-pl-add-xbmc" }, title: "Add to XBMC playlist" },
			   	{ classes: "action", data: { task: "op-pl-play-xbmc" }, title: "Play in XBMC" },  
			   	{ classes: "action", data: { task: "op-pl-play-browser" }, title: "Play in Browser" },  
			   	{ classes: "action", data: { task: "op-pl-export" }, title: "Export" },
			   	{ classes: "action", data: { task: "op-pl-rename" }, title: "Rename" },
			   	{ classes: "action", data: { task: "op-pl-clear" }, title: "Clear" },
			   	{ classes: "action", data: { task: "op-pl-remove" }, title: "Remove" }
			   ]
		  };
		  
		  return templates.makeButtonMenu(structure);
		
	},
	
	getPlaylist: function(plid){
		
		var active = {};
		$(playlists.activePlaylists).each(function(i,o){			
			if(o.id.toString() == plid.toString()){ active = o;	}
		});		
		if(plid == 0){ //xbmc playlist
			active.i = []; 
			$(xbmcapi.playlist).each(function(i,o){ active.i.push({'file' : o.file }); }); 
		}
		return active;
	},
	
	exportPlaylist: function(plid){
		var pl = playlists.getPlaylist(plid);
		var out = '<h3>Export of "' + pl.n + '"</h3><textarea class="export">' + JSON.stringify(pl) + '</textarea>';
		router.buildPage('op=export&id=' + pl.id, out);
	},
	
	removePlaylistItem: function(pos, plid){
		
		var newplaylists = [], newpli = [];
		$(playlists.activePlaylists).each(function(i,o){			
			//each playlist
			if(plid == o.id){
				$(o.i).each(function(i,s){
					if(i != pos){
						newpli.push(s);
					}
				});
				o.i = newpli; //new playlist with item removed
			}
			newplaylists.push(o);
		});			
		playlists.activePlaylists = newplaylists;
		playlists.getPlaylists();
	},
	
	clearPlaylist: function(plid){
		
		if(plid == 0){ return; } //xbmc playlist, should not be called from here		
		var newplaylists = [];
		$(playlists.activePlaylists).each(function(i,o){
			if(o.id == plid){ o.i = []; }
			newplaylists.push(o);
		});
		playlists.activePlaylists = newplaylists;
		playlists.getPlaylists();
		
	},
	
	
	

	//ability to hash a string
	hashCode: function(string){
	    var hash = 0;
	    if (string.length == 0) return hash;
	    for (i = 0; i < string.length; i++) {
	        char = string.charCodeAt(i);
	        hash = ((hash<<5)-hash)+char;
	        hash = hash & hash; // Convert to 32bit integer
	    }
	    return hash;
	}

		
};

