var jswget = require("../lib/index.js");
var fs = require("fs");

saveas = "image.png";
jswget({
    url: "http://upload.wikimedia.org/wikipedia/id/f/f3/Wikipedia-logo-v2-id.png",
	downloadmode: true,
    onsend: function(req, options){			
		process.stdout.write("Download: " + saveas + " ");
	},
	onhead: function(fstat, req, res){
		console.log(" [GOT HEAD] ")
		console.log(res.headers)
		process.stdout.write(">> ");
	},
	ondata: function(chunk, req, res){
		process.stdout.write(".");
	},
	onsuccess: function(resp, req, res){
		process.stdout.write(" Done ");
	},
	onerror: function(err, req){
		process.stdout.write("Error " + err + " ");
	},
	onend: function(req, options){
	},
    scope: this
 });