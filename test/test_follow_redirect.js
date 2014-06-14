var jswget = require("../lib/index.js");
var fs = require("fs");

jswget({
    url: "http://google.com/",
    method: "GET",	
    query: {
    	safe: "active",
		client: "psy-ab",
		q: "jswget+github",
		oq: "jswget+github"
    },
	onredirect: function (resp, rq, rs) {
    	console.log("Redirect: ");
    },
    onsuccess: function (resp, rq, rs) {
		fs.writeFileSync("./follow_redirect.html", resp);
    	console.log("Success: File Saved");
    },
    onerror: function (e, rq, rs) {
    	console.log("Error: ", e);              
    },
    scope: this
 });