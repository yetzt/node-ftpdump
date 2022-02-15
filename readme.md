# ftpdump

A simple module to download the contents of a server over an FTP connection. 
Stolen from [dump-ftp](https://www.npmjs.com/package/dump-ftp) and improved.
(I would have sent pull requests, but there was no git)

## Install

`npm install ftpdump --save`

## Usage

``` javascript
var ftpdump = require("ftpdump");

new ftpdump({
	host: "example.org",
	port: 21,
	user: "hacking_team",
	password: "passw0rd",
	root: "remote-folder"
}, "/path/to/local-folder", function(err){
	if (err) return console.log(err);
	
	// yay!
	
});
```
