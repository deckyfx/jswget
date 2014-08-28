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

/*
var commander = {
    host: "127.0.0.1",
    port: 3000,
    collection: "col"    
}

var option = {
    hostname : commander.host,
    port : commander.port,
    pathname : "/swt",
    query : {
        wt : "json",
        indexInfo : false,
        action : "CREATE",
        name : commander.collection,
        instanceDir : commander.collection,
        dataDir : "data",
        config : "solrconfig.xml",
        schema : "schema.xml",
        collection : "",
        shard : ""
    },
    method : "GET"
}

jswget(option, function(err, req, res, body) {
    console.log("Done", arguments)
})
*/