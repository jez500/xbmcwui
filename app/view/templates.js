

var templates = {
		
	maxPerPage: 50,
	albumsOffset: 20, //how many extra albums get
	lastResultSet: [],
		
		
	/* generic list builder - uses jQuery.template to turn the data into html */	
	genericList: function(items, template){
		var out = '';		
		$(items).each(function(i,item){
			out += $.tmpl(template, item).html(); //assign template to item and and to list ready for render
		});
		return out;
	},
	
	
	
	/* Music Sidebar */
	musicSidebar: function(){		
		//return menus.outputMenu( menus.music );
	},
	
	
	/* search page */
	searchPage: function(){
		return '<div class="search-box-wrapper"><input type="search" id="music-search" data-theme="c" /></div>' + 
		'<div id="search-result"></div>';
	},
	
	
	/* Genres */
	genreList: function(items, page, showLetters){
		

		var items = templates.pager(items, page, 50 ); //get a paged version of the results
		var out = '';
		
		//loop each genre
		$(items).each(function(i,genre){
			
			var cg = {
					'type': 'genre',
					'id': genre.label,
					'items': genre.albums
			};	
			
			out += '<div class="genre-item has-covers" data-type="genre">';
			out += templates.coverGroup(cg);
			out += '<h4>' + genre.label + '</h4>';
			out += '<p>' + genre.items.length + ' songs, ' + genre.albums.length + ' albums</p>';
			out += '</div>';
			
		});
				
		return '<div class="music-list genre-list grouped-covers clearfix">' + out + '</div>';
		
	},	

			
		
	
	
	/********************************************************************************************
	 * Albums
	 ********************************************************************************************/
	
	//std listing (with songs)
	albumList: function(items, page, playlist){
		
		if(playlist == 'album' || playlist == true || playlist == undefined){ playlist = 'library'; }
		
		items = templates.pager(items, page, (playlist == 'playlist' || playlist == 'custom-playlist' ? 300 : 20) ); //get a paged version of the results
		
		var albums = [];
		var out = '';		
		var c = 1;
		
		for(var i in items){
				var album = items[i];
				album.tracks = templates.songList(album.items);
				out += '<div id="album-row-' + album.albumid + '" class="album-row-item">' + templates.albumListTemplate(album) + '</div>';			
			c++;
		}	
		return '<div class="music-list album-list ' + playlist + '-list' + '">' + out + '</div>';
	},	
	
	//gallery listing
	albumGalleryList: function(items, page, showLetters){

		items = templates.pager(items, page, templates.maxPerPage + templates.albumsOffset); //get a paged version of the results
		
		var out = '', firstChar = '', lastFirstChar = '', c = 0;
		
		for(var i in items){
			var album = items[i];
			
			//show the letter header index
			firstChar = album.label.charAt(0).toLowerCase();
			out += templates.firstLetterHeading(firstChar, page, c, lastFirstChar, showLetters);
			
			out += templates.albumItemTemplate(album);	
			lastFirstChar = firstChar;
			c++;
		}	
		return '<div class="music-list album-gallery-list clearfix">' + out + '</div>';
	},		
	
	albumListTemplate: function(album){
		return '<div><div class="album-row clearfix" id="album-row-' + album.albumid + '">' + 
					'<div class="album-header">' + 
						templates.albumItemTemplate(album) +  
					'</div>' + 
					'<div class="tracks">' + album.tracks + '</div>' + 
			  '</div></div>';
	},
		
	albumItemTemplate: function(album){
		return '<div class="album-item" data-artistid="' + album.artistid + '" data-albumid="' + album.albumid + '">' + 
					'<div class="wui-icon-set-play action-queue-play" data-playtype="albumid" title="Queue and Play"></div>' + 
						//'<div class="magic-box"></div>' + 
						'<div class="cover" data-type="albumid" data-id="' + album.albumid + '">' + 						
							'<img src="' +  templates.imagePath(album.thumbnail) + '" class="thumb" />' + 
						'</div>' + 
						'<div class="more-button" data-task="album" data-id="' + album.albumid + '">' + 
							'<h4>' + album.label + '</h4>' + 
							'<p>' + album.artist + '</p>' + 
							'<p class="meta">' + (album.year > 0 ? album.year : '') + '</p>' + 	
							/*
							'<div class="wui-menu-items" data-artistid="' + album.artistid + '" data-albumid="' + album.albumid + '">' + 
								'<div class="item" data-task="play-parent-album-add"><i class="icon-plus-sign"></i> Add Album</div>' + 
								'<div class="item" data-task="play-parent-album"><i class="icon-play"></i> Play Album</div>' + 
								'<div class="item" data-task="view-parent-album"><i class="icon-eye-open"></i> View Songs</div>' + 							
								'<div class="item" data-task="search-query" data-query="' + album.artist + '"><i class="icon-search"></i> ' + album.artist + '</div>' + 
							'</div>' + 
							*/
						'</div>' + 
				'</div>';
	},	
	
	
	
	/********************************************************************************************
	 * Songs
	 ********************************************************************************************/	
	
	/* songs only list  */
	songList: function(items, page){
		
		items = templates.pager(items, page, 500); //get a paged version of the results		
		return '<div class="music-list song-list"><ul class="songs">' + templates.songRowTmpl(items) + '</ul></div>';
		
	},	
	
	songRowTmpl: function(items){ 
		
		var out = '', c = 0;
		for(var i in items){
			var song = items[i], songmenu = '', songid, rowAttr, dragAttr; //vars
			songid = (song.id != undefined ? song.id : song.songid); //make uniform
			if(song.track > 200){ song.track = 0; } //fix track number bug

			//make main row attributes
			rowAttr = {
				'position': c
			};
			//make draggable element attributes
			dragAttr = {
				'type': 'file',
				'id': song.file
			};
						
			//if in lib, add id else add file
			if(songid == undefined){ 
				rowAttr.file = song.file; 
			} else { 
				//load up with meta
				rowAttr.songid = songid;
				rowAttr.albumid = song.albumid;
				rowAttr.artistid = song.artistid;
				//add songid to dragger
				dragAttr.songid = songid; 
				//also add the menu
				songmenu = '<a class="more-button song-more" data-task="song" data-id="' + songid + '"><i class="icon-align-justify"></i></a>';
			}			
						
			//html
			out += '<li class="song clearfix" ' + templates.dataToAttr(rowAttr) + '>' + 
					    '<div class="col col-levels"><div class="levels"><span></span></div></div>' + 
					    '<div class="col col-track"><span class="text">' + (song.track > 0 ? song.track : '&nbsp;') + '</span></div>' + 
					    '<div class="col col-name"><span class="protector" ' + templates.dataToAttr(dragAttr) + '></span><span class="text">' + song.label + '<span></div>' + 
					    '<div class="col col-duration"><span class="text">' + (song.duration > 0 ? templates.secondsToHms( song.duration ) : '&nbsp;')  + '</span></div>' + 
					    '<div class="col col-artist"><span class="text">' + song.artist + '</span></div>' + 
					    '<div class="col fill-item">' + 
					    	(songmenu != '' ? '<div class="playcount" title="play count">' + song.playcount + '</div>' + songmenu : '') +		
							'<a class="reorder-handle"><i class="icon-move"></i></a>' + 
						'</div>' + 
					'</li>';
			c++;
		}		
		return out;
		
	},
				
	

	
	/********************************************************************************************
	 * Artists
	 ********************************************************************************************/	
	
	/* artist page 
	 *  we get nice groupings of albums
	 * */
	artistsList: function(items, page, showLetters){
		
		if(page == undefined || !page){ page = 0; }
		
		//only show artists with albums / songs
		var cleanlist = [];
		for(var i in items){
			if(items[i].items.length > 0){
				cleanlist.push(items[i]);
			}
		}
		
		//filtering needs to be done BEFORE pager
		items = templates.pager(cleanlist, page); //get a paged version of the results
		
		var out = '', albumList = '', firstChar = '', lastFirstChar, c = 0;
				
		//build list
		for(var i in items){			
			var artist = items[i];			
			var ac = 0; 
			
			//covergroup params
			var cg = {
					'type': 'artistid',
					'id': artist.artistid,
					'items': artist.items
			};		
			
			//show the letter header index
			firstChar = artist.label.charAt(0).toLowerCase();
			
			//build item output
			out += templates.firstLetterHeading(firstChar, page, c, lastFirstChar, showLetters);			
			out += '<div class="artist-item has-covers" data-artistid="' + artist.artistid + '">';			
			out += templates.coverGroup(cg);
			out += '<div class="wui-icon-set-play action-queue-play" data-playtype="artistid" title="Queue and Play"></div>' +
					templates.artistMenu(artist) + 
				'</div>';	
			
			lastFirstChar = firstChar;
			c++;
		}		
		return '<div class="artist-list clearfix grouped-covers">' + out + '</div>';
		
	},
	
	//make the menu
	artistMenu: function(artist){
		
		var albumList = '<div class="item action-menu-add-artist" data-task="play-parent-artist-add"><i class="icon-plus-sign"></i> <strong>Add artist to queue</strong></div>' + 
						'<div class="item action-menu-play-artist" data-task="play-parent-artist"><i class="icon-play"></i> <strong>Play artist now</strong></div>' + 
						'<div class="spacer"></div>';
		var ac = 0;
		
		for(var i in artist.items){
			var album = artist.items[i];
			albumList += '<div class="item action-menu-play-album dark" data-albumid="' + album.albumid + '" data-task="play-album">'+ 
			  '<i class="icon-play"></i> <strong>' + (album.label == '' ? 'untitled' : album.label) + '</strong></div>';
			ac++;
		}
		
		return '<div class="meta wui-menu">' + 
					'<h4>' + artist.label + '</h4><p>' + ac + ' Albums</p>' + 
					'<div class="wui-menu-items" data-artistid="' + artist.artistid + '">' + albumList + '</div>' + 
				'</div>';
		
	},
	
	
	
	
	/**
	 * Covergroup - used in artist and genre pages
	 * {
	 *  type: "artistid",
	 *  id: 535,
	 *  items: [
	 *  	album,
	 *  	album
	 *  ]
	 * }
	 * 
	 * returns html
	 */
	coverGroup: function(item){
		
	    out = '<ul class="covers" data-type="' + item.type + '" data-id="' + item.id + '">';
		
		//make cover list
	    var ac = 0;
		for(var i in item.items){
			var t = item.items[i]; 
			if(ac < 4){
				out += '<li class="album-cover"><img src="' + templates.imagePath( t.thumbnail ) + '" /></li>';
			}
			ac++;
		}
		out += '</ul>'; 		
		
		return out;
	},
	
	
	
	/********************************************************************************************
	 * Pages
	 ********************************************************************************************/
	
	/* sets the contet to be the homepage */
	homepage: function(){

		
	},
	
	
	/********************************************************************************************
	 * Blocks
	 ********************************************************************************************/
	
	nowPlayingBlock: function(item){
		var song = item.item;
		var similar = xbmcmusic.getSimilarMusic(song);
		//console.log(similar);
		
		var similarhtml = '', c = 0;
		$(similar.allAlbums).each(function(i,album){
			if(c < 6){
				var title = album.label + ' - ' + album.artist;
				similarhtml += '<a class="view-album mini-album" data-albumid="'+album.albumid+'" data-artistid="'+album.artistid+'" title="'+title+'">' +
								'<img src="' + templates.imagePath( album.thumbnail ) +  '" />' + 						
							'</a>';
			}
			c++;
		});
		
		return '<h3>Now Playing in XBMC</h3><div id="now-playing-block" class="clearfix">' + 
					'<div id="now-playing-block-inner">' + 
						'<img src="' + templates.imagePath( song.thumbnail ) +  '" class="playing-thumb" />' + 
						'<div class="song-meta">' +
							'<h2><span class="playing-title download-song" title="download song" data-id="' + song.id + '">' + song.label + '</span></h2><p>' + 
							(song.artist != '' ? '<span class="playing-sub-title search-me" title="More from this artist">' + song.artist + '</span>' : '') + 
							 ' <span class="playing-more-button more-button" data-task="song" data-id="' + song.id + '"><i class="icon-align-justify"></i> More</span>' + 
							 '</p>' + 
						'</div>' + 
						'<div class="playing-mid">' + 
						  '<span class="playing-tab">Related Music</span>' + 						 
						'</div>' +   
						'<div class="sub-container clearfix">' + similarhtml + '</div>' + 
					'</div>' + 
				'</div>';
		
	},
	

	/********************************************************************************************
	 * Playlist
	 ********************************************************************************************/	
	
	
	getPlaylistPage: function(items){
		
		//cleans up missing data (if added via file system)
		var newItems = [];
		$(items).each(function(i,item){			
			newItems.push( templates.getPlaylistFileMissing(item) );
		});
		
		items = xbmcapi.parsePlaylistSongSet(newItems);
		
		var content = templates.albumList(items, 0, 'playlist');
		
		$('#playlist').html( content );
		
		//add remove link
		templates.setPlaylistSongMenu('#playlist li.song .fill-item');
		
		//correct the position numbers
		templates.positionNumbers('#playlist .song-list li');
		

		$( "#playlist" ).disableSelection();
	},
	
	setPlaylistSongMenu: function(selector){
		
		$(selector + ' .song-menu').remove();
		$(selector).append('<a class="op-playlist-remove-item button"><i class="icon-remove-sign"></i></a>');
		
	},
	
	
	getPlaylistFileMissing: function(item){
		
		if(item.artistid == undefined){
			
			var newItem = { 
					'label': item.label,
					'file': item.file,
					'artist': '',
					'track': 0,
					'thumbnail': item.thumbnail,
					'duration': 0,
					'playcount': 0
			};
			
			return newItem;
		} else {
			return item;
		}
	},
	
	
	
	
	/********************************************************************************************
	 * Menu makers
	 ********************************************************************************************/	
		
	/**
	 * 
	 * STRUCTURE
	 * 
	 * {
	 *  classes: "my-buttons",
	 *  data: { task: "op-do-this" },
	 *  title: "My title",
	 *  items: [
	 *  	{ classes: "my-button", data: { task: "op-do-that" }, title: "button text" },
	 *  	{ classes: "my-button", data: { task: "op-do-that" }, title: "button text" },     
	 *  	{ classes: "my-button", data: { task: "op-do-that" }, title: "button text" }
	 *  ]
	 * }
	 * 
	 */
	
	//structure
	menuStructure: {
		   classes: "xbmcwui-menu",
		   data: { },
		   items: []	
	},
	
	
	//menu buttons
	makeButtonMenu: function(structure){
		
		var settings = templates.menuStructure; structure = jQuery.extend(settings, structure);
		
		var items = structure.items, btns = '';
		$(items).each(function(i,o){
			btns += '<a class="menu-button ' + o.classes + '" ' + templates.dataToAttr(o.data) + '>' + o.title + '</a>';			
		});
		return '<div class="menu-buttons ' + structure.classes + '" ' + templates.dataToAttr(structure.data) + '><div class="inner">' + btns + '</div></div>';
		
	},
	
	//wui menu
	makeWuiMenu: function(structure){
		
		var settings = templates.menuStructure; structure = jQuery.extend(settings, structure);
		
		var items = structure.items, btns = '';
		$(items).each(function(i,o){
			btns += '<div class="item ' + o.classes + '" ' + templates.dataToAttr(o.data) + '>' + o.title + '</div>';			
		});
		return '<div class="wui-menu ' + structure.classes + '" ' + templates.dataToAttr(structure.data) + '><div class="wui-menu-items">' + btns + '</div></div>';
		
	},	
	
	//wui menu
	makeDialogMenu: function(structure){
		
		var settings = templates.menuStructure; structure = jQuery.extend(settings, structure);
		
		var items = structure.items, btns = '';
		$(items).each(function(i,o){
			btns += '<li><a class="item ' + o.classes + '" ' + templates.dataToAttr(o.data) + '>' + 
						(o.icon != undefined ? '<i class="icon-' + o.icon + '"></i>' : '') + o.title + 
					'</a></li>';			
		});
		return '<ul class="dialog-menu ' + structure.classes + '" ' + templates.dataToAttr(structure.data) + '>' + btns + '</ul>';
		
	},	
	
	/********************************************************************************************
	 * Helpers
	 ********************************************************************************************/
	
	
	
	//turns a data object into an attribute string
	dataToAttr: function(items){
		var data = '';
		for(var i in items){ 
			data += ' data-' + i + '="' + items[i] + '"';
		}
		return data;
	},
	

	
	nowPlayingTime: function(obj){
		return (obj.hours > 0 ? obj.hours + ':' : '') + 
				(obj.hours > 0 && obj.minutes < 10 ? '0' : '' ) + obj.minutes + ':' + 
				(obj.seconds < 10 ? '0' : '' ) + obj.seconds; 
		
	},
	
	secondsToHms: function(d, long) {
		d = Number(d);
		var h = Math.floor(d / 3600);
		var m = Math.floor(d % 3600 / 60);
		var s = Math.floor(d % 3600 % 60);
		
		if(long == 'long'){
			return (
					(h > 0 ? h + " hour" + (h > 1 ? 's ' : ' ') : "") + 
					(m > 0 ?  m : "0") + ' minute' + (m == 0 || m > 1 ? 's' : '') + 
					(m < 4 && h == 0 ? " " + s + ' second' + (s == 0 || s > 1 ? 's' : '') : '')
				   );
		} else {
			return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s);
		}
		
	},
		
	
	imagePath: function(img, type){
		filetype = 'music';
		if(type == 'video'){ filetype = type; }
		
		if(img && img != 'default.png' && img != 'DefaultAlbumCover.png'){
			return '/vfs/' + img;
		}
		return '/theme/default-' + filetype + '.png';
	},
	
	
	
	
	/**
	 * First Letter Heading
	 */
	firstLetterHeading: function(firstChar, page, c, lastFirstChar, showLetters){

		//show the letter header index
		if( firstChar != lastFirstChar && showLetters == true ){
			//if we are calling a pager page dont write for first as 99.9% chance it is already there, dont care about the 0.01% really
			if( (page > 0 && c > 0) || page == 0){
				return '<h3 id="letter-' + firstChar + '">' + firstChar + '</h3>';
			}				
		}
		return '';
	},
	

	/********************************************************************************************
	 * Pager
	 ********************************************************************************************/	
	
	/**
	 * Pager
	 *  - this is a wrapper for all template lists
	 */
	pager: function(results, page, ipp){
						
		if(!page){ page = 0; }
		if(!ipp){
			ipp = templates.maxPerPage;
		}
		var bottom = 0;
		
		
		var out = [];
		var c = 0;
		
		if(page > 0){
			bottom = (ipp * page);
		}  else {
			templates.lastResultSet = results; //cache last set for pager (if first page)
		}
		
		var top = bottom + ipp;
		
		for(var i in results){
			if(c < top && c >= bottom){
				out.push(results[i]);
			}
			c++;
		}
		return out;
	},
	
	
	/* generic function for pager click */
	pagerAction: function(content_selector, next_selector, results, content_callback, group ){
				
		var p = $(next_selector).attr('data-pagenum'); 
		if(p != undefined){
			var content = content_callback( results, p, group );
			content = $(content).html();
			if(content == '' || content == undefined){ 
				$(next_selector).remove(); //remove more button if no more results
			}
			$(content_selector).append(content);				
			p++;
			$(next_selector).attr('data-pagenum', p);			
		}		
		return false;
		
	},
	
	
	
	//add position numbers to a selector
	positionNumbers: function(selector){		
		$(selector).each(function(i,o){
			$(o).attr('data-position', i);
		});
	},
	
	
	binds: function(){
				
		//next page
		$(window).scroll(function(e){
			if(mainapp.nearbottom(e)){
				$('.pager-more').trigger('click');
			}
		});
						
	}
	
	
	
	
		
};







