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

### Upload File to Wiki
```
var jswget = require('jswget');
new jswget({
    url: "http://somewikipage.com/" + "wikia.php",
    query: {
        controller: "UploadPhotos",
        method: "Upload",
        format: "json"
    }, 
    formdata: {
        wpSourceType: "file",
        wpUploadFile: new jswget.File(*your_image*),
        wpDestFileWarningAck: "on",
        "wpDestFile": *image_name*,
        wpUploadDescription: "Upload Caption",
        wpLicense: "File License",
        wpWatchthis: "on",
        wpIgnoreWarning: "on",
        wpOverWriteFile: "on"
    },
    cookiefile: "./cookies.txt",
    headers: {
        "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.125 Safari/537.36",
        "Accept-Language":"en-US,en;q=0.8,id;q=0.6",
        "Cache-Control":"no-cache",
        "Connection":"keep-alive",
        "Host":"ggz.wikia.com"
    },
    method: "POST",
    onsend: function(req, opt){           
    },
    onerror: function(err, req, opt){
        console.log(err)
    },
    onsuccess: function(restext, req, resp, opt){
        console.log(restext)
    },
    onend: function(req, opt){
    }
});
```

## Features

1. In download mode, When file with same name found in download path, jswget will try to resume the download.
2. Cookie support, you can get cookie vars, or store and read automaticaly from a file path
3. Upload mode
4. Redirect follow
5. Auth and OAuth computation
6. Support for both HTTPS and HTTP
7. Pipe request output stream
8. Send POST data or raw data
9. Upload file support, to upload file put value to "formdata" config with jswget.File(*file_path*)
10. etc

## Options

```
* the configuration are:
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
 *   onsend             #FUNCTION triggered when request is initiated [request object, configuration object]
 *   onresponse         #FUNCTION triggered when request is got first response [request object, response object, configutation object]
 *   onredirect         #FUNCTION triggered when request is beng redirected with argument [request object, response object, configutation object]
 *   ondata             #FUNCTION triggered when request is on progress with argument [chunck, request object, response object, configutation object]
 *   onsuccess          #FUNCTION triggered when request is completed with argument [response, request object, response object, configutation object]
 *   onerror            #FUNCTION triggered when request is incomplete with argument [error object, request object, configutation object]
 *   onhead             #FUNCTION triggered when request is got head response (download mode) with argument [error object, request object, response object, configutation object]
 *   onend              #FUNCTION triggered when request is end, regardless result with argument [request object, configutation object]
 *   onsocket           #FUNCTION triggered when request is got socket assigned with argument [socket object, request object, configutation object]
 *   onconnect          #FUNCTION triggered when request is got response CONNECT method upgrade with argument [request object, response object, socket object, head object, configutation object]
 *   onupgrade          #FUNCTION triggered when request is got response upgrade from server with argument [request object, response object, socket object, head object, configutation object]
 *   oncontinue         #FUNCTION triggered when request is got "100 Continue" response from server with argument [request object, configutation object]
 *   scope              #OBJECT scope of callback
 *   pipestream         #STREAM Stream to be piped response, see node.js Fs documentation
 *   cookiefile         #STRING path of cookie file
 *   cookies            #OBJECT of cookie { configs.cookiename: {value, path, expires, max-age, secure, httponly, domain, port, commenturl, discard} }
 *   downloadmode       #BOOLEAN set true to enter download mode
 *   downloadas         #STRING rename downloaded file
 *   downloadpath       #STRING path of downloaded file
 *   timeout            #NUMBER time out in mili second
 *   follow             #BOOLEAN follow redirection, default is true
 *   maxfollow          #NUMBER Max number of redirection before throw error, default is 10
 *   -HTTPS Option see nodejs HTTPS documentation-
 *   pfx                #STRING when the protocol is https, the https client will be constructed using this configuration
 *   key                #STRING when the protocol is https, the https client will be constructed using this configutation
 *   passphrase         #STRING when the protocol is https, the https client will be constructed using this configutation
 *   cert               #STRING when the protocol is https, the https client will be constructed using this configutation
 *   ca                 #STRING when the protocol is https, the https client will be constructed using this configutation
 *   ciphers            #STRING when the protocol is https, the https client will be constructed using this configutation
 *   rejectUnauthorized #STRING when the protocol is https, the https client will be constructed using this configutation
```

## Changelist
### Version 0.2.x
 * Add onredirect, onsocket, onconnect, onupgrade, oncontinue listeners
 * Make sure to create new aggent for every request
 * Restructured whole code, to avoid repetitive

## To Do

1. More testing,
2. Check download integrity
3. More feature

## Documentation


## Tests


## Contribution

You are welcome to contribute by writing issues or pull requests.

You are also welcome to correct any spelling mistakes or any language issues, because my english is not perfect...


## License

Copyright (c) 2014 Decky Fx

MIT (http://www.opensource.org/licenses/mit-license.php)
