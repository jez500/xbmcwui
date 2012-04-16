
/*
 *
 * list files
 * 
 * uses http://bassistance.de/jquery-plugins/jquery-plugin-treeview/ for the tree
 * 
 */




var files = {
		
	
	getSource: function(type){
		xbmcapi.getFileSources( type, files.getSourceCallback );
		
		var out = '<h3 id="files-title">' + type + ' files</h3><div id="file-browser" class="file-list-wrapper ' + type + '-files clearfix">' +
					'<div id="file-browser-path"><ul id="file-path" class="path-bar"></ul></div><ul id="file-list"></ul>' + 
					'<div id="file-sidebar"><div id="file-path-label"></div><div id="file-controls"></div></div>' + 
				  '</div>';
		router.buildPage( 'op=files&type=' + type, out);
		
		$('ul.nav li a.op-files').addClass('active');
		
	},	
	
	getSourceCallback: function(result){
		console.log(result);
		
		//we build the page for first use
		var out = '';
		
		$(result.sources).each(function(i, params){
			params.type = 'unknown'; 
			params.filetype = 'directory';
			out += files.rowWrapper(params);
		});
		
		$('#file-list').html(out);
		
		
		
	},	
	
		
		
	getFolder: function(path){
		xbmcapi.getDirectory( path, files.getFolderCallback );			
	},	
	
	getFolderCallback: function(result){

		var filesList = result.files;
		
		filesList.sort(function(a,b){	
			var aa = a.filetype + a.file, bb = b.filetype + b.file; //order by foldertype then name			
			return xbmcapi.aphabeticalSort(aa,bb);
		});
		
		var out = '';		
		$(filesList).each(function(i, params){
			if(params.filetype == 'file'){
				var file = params.file;
				var ext = file.split('.').pop();
				//check extension for file
				if(ext == 'mp3' || ext == 'avi'){ //@TODO: fix!
					out += files.rowWrapper(params);
				}
			} else {
				out += files.rowWrapper(params);
			}			
		});		
		
		$('#file-list').html(out);	
		files.updateState();
		mainapp.notify('stop', '');
	},
	
	
	
	rowWrapper: function(params){
		return '<li class="op-file-item type-' + params.filetype + '" data-file="' + params.file + '" data-file-type="' + params.filetype + '">' + 
					'<div data-type="' + params.filetype + '" data-id="' + params.file + '" class="protector"></div>' + 
					'<i class="' + (params.filetype == 'file' ? 'icon-file' : 'icon-folder-close') + '"></i> ' + 
					params.label +
				'</li>';
	},
	
	
	
	/**
	 * Like breadcrumbs or windows explorer nav
	 * @param path
	 */
	getPathBar: function(path){
		
		
	},
	
	
	sideBarControls: function(row){
		
		out = '<ul>' + 
				'<li class="action-file-add add-selection" data-action="add" data-task="selected"><strong>Add selection</strong> to playlist</li>' + 
				'<li class="action-file-add" data-action="add" data-task="folder"><strong>Add folder</strong> to playlist</li>' + 				
				'<li class="action-file-add" data-action="replace" data-task="play"><strong>Play folder</strong> replace playlist</li>' + 
			  '</ul>';
		$('#file-controls').html(out);
	},
	
	
	binds: function(){
		
		$('.op-files').click( function(e){ 
			files.getSource($(this).attr('data-task'));  
		});
		
		
		$('.op-file-item .protector:not(.ui-draggable)').liveDraggable( xbmcmusic.dragOptions );
		
		//click on a file item
		$('.op-file-item').live('click', function(e){ 
			var row = $(this);
			var file = row.attr('data-file');
			var parent = row.parent();
			
			files.sideBarControls(row);
			
			if(row.attr('data-file-type') == 'file'){
				//we do something with the file...
				row.toggleClass('selected'); 
				
				files.updateState();
				
				
				return;
			}
			
			mainapp.notify('start', 'Loading folder');
			
			//if pathbar click
			if(parent.hasClass('path-bar')){
				var set = false, out = '', thisfile = '', obj;
				
				parent.find('li').each(function(i,o){
					obj = $(o);
					thisfile = obj.attr('data-file');
					if(set != true){
						if(thisfile == file){
							set = true;
						}
					} else {
						obj.remove();
					}
				});			
				
				
			} else {
				//if content click
				$('#file-path').append(row);
			}		
			$('#files-title').html( row.html() );
			$('#file-path-label').html(file);
			$('#file-path li').removeClass('last');
			$('#file-path li:last').addClass('last');
			//load main
			files.getFolder(file);  
		});
		
		
		//add slected 
		$('.action-file-add').live('click', function(e){
			
			var op = $(this).attr('data-task');
			var action = $(this).attr('data-action');
			var queue = [];
			
			$('#file-list li').each(function(i,o){
				var obj = $(o); 
								
				if( !obj.hasClass('selected') && op == 'selected'){
				  //if not selected and action is add selected then dont add anything
				} else {
					
					queue.push('"' + obj.attr('data-file') + '"');
					
			
										
				}
			});
			
			//Add items to playlist - in order they appear on the screen
			if(op == 'play'){
				//play afterwards?
				xbmcapi.playlistAddFiles(0, queue, "play" );
			} else {
				//just add to queue
				xbmcapi.playlistAddFiles(0, queue, "add" );
				
			}
			mainapp.notify('start', 'Music added to the playlist', 1);
		});
		
			
		
	},
	
	updateState: function(){
	
		//parent styles has-files, has-selected
		var sCount = 0, fCount = 0;
		$('.op-file-item').each(function(i,o){
			//console.log(o);
			var obj = $(o);
			if(obj.hasClass('selected')){ sCount++; }
			if(obj.hasClass('type-file')){ fCount++; }
		});
		
		if(sCount > 0){ $('#file-browser').addClass('has-selected'); }
		else {	$('#file-browser').removeClass('has-selected'); }
		
		if(fCount > 0){ $('#file-browser').addClass('has-files'); }
		else {	$('#file-browser').removeClass('has-files'); }	
		
	},
	
	
	playFirst: function(){
		xbmcapi.playPlaylistPosition(0, nowplaying.update );
	},
	
	
	
	
	
	
	/**
	 * These all just check extensions/filetypes
	 */		
	getExtension: function(filename) {
	    var parts = filename.split('.');
	    return parts[parts.length - 1];
	}, 	
	isMusic: function(str){
		var ext = files.getExtension(str);
	    switch (ext.toLowerCase()) {
	    case 'mp3':
	    case 'aac':
	    case 'wma':
	    case 'wav':
	        return true;
	    }
	    return false;
	},	
	isVideo: function(str){
		var ext = files.getExtension(str);
	    switch (ext.toLowerCase()) {
	    case 'avi':
	    case 'mpg':
	    case 'mpeg':
	    case 'mp4':
	    case 'flv':
	    case 'wmv':
	    case 'mov':
	    case 'mkv':	    	
	        return true;
	    }
	    return false;
	},		
	isPhoto: function(str){
		var ext = files.getExtension(str);
	    switch (ext.toLowerCase()) {
	    case 'jpg':
	    case 'gif':
	    case 'bmp':
	    case 'png':
	    case 'jpeg':	
	        return true;
	    }
	    return false;
	}	
	

	
	
	
};

