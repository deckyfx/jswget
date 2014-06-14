var jswget = require("../lib/index.js");

jswget({
    url: "http://google.com/",
    method: "GET",	
    query: {
    	q2: "value"
    },
    timeout: 20000,
	onredirect: function (resp, rq, rs) {
    	console.log("Redirect: ");
    },
    onsuccess: function (resp, rq, rs) {
    	// console.log("Success: ", resp);
    },
    onerror: function (e, rq, rs) {
    	// console.log("Error: ", e);              
    },
    scope: this
 });