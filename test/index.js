var jswget = require("../lib/index.js");

jswget({
    url: "http://localhost:3000/user/register",
    method: "GET",
    formdata: {
    	q1: "value"
    },
    query: {
    	q2: "value"
    },
    timeout: 20000,
    onsuccess: function (resp, rq, rs) {
    	console.log("Success: ", resp);
    },
    onerror: function (e, rq, rs) {
    	console.log("Error: ", e);              
    },
    scope: this
 });