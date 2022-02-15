// node modules
var fs = require("fs");
var path = require("path");

// npm modules
var ftp = require("ftp");
var mkdirp = require("mkdirp");
var debug = require("debug")("ftpftpdump");

function ftpdump(conf, folder, _fn){
	var self = this;
	
	var fn = function(err){
		if (self.ftpclient) self.ftpclient.destroy();
		if (typeof _fn === "function") _fn(err);
	};
	
	self.files = [];
	self.dirs = [];
	self.cwd = null;
	
	self.conf = conf;
	self.folder = (folder || "backups");
	
	debug("download folder is %s", self.folder);

	// new ftp client
	self.ftpclient = new ftp();
	self.ftpclient.on("ready", function(){
		self.dirs.push(self.conf.root);
		self.scan(function(err){
			if (err) return fn(err);
			self.download(function(err){
				if (err) return fn(err);
				fn(null);
			});
		});
	});
	
	self.ftpclient.connect(self.conf);

	return self;
};

ftpdump.prototype.scan = function(fn){
	var self = this;

	var current_dir = self.dirs.pop();
	debug("scanning dir %s", current_dir);
	
	// print working dir
	self.ftpclient.pwd(function(err, pwd){
		if (err) return fn(err);
		
		var list_dir = path.resolve(pwd, current_dir);
		
		self.ftpclient.list(list_dir, false, function(err, list){
			if (err) return fn(err);
			
			list.forEach(function(file){
				
				// ignore self and parent dir
				if (file.name === ".." || file.name === ".") return;

				switch (file.type) {
					case "d": 
						debug("found new directory %s", path.resolve(list_dir, file.name));
						self.dirs.push(path.resolve(list_dir, file.name));
					break;
					case "-": 
						debug("found new file %s", path.resolve(list_dir, file.name));
						self.files.push(path.resolve(list_dir, file.name));
					break;
					default: 
						debug("ignoring file '%s' with type %s", file.name, file.type);
					break;
				}

			});
			
			// check if all is scanned
			if (self.dirs.length === 0) return fn();

			// start another round of happy scanning
			scan(fn);
		});
	});
	
	return self;
};

ftpdump.prototype.download = function(fn){
	var self = this;
	if (self.files.length === 0) return fn();
	
	var download_file = self.files.pop();
	debug("downloading file %s", download_file);
	
	mkdirp(path.resolve(self.folder, "."+path.dirname(download_file)), function(err){
		if (err) return fn(err);

		self.ftpclient.get(download_file, function(err, file_stream){
			if (err) return fn(err);
		
			debug("writing file %s", download_file);
			file_stream.pipe(fs.createWriteStream(path.resolve(self.folder, "."+download_file)).on("finish", function(){
				debug("saved file %s", download_file);
				self.download(fn);
			}));
			
		});
	});
	
	return self;
};

module.exports = ftpdump;
