jswget
===========
[![NPM version](https://badge.fury.io/js/jswget.png)](http://badge.fury.io/js/jswget)
[![Stories in Ready](https://badge.waffle.io/1412/jswget.png?label=ready)](http://waffle.io/1412/jswget)
[![build status](https://secure.travis-ci.org/1412/jswget.png)](http://travis-ci.org/1412/jswget)

## Introduction

REST and resumable download client for nodejs

## Instalation

```
npm install jswget
```

## Usage

```
jswget(options);
```

## Sample

### Download File
```
var jswget = require('jswget');
jswget({
    url: "http://192.168.7.54:4000/2_thumb.jpg",
    downloadmode: true,
    // if not given will try to get name from last path, otherwise force to use this name
    downloadas: "2_thumb.jpg",
    // if not given, the default path is where the program run
    downloadpath: "./",
    method: "GET",
    onsend: function(req, options){
        console.log("Start")
    },
    onhead: function(fstat, req, res){
        console.log(res.headers)
    },
    ondata: function(chunk, req, res){
        console.log("Get: " + chunk.length)
		process.exit();
    },
    onsuccess: function(resp, req, res){
        console.log("Done")
    },
    onerror: function(err, req){
        console.log("Error", err);
    }
});
```

## Features

1. In downlaod mode, When file with same name found in download path, jswget will try to resume the download.
2. Cookie support, you can get cookie vars, or store and read automaticaly from a file path
3. Upload mode
4. Redirect follow
5. Auth and OAuth computation
6. Support for both HTTPS and HTTP
7. Pipe request output stream
8. Send POST data or raw data
9. etc

## Options

```
*   url                #STRING url input with format [protocol]://[host]:[port]/[path]?[query]#[bookmark]
*   protocol           #STRING protocol, together with hostname, port, path (as query too) as url
*   hostname           #STRING hostname, together with protocol, port, path (as query too) as url
*   port               #STRING port, together with protocol, hostname, path (as query too) as url
*   path               #STRING path (as query too), together with protocol, hostname, port as url
*   method             #STRING method default is GET
*   headers            #OBJECT set of request headers
*   rawdata            #STRING send raw data with request
*   formdata           #OBJECT JSON of pair form name and value to be sent with request
*   query	            #OBJECT JSON of pair query argument name and value sent with request, added in path
*   auth               #OBJECT JSON of pair username and password of base64 auth header
*   oauth              #OBJECT JSON of oauth component contain {consumer_key, consumer_secret, access_token, token_secret, [signature_method], [oauth_token_version]}
*   encoding           #STRING response encoding default is utf-8
*   onsend             #FUNCTION triggered when request is innitiated [request object, request_options object]
*   ondata             #FUNCTION triggered when request is on progress with argument [chunck, request object, response object]
*   onsuccess          #FUNCTION triggered when request is completed with argument [response, request object, response object]
*   onerror            #FUNCTION triggered when request is incompleted with argument [error object, request object]
*   scope              #OBJECT scope of callback
*   pipestream         #STREAM Stream to be piped response, see node.js Fs documentation
*   cookiefile         #STRING path of cookie file
*   cookies            #OBJECT of cookie { cookiename: {value, path, expires, max-age, secure, httponly, domain, port, commenturl, discard} }
*   downloadmode       #BOOLEAN set true to enter download mode
*   downloadas         #STRING rename downloaded file
*   downloadpath       #STRING path of downloaded file
*   uploadfile         #STRING file path to be uploaded, upload file work only when downlloadmode = false, and no other form is uploaded
*   timeout            #NUMBER time out in mili second
*   follow             #BOOLEAN follow redirection, default is true
*   maxfollow          #NUMBER Max number of redirection before throw error, default is 10
*   -HTTPS Option see nodejs HTTPS documentation-
*   pfx                #STRING when the protocol is https, the https client will be constructed using this options
*   key                #STRING when the protocol is https, the https client will be constructed using this options
*   passphrase         #STRING when the protocol is https, the https client will be constructed using this options
*   cert               #STRING when the protocol is https, the https client will be constructed using this options
*   ca                 #STRING when the protocol is https, the https client will be constructed using this options
*   ciphers            #STRING when the protocol is https, the https client will be constructed using this options
*   rejectUnauthorized #STRING when the protocol is https, the https client will be constructed using this options
```

## To Do

1. More testing,
2. Check download integrity
3. More feature

## Documentation



## Tests




## Contribution

You are welcome to contribute by writing issues or pull requests.
It would be nice if you open source your own loaders or webmodules. :)

You are also welcome to correct any spelling mistakes or any language issues, because my english is not perfect...


## License

Copyright (c) 2012-2013 Tobias Koppers

MIT (http://www.opensource.org/licenses/mit-license.php)