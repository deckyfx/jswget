var QS = require('querystring');
var Fs = require('fs');
var HTTP = require('http');
var HTTPS = require('https');

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
	 *   uploadfile         #STRING file path to be uploaded, upload file work only when downlloadmode = false, and no other form is uploaded
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
	var configs = parseConfig(arguments[0]),
		protocol = getProtocol(configs),
		sendoptions = createSendOption(protocol, configs),
		request = createRequest(protocol, sendoptions, configs);
	sendRequest(request, configs);	
};

function parseConfig(){
	var configs = {};
	if (arguments.length == 0) {
		return;
	}
	if (typeof(arguments[0]) == "object") {
		configs = arguments[0];
	}
	if (typeof(arguments[0]) == "string") {
		configs.url = arguments[0];
	}
	if (arguments[1] !== undefined && typeof(arguments[1]) == "function") {
		configs.onsuccess = arguments[1];
	}
	configs.url = (configs.url === undefined)? "":configs.url;
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
		configs.hostname = configs.hostname.split(":");
		configs.port = (configs.hostname[1] === undefined)? ((configs.protocol=="http")? 80:443):configs.hostname[1];
		configs.hostname = configs.hostname[0];
	} else {
		return;
	}
	configs.hostname = (configs.hostname===undefined)? "127.0.0.1":configs.hostname;
	configs.port = (configs.port===undefined)? 80:configs.port;
	configs.query = (configs.query===undefined)? "":QS.stringify(configs.query);
	configs.path = ((configs.path===undefined)? "/":configs.path) + ((configs.query.length > 0)? ("?" + configs.query):"");
	configs.protocol = (configs.protocol===undefined)? "http":configs.protocol;
	configs.scope = (configs.scope === undefined)? {}:configs.scope;
	configs.method = (configs.method===undefined)? "GET":configs.method;	
	configs.rawdata = (configs.rawdata===undefined)? "":configs.rawdata;
	configs.formdata = (configs.formdata===undefined)? undefined:QS.stringify(configs.formdata);    
	configs.cookiefile = (configs.cookiefile===undefined)? "":configs.cookiefile;
	configs.cookies = (configs.cookies===undefined)? []:configs.cookies;
	configs.headers = (configs.headers===undefined)? {}:configs.headers;
	configs.encoding = (configs.encoding===undefined)? "utf-8":configs.encoding;
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
	configs.downloadas = (configs.downloadas===undefined)? configs.path.split("/")[configs.path.split("/").length - 1]:configs.downloadas;
	configs.downloadpath = (configs.downloadpath===undefined)? "./":configs.downloadpath;
	configs.uploadfile = (configs.uploadfile===undefined)? false:configs.uploadfile;
	configs.pipestream = (configs.pipestream===undefined)? undefined:configs.pipestream;
	configs.follow = (configs.follow===undefined)? true:configs.follow;
	configs.maxfollow = (configs.maxfollow===undefined)? 10:configs.maxfollow;
	configs._followCount = (configs._followCount===undefined)? 0:(configs._followCount + 1);
	configs.globalcookies = {};
	configs.cookiename = configs.protocol + "://" + configs.hostname + ":" + configs.port;
	configs.globalcookies[configs.cookiename] = {};
	if (typeof(configs.cookiefile) === "string") {
		if (configs.cookiefile.length > 0 && configs.followCount < configs.maxfollow) {
			try {
				configs.globalcookies = JSON.parse(Fs.readFileSync(configs.cookiefile));
			} catch (e) {}
		}
	} else {}
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
	if (configs.uploadfile != false) {		
		configs.method = "POST";
		var boundaryKey = Math.random().toString(16);
		var fileName = configs.uploadfile.replace(/.+\//gi, "");
		configs.headers['Content-Type'] = 'multipart/form-data; boundary="'+boundaryKey+'"';		
		configs.formdata = configs.formdata
		var form = QS.parse(configs.formdata);
		var formdata = "";
		for (i in form) {
			formdata += '--' + boundaryKey + '\r\n'
					 + 'Content-Disposition: form-data; name="'+i+'"\r\n\r\n'
					 + form[i] + '\r\n';
		}
		configs.formdata  = formdata 
						  + '--' + boundaryKey + '\r\n'
						  + 'Content-Type: application/octet-stream\r\n' 
						  + 'Content-Disposition: form-data; name="FILE_UPLOADED"; filename="'+fileName+'"\r\n'
						  + 'Content-Transfer-Encoding: binary\r\n\r\n';
	} else {		
		if (configs.formdata !== undefined) {			
			configs.method = "POST";
			configs.headers['Content-Length'] = configs.formdata.length;
			configs.headers['Content-Type'] = "application/x-www-form-urlencoded; charset=UTF-8";
		}
	}	
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
		configs.globalcookies[configs.cookiename] = configs.cookies;
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
					Fs.writeFileSync(configs.cookiefile, JSON.stringify(configs.globalcookies));
				} catch (e) {}
			}
		}
		// HTTP Error handler
		if (response.statusCode >= 400) {
			configs.onerror.apply(configs.scope, [response.statusCode, request, configs]);
			configs.onend.apply(configs.scope, [request, configs]);
			return;
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
				console.log(configs.url);
				sendRequest(newrequest, configs);
				return;
			} else {
				configs.onerror.apply(configs.scope, [response.statusCode, request, configs]);
				configs.onend.apply(configs.scope, [request, configs]);
				return;
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
				// Skip nect event
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
			configs.onsuccess.apply(configs.scope, [resultdata, request, response, configs]);
			configs.onend.apply(configs.scope, [request, configs])
		});
	});
	request.on('error', function(e) {
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
		request.write(configs.formdata);
	} else {
		request.write(configs.rawdata);
	}
	if (configs.uploadfile != false) {
		Fs.createReadStream(configs.uploadfile, { bufferSize: 4 * 1024 }).on('end', function() {
			request.write('\r\n--' + boundaryKey + '--');
			request.end();
		}).pipe(request, { end: false });
	} else {
		request.end();
	}
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
