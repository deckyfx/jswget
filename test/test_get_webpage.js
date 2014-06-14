var jswget = require("../lib/index.js");
var fs = require("fs");

jswget({
    url: "http://www.baka-tsuki.org/project/index.php?title=User_talk:1412",
    method: "GET",
    onsuccess: function (resp, rq, rs) {
		fs.writeFileSync("./get_webpage.html", resp);
    	console.log("Success: File Saved");
    },
    onerror: function (e, rq, rs) {
    	console.log("Error: ", e);              
    },
    scope: this
 });