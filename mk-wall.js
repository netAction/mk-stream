var
	util = require('util'),
	http = require('http'),
	request = require('request'),
	Cookies = require('cookies'),
	https = require('https'),
	fs = require('fs'),
	url = require('url'),
	async = require('async'),
	mustache = require('mustache');

// Send name/password to MK server, get cookies back and forward them to browser
function getCookies(username, password, cookies, callback) {
	var j = request.jar(); // cookie jar
	request(
		{
			method:'POST',
			url:'http://www.model-kartei.de/login.php',
			form:{uid:username,pw:password,utype:'1'},
			jar: j
		},
		function (error, response, body) {
			var userId = 1;
			j.cookies.forEach(function(cookie) {
				cookies.set(cookie.name, cookie.value, {expires:new Date(2030,1,1,0,0,0,0)});
				if (cookie.name == 'mk4_userid') userId = 0; // no error
			});
			callback(0,userId);
	});
} // getCookies



function getFavourites(cookies,pageUrl,callback) {
	var j = request.jar();
	j.add(request.cookie('mk4_userid='+cookies.get('mk4_userid')));
	j.add(request.cookie('mk4_userpw='+cookies.get('mk4_userpw')));

	request(
		{
			method:'GET',
			url:pageUrl,
			jar: j
		},
		function (error, response, body) {
			body = body.split('https://www.model-kartei.de/bilder/bild/');
			body.splice(0,1); // remove first element
			var images = [];
			body.forEach(function(image){
				image = image.split('src="');
				var imageNumber = image[0].split('/"');
				imageNumber = imageNumber[0];
				image = image[1].split('.jpg"');
				var thumbUrl = image[0]+'.jpg';
				image = image[1].split('</a>');
				image = image[1].split('>');
				userName = image[image.length-1];
				images.push({imageNumber:imageNumber,thumbUrl:thumbUrl,userName:userName});
			});
			callback(0,images);
	});
} // getFavourites


function displaySite(res,imagesContainer) {
	var images = [];
	images = images.concat(imagesContainer[0],imagesContainer[1]);
	var view = { favouriteImages:images };

	res.writeHead(200, { 'Content-Type': 'text/html' });
	var template = fs.readFileSync('template.html','utf8');
	res.end(mustache.render(template, view));
} // displaySite

/* var options = {
  key: fs.readFileSync('netaction.key'),
  cert: fs.readFileSync('netaction.crt')
}; */

// https.createServer(options, function (req, res) {
http.createServer(function (req, res) {
	var cookies = new Cookies(req, res);
	var queryData = url.parse(req.url,true).query;
	if (queryData.thumbUrl) {
		// proxy image (because of stupid referrer-check
		request.get(queryData.thumbUrl).pipe(res);
	} else if (queryData.imageNumber) {
		// get big image
		var j = request.jar();
		j.add(request.cookie('mk4_userid='+cookies.get('mk4_userid')));
		j.add(request.cookie('mk4_userpw='+cookies.get('mk4_userpw')));

		request({jar:j,
			url:'https://www.model-kartei.de/bilder/bild/'+queryData.imageNumber+'/'},
			function(error, response, body) {
				imageUrl = body.split('id="bild"');
				imageUrl = imageUrl[1].split('src="');
				imageUrl = imageUrl[1].split('"');
				imageUrl = imageUrl[0];
				request.get(imageUrl).pipe(res);
		});
	} else if (cookies.get('mk4_userid') && cookies.get('mk4_userpw')) {
		async.series([
			function(callback){
				getFavourites(cookies,'https://www.model-kartei.de/bilder/favoriten/',callback);
			},
			function(callback){
				getFavourites(cookies,'https://www.model-kartei.de/bilder/favoriten/1/',callback);
			}
			],
			function(error,images){
				displaySite(res,images);
			}
		);
	} else {
		var header=req.headers['authorization']||'',      // get the header
			token=header.split(/\s+/).pop()||'',            // and the encoded auth token
			auth=new Buffer(token, 'base64').toString(),    // convert from base64
			parts=auth.split(/:/),                          // split on colon
			username=parts[0],
			password=parts[1];
			if (username && password) {
			async.waterfall([
				function(callback){
					getCookies(username, password, cookies, callback);
				},
				function(error,callback){
					if (error) {
						res.statusCode = 401;
						res.setHeader('WWW-Authenticate', 'Basic realm="MK-Login"');
						res.write("Gibt die Daten von deinem MK-Login ein!");
						res.end();
					} else {
						res.writeHead(302, {'Location': '/'});
						res.end();
					}
				}
			]);
		} else {
			res.statusCode = 401;
			res.setHeader('WWW-Authenticate', 'Basic realm="MK-Login"');
			res.write("Gibt die Daten von deinem MK-Login ein!");
			res.end();
		}
	}
}).listen(8003);

