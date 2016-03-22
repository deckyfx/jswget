var QS = require('querystring');
var Fs = require('fs');
var HTTP = require('http');
var HTTPS = require('https');
var Mime = require('mime');


function jswget(/*[Object configuration|String URL], [function success_callback]*/){
	/*
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
	*/
    var argv = []
    for (var i in arguments) {
        argv.push(arguments[i])
    }
    
	var configs = parseConfig(argv),
		protocol = getProtocol(configs),
		sendoptions = createSendOption(protocol, configs),
		request = createRequest(protocol, sendoptions, configs);
	sendRequest(request, configs);	
};

var File = jswget.File = function(path) {
	this.path = path;
	this.contents = Fs.readFileSync(path);
	this.mime = Mime.lookup(path);
}

function parseConfig(argv){
	if (argv.length == 0) {
        throw new Error("jswget should called with at least one argument");
		return;
	}
    var configs = {};
	if (typeof(argv[0]) == "object") {
		configs = argv[0];
	}
	if (typeof(argv[0]) == "string") {
		configs.url = argv[0];
	}
	if (argv[1] !== undefined && typeof(argv[1]) == "function") {
		configs.callback = argv[1];
	}
    if (configs.url !== undefined) {
        var url = configs.url.split("/");
        if (url.length > 1) {
             if (url[1].length == 0) {
                configs.protocol = url[0].split(":")[0];
                configs.hostname = url[2];
                url.shift();
                url.shift();
                url.shift();
            } else {
                configs.hostname = url[0];
                url.shift();
            }    
            url.unshift("");
            configs.path = url.join("/");
            configs.path = (configs.path.indexOf("?") == -1)? (configs.path + "?"):(configs.path);
            configs.hostname = configs.hostname.split(":");
            configs.port = (configs.hostname[1] === undefined)? ((configs.protocol=="http")? 80:443):configs.hostname[1];
            configs.hostname = configs.hostname[0];
        }
    } else {
        configs.url = undefined;
    }
    if (configs.pathname !== undefined) {
        configs.path = configs.pathname;
    }
	configs.hostname = (configs.hostname===undefined)? "127.0.0.1":configs.hostname;
	configs.port = (configs.port===undefined)? 80:configs.port;
	configs.query = (configs.query===undefined)? "":QS.stringify(configs.query);
	configs.path = ((configs.path===undefined)? "/":configs.path) + ((configs.query.length > 0)? ( ((configs.path.indexOf("?") == -1)? "?":"") +  "&" + configs.query):"");
	configs.protocol = (configs.protocol===undefined)? "http":configs.protocol;
	configs.scope = (configs.scope === undefined)? {}:configs.scope;
	configs.method = (configs.method===undefined)? "GET":configs.method;	
	configs.rawdata = (configs.rawdata===undefined)? "":configs.rawdata;
	configs.formdata = (configs.formdata===undefined)? undefined:configs.formdata;
	configs.cookiefile = (configs.cookiefile===undefined)? "":configs.cookiefile;
	configs.cookies = (configs.cookies===undefined)? {}:configs.cookies;
	configs.headers = (configs.headers===undefined)? {}:configs.headers;
	configs.encoding = (configs.encoding===undefined)? "utf-8":configs.encoding;
    configs.callback = (configs.callback===undefined)? new Function():configs.callback;
	configs.onsend = (configs.onsend===undefined)? new Function():configs.onsend;
	configs.onsuccess = (configs.onsuccess===undefined)? new Function():configs.onsuccess;
	configs.ondata = (configs.ondata===undefined)? new Function():configs.ondata;
	configs.onredirect = (configs.onredirect===undefined)? new Function():configs.onredirect;
	configs.onerror = (configs.onerror===undefined)? new Function():configs.onerror;
	configs.onhead = (configs.onhead===undefined)? new Function():configs.onhead;
	configs.onend = (configs.onend===undefined)? new Function():configs.onend;
	configs.onsocket = (configs.onsocket===undefined)? new Function():configs.onsocket;
	configs.onconnect = (configs.onconnect===undefined)? new Function():configs.onconnect;
	configs.onupgrade = (configs.onupgrade===undefined)? new Function():configs.onupgrade;
	configs.oncontinue = (configs.oncontinue===undefined)? new Function():configs.oncontinue;
	configs.timeout = (configs.timeout===undefined)? undefined:configs.timeout;
	configs.auth = (configs.auth===undefined)? undefined:configs.auth;
	configs.oauth = (configs.oauth===undefined)? undefined:configs.oauth;
	configs.downloadmode = (configs.downloadmode===undefined)? false:configs.downloadmode;
	configs.downloadas = (configs.downloadas===undefined)? ( (configs.downloadmode)? configs.path.split("/")[configs.path.split("/").length - 1]:configs.downloadas ):configs.downloadas;
	configs.downloadpath = (configs.downloadpath===undefined)? "./":configs.downloadpath;
	configs.pipestream = (configs.pipestream===undefined)? undefined:configs.pipestream;
	configs.follow = (configs.follow===undefined)? true:configs.follow;
	configs.maxfollow = (configs.maxfollow===undefined)? 10:configs.maxfollow;
	configs._followCount = (configs._followCount===undefined)? 0:(configs._followCount + 1);
	configs.globalcookies = {};
	configs.cookiename = configs.protocol + "://" + configs.hostname + ":" + configs.port;
	configs.globalcookies[configs.cookiename] = {};
	if (typeof(configs.cookiefile) === "string") {
		if (configs.cookiefile.length > 0 && configs._followCount < configs.maxfollow) {			
			try {
				configs.globalcookies = JSON.parse(Fs.readFileSync(configs.cookiefile));
			} catch (e) {}
		}
	} else {}
	// Merge with given cookies config
	for (var i in configs.cookies) {
		configs.globalcookies[configs.cookiename][i] = configs.cookies[i];
	}
	// Parse cookie object to cookie header string
	configs.headers.Cookie = [];
	for (var i in configs.globalcookies[configs.cookiename]) {
		if (typeof(configs.globalcookies[configs.cookiename][i]) == "string") {
			configs.headers.Cookie.push(configs.globalcookies[configs.cookiename][i]);
		} else {
			var cookie = [];
			cookie.push(i + "=" + configs.globalcookies[configs.cookiename][i].value);
			if (configs.globalcookies[configs.cookiename][i].path !== undefined) {
				cookie.push("Path=" + configs.globalcookies[configs.cookiename][i].path);
			}
			if (configs.globalcookies[configs.cookiename][i].expires !== undefined) {
				cookie.push("Path=" + configs.globalcookies[configs.cookiename][i].expires);
			}
			if (configs.globalcookies[configs.cookiename][i]["max-age"] !== undefined) {
				cookie.push("Path=" + configs.globalcookies[configs.cookiename][i]["max-age"]);
			}
			if (configs.globalcookies[configs.cookiename][i].domain !== undefined) {
				cookie.push("Path=" + configs.globalcookies[configs.cookiename][i].domain);
			}
			if (configs.globalcookies[configs.cookiename][i].commenturl !== undefined) {
				cookie.push("Path=" + configs.globalcookies[configs.cookiename][i].commenturl);
			}
			if (configs.globalcookies[configs.cookiename][i].secure) {
				cookie.push("Secure");
			}
			if (configs.globalcookies[configs.cookiename][i].httponly) {
				cookie.push("HttpOnly");
			}
			if (configs.globalcookies[configs.cookiename][i].discard) {
				cookie.push("Discard");
			}
			configs.headers.Cookie.push(cookie.join(";"));
		}
	}
	if (configs.auth !== undefined) {
		configs.headers['Authorization'] = 'Basic '+new Buffer(configs.auth.username + ':' + configs.auth.password).toString('base64');
		configs.auth = configs.auth.username + ':' + configs.auth.password;
	}
	if (configs.oauth !== undefined) {
		var allowedChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
		var timestamp = Math.ceil((new Date()).getTime()/1000);
		var nonce = '';
		for (var i=0; i < 32; i++) {
			var rnum = Math.floor(Math.random() * allowedChars.length);
			nonce += allowedChars.substring(rnum,rnum+1);
		};
		configs.oauth.signature_method = (configs.oauth.signature_method === undefined)? "HMAC-SHA1":configs.oauth.signature_method;
		configs.oauth.oauth_token_version = (configs.oauth.oauth_token_version === undefined)? "1.0":configs.oauth.oauth_token_version;
		var oauthData = { 
			oauth_consumer_key: configs.oauth.consumer_key, 
			oauth_nonce: nonce, 
			oauth_signature_method: configs.oauth.signature_method, 
			oauth_timestamp: timestamp, 
			oauth_token: configs.oauth.access_token, 
			oauth_version: configs.oauth.oauth_token_version
		};
		var sigData = {};
		for (var k in oauthData){
			sigData[k] = oauthData[k];
		}
		var oauthURL = configs.protocol + "://" + configs.hostname + ((configs.port.length == 0)? "":":" + configs.port) + configs.path;
		// somehow including port will cause error, so ignore for now
		var oauthURL = configs.protocol + "://" + configs.hostname + configs.path;
		
		var sig = generateOAuthSignature(configs.method, oauthURL, sigData, configs.oauth.consumer_secret, configs.oauth.token_secret);
		oauthData.oauth_signature = sig;
		var oauthHeader = "";
		for (var k in oauthData){
			oauthHeader += ", " + encodeURIComponent(k) + "=\"" + encodeURIComponent(oauthData[k]) + "\"";
		}
		oauthHeader = oauthHeader.substring(1);
		configs.headers['Authorization'] = "OAuth" + oauthHeader;
	}
	if (configs.formdata !== undefined) {
		configs.method = "POST";
		configs.headers['Content-Type'] = "application/x-www-form-urlencoded; charset=UTF-8";
		for (var i in configs.formdata) {
			if (configs.formdata[i] instanceof File) {
				configs.method = "POST";
				configs._boundaryKey = "WebKitFormBoundary" + (Math.random() * 1000000000000000).toString(16);
				configs.headers['Content-Type'] = 'multipart/form-data; boundary="' + configs._boundaryKey + '"';
				configs._isUploadForm = true;
				break;
			}
		}
		if (configs._isUploadForm) {
			var formbufferarray = [];
			for (var i in configs.formdata) {
				var formdatastr = "";
				if (configs.formdata[i] instanceof File) {
					var filename = configs.formdata[i].path.replace(/.+\//gi, "");
					formdatastr = '--' + configs._boundaryKey + '\r\n' +
						 'Content-Disposition: form-data; name="' + i + '"; filename="' + filename + '"\r\n' +
						 'Content-Type: ' + configs.formdata[i].mime + '\r\n\r\n';
					formbufferarray.push(new Buffer(formdatastr, 'ascii'));
					formbufferarray.push(new Buffer(configs.formdata[i].contents, 'utf8'));
				} else {
					formdatastr = '--' + configs._boundaryKey + '\r\n' +
						 'Content-Disposition: form-data; name="' + i + '"\r\n\r\n' +
						 configs.formdata[i] + '\r\n';
					formbufferarray.push(new Buffer(formdatastr, 'ascii'));
				}
			}
			var formdatastr = '--' + configs._boundaryKey + '--';
			formbufferarray.push(new Buffer(formdatastr, 'ascii'));
			configs.headers['Content-Length'] = formdatastr.length;
			// Fs.writeFileSync("./_uploadtemp", formdatastr);
			configs.formdata = formbufferarray
		} else {
			configs.formdata = [new Buffer(QS.stringify(configs.formdata), 'utf-8')];
		}
	}
	var length = 0;
	for(var i in configs.formdata) {
		length += configs.formdata[i].length;
	}
	configs.headers['Content-Length'] = length;
	return configs;
}

function createSendOption(protocol, configs){
	// Prepare sendoptions
	var Agent = new protocol.Agent();
	Agent.maxSockets = 1;
	var sendoptions = {
		host: undefined, 				// A domain name or IP address of the server to issue the request to. Defaults to 'localhost'.
		hostname: configs.hostname, 	//To support url.parse() hostname is preferred over host
		port: configs.port, 			// Port of remote server. Defaults to 80.
		localAddress: undefined, 		// Local interface to bind for network connections.
		socketPath: undefined, 			// Unix Domain Socket (use one of host:port or socketPath)
		method: configs.method, 		// A string specifying the HTTP request method. Defaults to 'GET'.
		path: configs.path, 			// Request path. Defaults to '/'. Should include query string if any. E.G. '/index.html?page=12'
		headers: configs.headers, 		// An object containing request headers.
		auth: configs.auth, 			// Basic authentication i.e. 'user:password' to compute an Authorization header.
		agent: Agent					// Controls Agent behavior. When an Agent is used request will default to Connection: keep-alive
	};
	if (configs.downloadmode) {
		if (configs.downstream === undefined) {
			// If not ready get head information
			sendoptions.method = "HEAD";
		} else {
			// Send sendoptions as configured
		}		
	}
	return sendoptions;
}

function getProtocol(configs){
	var protocol;
	switch (configs.protocol.toLowerCase()) {
		case "https" :
			protocol = HTTPS;
			configs.agent = new protocol.Agent(configs);
		break;
		default :
			protocol = HTTP;
		break;
	}
	return protocol;
} 

function createRequest(protocol, sendoptions, configs){	
	var request = protocol.request(sendoptions);
	request.on('response', function(response) {	
		// Merge with old cookies
		for (var i in configs.cookies) {
			configs.globalcookies[configs.cookiename][i] = configs.cookies[i];
		}
		// Parse cookie string to cookie object, this must be handled first!
		var responsecookie = response.headers['set-cookie'] || response.headers['Set-Cookie'];
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
				configs.globalcookies[configs.cookiename][responsecookiename] = responsecookieobject[i];
			}
		}
		// Return cookies, anything happened!
		response.cookies = configs.globalcookies[configs.cookiename];
		// Write cookies to file
		if (typeof(configs.cookiefile) === "string") {
			if (configs.cookiefile.length > 0) {
				try {
					Fs.writeFileSync(configs.cookiefile, JSON.stringify(configs.globalcookies, null, 4));
				} catch (e) {}
			}
		}
		// HTTP Error handler
		if (response.statusCode >= 400) {
            request._response_error = new Error(response.statusCode);
		}
		// HTTP Redirect, 301, 302
		if (response.statusCode == 301 || response.statusCode == 302) {
			if (response.headers.location !== undefined && configs.follow && configs._followCount < configs.maxfollow) {
				var oldurl = configs.url;
				configs.url = response.headers.location;
				configs.method = "GET";
				configs.cookies = response.cookies;
				configs.headers.Referer = oldurl;
				configs.onredirect.apply(configs.scope, [request, response, configs]);
				configs = parseConfig(configs);
				sendoptions = createSendOption(protocol, configs);
				var newrequest = createRequest(protocol, sendoptions, configs);
				sendRequest(newrequest, configs);
				return;
			} else {
                request._response_error = new Error(response.statusCode);
			}
		}
		if (configs.downloadmode) {
			// check if is ready
			if (configs.downstream === undefined) {
				var filesize = parseInt( (response.headers['content-length'] === undefined)? 0:response.headers['content-length'] );
				// Get HEAD data unless we do this,
				response.on('data', function(){
				});
				response.on('end', function(){
					var fstat = null;
					var startbyte;
					try {
						fstat = Fs.statSync(configs.downloadpath + configs.downloadas);
					} catch (e) {}
					if (fstat == null) {
						startbyte = 0;
					} else {
						startbyte = fstat.size;
					}
					var file = Fs.createWriteStream(configs.downloadpath + configs.downloadas, {'flags': 'a+'});
					if (startbyte >= filesize) {
						if (filesize > 0) {
                            configs.callback.apply(configs.scope, [undefined, file]);
							configs.onsuccess.apply(configs.scope, [file, request, response, configs]);
                            configs.onend.apply(configs.scope, [request, configs])
							return false;
						} else {
							// Continue process if content-length got from HEAD return 0
							// It might be server fault, or server disallow resume download
							// in this case, reset download from 0
							startbyte = 0;
						}
					}
					if (filesize > 0) {
						configs.headers['range'] = "bytes=" + startbyte + '-' ;
					}
					configs.downstream = file;
					var sendoptions = createSendOption(protocol, configs);
					configs.onhead.apply(configs.scope, [fstat, request, response, configs]);					
					var newrequest = createRequest(protocol, sendoptions, configs);
					sendRequest(newrequest, configs);
				});
				// Skip next event
				return;
			} else {
				response.pipe(configs.downstream);
			}
		}
		if (configs.pipestream !== undefined) {
			response.pipe(configs.pipestream);
		} else {
			if (configs.downstream === undefined) {
				// Do not set encoding if will pipe response
				response.setEncoding(configs.encoding);
			}			
		}
		var resultdata = "";
		response.on('data', function (chunk) {
			resultdata += chunk;
			configs.ondata.apply(configs.scope, [chunk, request, response, configs]);
		});
		response.on('end', function () {
            configs.callback.apply(configs.scope, [request._response_error, resultdata]);
			configs.onsuccess.apply(configs.scope, [resultdata, request, response, configs]);
			configs.onend.apply(configs.scope, [request, configs])
		});
	});
	request.on('error', function(e) {
        configs.callback.apply(configs.scope, [e]);
		configs.onerror.apply(configs.scope, [e, request, configs]);
		configs.onend.apply(configs.scope, [request, configs]);
	});
	request.on('socket', function(socket) {
		configs.onsocket.apply(configs.scope, [socket, request, configs]);
	});
	request.on('connect', function(response, socket, head) {
		configs.onconnect.apply(configs.scope, [request, response, socket, head, configs]);
	});
	request.on('upgrade', function(response, socket, head) {
		configs.onupgrade.apply(configs.scope, [request, response, socket, head, configs]);
	});
	request.on('continue', function(response, socket, head) {
		configs.oncontinue.apply(configs.scope, [request, configs]);
	});
	return request;
}

function sendRequest(request, configs){
	var trigeronsend = true;;
	if (configs.downloadmode) {
		if (configs.downstream === undefined) {
			// If not ready do normally			
		} else {
			// Do not re-trigger onsend event
			trigeronsend = false;
		}		
	}
	if (trigeronsend) {
		configs.onsend.apply(configs.scope, [request, configs]);
	}	
	if (configs.timeout !== undefined) {
		request.setTimeout(configs.timeout, function(){
			request.abort();
		});
	}
	if (configs.formdata !== undefined) {
		if (!(configs.formdata instanceof Array)) {
			configs.formdata = [configs.formdata];
		}
		for (var i in configs.formdata) {
			//process.stdout.write(configs.formdata[i].toString())
			request.write(configs.formdata[i]);
		}		
	} else {
		request.write(configs.rawdata);
	}
	request.end();
}

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

module.exports = jswget;
