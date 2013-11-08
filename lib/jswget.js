function Request(/*[Object options|String URL], [function success_callback]*/){
    /*
     * the options are:
     *   url                #STRING url input with format [protocol]://[host]:[port]/[path]?[query]#[bookmark]
     *   protocol           #STRING protocol, together with hostname, port, path (as query too) as url
     *   hostname           #STRING hostname, together with protocol, port, path (as query too) as url
     *   port               #STRING port, together with protocol, hostname, path (as query too) as url
     *   path               #STRING path (as query too), together with protocol, hostname, port as url
     *   method             #STRING method default is GET
     *   headers            #OBJECT set of request headers
     *   rawdata            #STRING send raw data with request
     *   formdata           #OBJECT JSON of pair form name and value to be sent with request
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
    */
    var QS = require('querystring');
    var Fs = require('fs');
    var options = {};
    if (arguments.length == 0) {
        return;
    }
    if (typeof(arguments[0]) == "object") {
        options = arguments[0];
    }
    if (typeof(arguments[0]) == "string") {
        options.url = arguments[0];
    }
    if (arguments[1] !== undefined && typeof(arguments[1]) == "function") {
        options.onsuccess = arguments[1];
    }
    options.url = (options.url === undefined)? "":options.url;
    var url = options.url.split("/");
    if (url.length > 1) {
         if (url[1].length == 0) {
            options.protocol = url[0].split(":")[0];
            options.hostname = url[2];
            url.shift();
            url.shift();
            url.shift();
        } else {
            options.hostname = url[0];
            url.shift();
        }    
        url.unshift("");
        options.path = url.join("/");
        options.hostname = options.hostname.split(":");
        options.port = (options.hostname[1] === undefined)? ((options.protocol=="http")? 80:443):options.hostname[1];
        options.hostname = options.hostname[0];
    } else {
        return;
    }
    options.hostname = (options.hostname===undefined)? "127.0.0.1":options.hostname;
    options.port = (options.port===undefined)? 80:options.port;
    options.path = (options.path===undefined)? "/":options.path;
    options.protocol = (options.protocol===undefined)? "http":options.protocol;
    options.scope = (options.scope === undefined)? {}:options.scope;
    options.method = (options.method===undefined)? "GET":options.method;
    options.rawdata = (options.rawdata===undefined)? "":options.rawdata;
    options.formdata = (options.formdata===undefined)? null:QS.stringify(options.formdata);
    options.cookiefile = (options.cookiefile===undefined)? "":options.cookiefile;
    options.cookies = (options.cookies===undefined)? []:options.cookies;
    options.headers = (options.headers===undefined)? {}:options.headers;
    options.encoding = (options.encoding===undefined)? "utf-8":options.encoding;
    options.onsend = (options.onsend===undefined)? new Function():options.onsend;
    options.onsuccess = (options.onsuccess===undefined)? new Function():options.onsuccess;
    options.ondata = (options.ondata===undefined)? new Function():options.ondata;
    options.onerror = (options.onerror===undefined)? new Function():options.onerror;
    options.onhead = (options.onhead===undefined)? new Function():options.onhead;
    options.timeout = (options.timeout===undefined)? undefined:options.timeout;
    options.auth = (options.auth===undefined)? undefined:options.auth;
    options.oauth = (options.oauth===undefined)? undefined:options.oauth;
    options.downloadmode = (options.downloadmode===undefined)? false:options.downloadmode;
    options.downloadas = (options.downloadas===undefined)? options.path.split("/")[options.path.split("/").length - 1]:options.downloadas;
    options.downloadpath = (options.downloadpath===undefined)? "./":options.downloadpath;
    options.uploadfile = (options.uploadfile===undefined)? false:options.uploadfile;
    options.pipestream = (options.pipestream===undefined)? null:options.pipestream;
    options.follow = (options.follow===undefined)? true:options.follow;
    options.maxfollow = (options.maxfollow===undefined)? 10:options.maxfollow;
    options._followCount = (options._followCount===undefined)? 0:(options._followCount + 1);
    
    var allcookies = {};
    var cookiename = options.protocol + "://" + options.hostname + ":" + options.port;
    allcookies[cookiename] = {};
    if (typeof(options.cookiefile) === "string") {
        if (options.cookiefile.length > 0 && options.followCount < options.maxfollow) {
            try {
                allcookies = JSON.parse(Fs.readFileSync(options.cookiefile));
            } catch (e) {}
        }
    } else {}
    for (var i in options.cookies) {
        allcookies[cookiename][i] = options.cookies[i];
    }
    // Parse cookie object to cookie header string
    options.headers.Cookie = [];
    for (var i in allcookies[cookiename]) {
        if (typeof(allcookies[cookiename][i]) == "string") {
            options.headers.Cookie.push(allcookies[cookiename][i]);
        } else {
            var cookie = [];
            cookie.push(i + "=" + allcookies[cookiename][i].value);
            if (allcookies[cookiename][i].path !== undefined) {
                cookie.push("Path=" + allcookies[cookiename][i].path);
            }
            if (allcookies[cookiename][i].expires !== undefined) {
                cookie.push("Path=" + allcookies[cookiename][i].expires);
            }
            if (allcookies[cookiename][i]["max-age"] !== undefined) {
                cookie.push("Path=" + allcookies[cookiename][i]["max-age"]);
            }
            if (allcookies[cookiename][i].domain !== undefined) {
                cookie.push("Path=" + allcookies[cookiename][i].domain);
            }
            if (allcookies[cookiename][i].commenturl !== undefined) {
                cookie.push("Path=" + allcookies[cookiename][i].commenturl);
            }
            if (allcookies[cookiename][i].secure) {
                cookie.push("Secure");
            }
            if (allcookies[cookiename][i].httponly) {
                cookie.push("HttpOnly");
            }
            if (allcookies[cookiename][i].discard) {
                cookie.push("Discard");
            }
            options.headers.Cookie.push(cookie.join(";"));
        }
    }
    var result = "";
    var USEDLib;
    switch (options.protocol.toLowerCase()) {
        case "https" :
            USEDLib = require('https');
            options.agent = new USEDLib.Agent(options);
        break;
        default :
            USEDLib = require('http');
        break;
    }
    if (options.auth !== undefined) {
        options.headers['Authorization'] = 'Basic '+new Buffer(options.auth.username + ':' + options.auth.password).toString('base64');
        delete options.auth;
    }
    if (options.oauth !== undefined) {
        var allowedChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
        var timestamp = Math.ceil((new Date()).getTime()/1000);
        var nonce = '';
        for (var i=0; i < 32; i++) {
            var rnum = Math.floor(Math.random() * allowedChars.length);
            nonce += allowedChars.substring(rnum,rnum+1);
        };
        options.oauth.signature_method = (options.oauth.signature_method === undefined)? "HMAC-SHA1":options.oauth.signature_method;
        options.oauth.oauth_token_version = (options.oauth.oauth_token_version === undefined)? "1.0":options.oauth.oauth_token_version;
        var oauthData = { 
            oauth_consumer_key: options.oauth.consumer_key, 
            oauth_nonce: nonce, 
            oauth_signature_method: options.oauth.signature_method, 
            oauth_timestamp: timestamp, 
            oauth_token: options.oauth.access_token, 
            oauth_version: options.oauth.oauth_token_version
        };
        var sigData = {};
        for (var k in oauthData){
            sigData[k] = oauthData[k];
        }
        var oauthURL = options.protocol + "://" + options.hostname + ((options.port.length == 0)? "":":" + options.port) + options.path;
        // somehow including port will cause error, so ignore for now
        var oauthURL = options.protocol + "://" + options.hostname + options.path;
        
        var sig = generateOAuthSignature(options.method, oauthURL, sigData, options.oauth.consumer_secret, options.oauth.token_secret);
        oauthData.oauth_signature = sig;
        var oauthHeader = "";
        for (var k in oauthData){
            oauthHeader += ", " + encodeURIComponent(k) + "=\"" + encodeURIComponent(oauthData[k]) + "\"";
        }
        oauthHeader = oauthHeader.substring(1);
        options.headers['Authorization'] = "OAuth" + oauthHeader;
        delete options.oauth;
    }
    if (options.uploadfile != false) {
        options.method = "POST";
        var boundaryKey = Math.random().toString(16);
        var fileName = options.uploadfile.replace(/.+\//gi, "");
        options.headers['Content-Type'] = 'multipart/form-data; boundary="'+boundaryKey+'"';
        
        options.formdata = options.formdata
        var form = QS.parse(options.formdata);
        var formdata = "";
        for (i in form) {
            formdata += '--' + boundaryKey + '\r\n'
                     + 'Content-Disposition: form-data; name="'+i+'"\r\n\r\n'
                     + form[i] + '\r\n';
        }
        options.formdata  = formdata 
                          + '--' + boundaryKey + '\r\n'
                          + 'Content-Type: application/octet-stream\r\n' 
                          + 'Content-Disposition: form-data; name="FILE_UPLOADED"; filename="'+fileName+'"\r\n'
                          + 'Content-Transfer-Encoding: binary\r\n\r\n';
    } else {
        if (options.formdata != null) {
            options.method = "POST";
            options.headers['Content-Length'] = options.formdata.length;
            options.headers['Content-Type'] = "application/x-www-form-urlencoded; charset=UTF-8";
        }
    }
    if (options.downloadmode) {
        var backupmethod = options.method;
        options.method = "HEAD";
    }
    delete options.protocol;
    var req = USEDLib.request(options, function(res) {
        // Merge with old cookies
        allcookies[cookiename] = options.cookies;
        // Parse cookie string to cookie object, this must be handled first!
        var responsecookie = res.headers['set-cookie'] || res.headers['Set-Cookie'];
        if (responsecookie !== undefined) {
            var responsecookieobject = {};
            var cookiekeyheaders = ["path", "expires", "max-age", "secure", "httponly", "domain", "port", "commenturl", "discard"];
            for (var i = 0; i < responsecookie.length; i++) {
                var responsecookieattr = responsecookie[i].split(";");
                var namefound = false;
                var responsecookiename;
                responsecookieobject[i] = {};
                for (var n = 0; n < responsecookieattr.length; n++) {
                    var attr = responsecookieattr[n].split("=");
                    var attrname = attr[0].trim();
                    if (!namefound) {
                        if (cookiekeyheaders.indexOf(attrname.toLowerCase()) == -1) {
                            responsecookiename = attrname;
                            attrname = "value"
                            namefound = true;
                        }
                    }
                    attr.shift();
                    var attrval = (attr[0] !== undefined)? attr.join("="):true;
                    if (attrval == true) {
                        responsecookieobject[i][attrname.toLowerCase()] = true;
                    } else {
                        responsecookieobject[i][attrname.toLowerCase()] = attrval;
                    }
                }
                allcookies[cookiename][responsecookiename] = responsecookieobject[i];
            }
        }
        // Return cookies, anything happened!
        res.cookies = allcookies[cookiename];
        // Write cookies to file
        if (typeof(options.cookiefile) === "string") {
            if (options.cookiefile.length > 0) {
                try {
                    Fs.writeFileSync(options.cookiefile, JSON.stringify(allcookies));
                } catch (e) {}
            }
        }
        // HTTP Error handler
        if (res.statusCode >= 400) {
            options.onerror.apply(options.scope, [res.statusCode, req]);
            return;
        }
        // HTTP Redirect, 301, 302
        if (res.statusCode == 301 || res.statusCode == 302) {
            if (res.headers.location !== undefined && options.follow && options._followCount < options.maxfollow) {
                options.url = res.headers.location;
                // Change method to GET
                options.method = "GET";
                // Also import cookies
                options.cookies = res.cookies;
                // Also change referer
                options.headers.Referer = "http://data.smartfren.com/index.php/main_beta/index";
                Request(options);
                return;
            } else {
                options.onerror.apply(options.scope, [res.statusCode, req]);
                return;
            }
        }
        if (options.downloadmode) {
            var filesize = (res.headers['content-length'] === undefined)? 0:res.headers['content-length'];
            res.on('end', function(){
                var fstat = null;
                var startbyte;
                try {
                    fstat = Fs.statSync(options.downloadpath + options.downloadas);
                } catch (e) {}
                if (fstat == null) {
                    startbyte = 0;
                } else {
                    startbyte = fstat.size;
                }
                var file = Fs.createWriteStream(options.downloadpath + options.downloadas, {'flags': 'a'});
                if (startbyte >= filesize) {
                    options.onsuccess.apply(options.scope, [file, req, res]);
                    return false;
                }
                options.method = backupmethod;
                if (filesize > 0) {
                    options.headers['range'] = "bytes=" + startbyte + '-' ;
                }
                options.onhead.apply(options.scope, [fstat, req, res]);
                console.log(options.headers);
                var req = USEDLib.request(options, function(res) {
                    res.pipe(file);
                    if (options.pipestream != null) {
                        res.pipe(options.pipestream);
                    }
                    res.on('data', function(chunk){
                        options.ondata.apply(options.scope, [chunk, req, res]);
                        return false;
                    });
                    res.on('end', function(){
                        options.onsuccess.apply(options.scope, [file, req, res])
                        return false;
                    });
                });
                req.on('error', function(e) {
                    options.onerror.apply(options.scope, [e, req]);
                    return false;
                });
                if (options.timeout !== undefined) {
                    req.setTimeout(options.timeout, function(){
                        req.abort();
                    });
                }
                if (options.formdata != null) {
                    req.write(options.formdata);
                } else {
                    req.write(options.rawdata);
                }
                req.end();
            });
        } else {
            if (options.pipestream != null) {
                res.pipe(options.pipestream);
            } else {
                res.setEncoding(options.encoding);
            }
            res.on('data', function (chunk) {
                result += chunk;
                options.ondata.apply(options.scope, [chunk, req, res]);
            });
            res.on('end', function () {
                options.onsuccess.apply(options.scope, [result, req, res]);
            });
        }
    });
    options.onsend.apply(options.scope, [req, options]);
    req.on('error', function(e) {
        options.onerror.apply(options.scope, [e, req]);
    });
    if (options.timeout !== undefined) {
        req.setTimeout(options.timeout, function(){
            req.abort();
        });
    }
    if (options.formdata != null) {
        req.write(options.formdata);
    } else {
        req.write(options.rawdata);
    }
    if (options.uploadfile != false) {
        Fs.createReadStream(options.uploadfile, { bufferSize: 4 * 1024 }).on('end', function() {
            req.write('\r\n--' + boundaryKey + '--');
            req.end();
        }).pipe(req, { end: false });
    } else {
        req.end();
    }
};

function generateOAuthSignature(method, url, data, ConsumerSecret, TokenSecret){
    var signingToken = encodeURIComponent(ConsumerSecret) + "&" + encodeURIComponent(TokenSecret);

    var keys = [];
    for (var d in data){
        keys.push(d);
    }
    keys.sort();
    var output = method.toUpperCase() + "&" + encodeURIComponent(url) + "&";
    var params = "";
    keys.forEach(function(k){
        params += "&" + encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
    });
    params = encodeURIComponent(params.substring(1));
    return hashString(signingToken, output+params, "base64");
}

function hashString(key, str, encoding){
    var Crypto = require("crypto");
    var hmac = Crypto.createHmac("sha1", key);
    hmac.update(str);
    return hmac.digest(encoding);
}

module.exports = Request;
