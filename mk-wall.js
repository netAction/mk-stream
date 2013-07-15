// MK-Wall 2013 by Thomas netAction Schmidt
// License: Do the fuck you want!
// Page: http://mk-stream.netaction.de/
// Sources: https://github.com/netAction/mk-stream

var
	util = require('util'),
	http = require('http'),
	request = require('request'),
	Cookies = require('cookies'),
	https = require('https'),
	fs = require('fs'),
	url = require('url'),
	async = require('async'),
	mustache = require('mustache'),
	path = require('path');

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
	// TODO: Get Private Message status
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
			callback(0,{favouriteImages:images});
	});
} // getFavourites


function getJobs(cookies,pageUrl,callback) {
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
			body = body.split('class="bg');
			body.splice(0,1); // remove first element
			var jobs = [];
			body.forEach(function(job){
				var jobNumber = job.split('href="https://www.model-kartei.de/jobs/');
				jobNumber = jobNumber[1].split('-0-');
				jobNumber = jobNumber[0];

				var jobTitle = job.split('title="');
				jobTitle = jobTitle[1].split('">');
				jobTitle = jobTitle[0];

				var userSedcard = job.split('https://www.model-kartei.de/sedcards');
				userSedcard = userSedcard[1].split('/" ');
				userSedcard = 'https://www.model-kartei.de/sedcards'+userSedcard[0];

				var userName = job.split('https://www.model-kartei.de/sedcards');
				userName = userName[1].split('title="');
				userName = userName[1].split('">');
				userName = userName[0];

				jobs.push({
					jobNumber: jobNumber,
					jobTitle: jobTitle,
					userSedcard: userSedcard,
					userName: userName
				});
			});
			callback(0,{jobs:jobs});
	});
} // getRadarJobs


function displaySite(res,data) {
	var view = {
		favouriteImages:[],
		jobs:[]
	};

	var images = [];
	view.favouriteImages = images.concat(data[0].favouriteImages,data[1].favouriteImages);
	view.favouriteImages.sort(function(a,b){
		if (a.imageNumber > b.imageNumber) return -1;
		if (a.imageNumber < b.imageNumber) return 1;
		return 0;
	});

	var jobs = [];
	view.jobs = images.concat(
		data[2].jobs,
		data[3].jobs,
		data[4].jobs,
		data[5].jobs
		);
	view.jobs.sort(function(a,b){
		if (a.jobNumber > b.jobNumber) return -1;
		if (a.jobNumber < b.jobNumber) return 1;
		return 0;
	});


	res.writeHead(200, { 'Content-Type': 'text/html' });
	var template = fs.readFileSync('template.html','utf8');
	res.end(mustache.render(template, view));
} // displaySite


function sendStaticFile(req,res) {
	// taken from: http://stackoverflow.com/questions/7268033/basic-static-file-server-in-nodejs
	var uri = url.parse(req.url).pathname;
	var filename = path.join(process.cwd(), unescape(uri));
	var stats;

	try {
		stats = fs.lstatSync(filename); // throws if path doesn't exist
	} catch (e) {
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.write('404 Not Found\n');
		res.end();
		return;
	}


	var mimeTypes = {
		"html": "text/html",
		"jpeg": "image/jpeg",
		"jpg": "image/jpeg",
		"png": "image/png",
		"js": "text/javascript",
		"css": "text/css"};

	if (stats.isFile()) {
		// path exists, is a file
		var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
		res.writeHead(200, {'Content-Type': mimeType} );

		var fileStream = fs.createReadStream(filename);
		fileStream.pipe(res);
	} else if (stats.isDirectory()) {
		// path exists, is a directory
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write('Index of '+uri+'\n');
		res.write('TODO, show index? Too lazy!\n');
		res.end();
	} else {
		// Symbolic link, other?
		// follow symlinks?  security?
		res.writeHead(500, {'Content-Type': 'text/plain'});
		res.write('500 Internal server error\n');
		res.end();
	}
}


/* var options = {
  key: fs.readFileSync('netaction.key'),
  cert: fs.readFileSync('netaction.crt')
}; */

// https.createServer(options, function (req, res) {
http.createServer(function (req, res) {
	var cookies = new Cookies(req, res);
	var queryData = url.parse(req.url,true).query;
	if ((req.url.indexOf("/browser_modules") !== -1) || (req.url.indexOf("/favicon.ico") !== -1)) {
		sendStaticFile(req,res);
	} else if (queryData.thumbUrl) {
		if (req.headers['if-none-match']) { // hope they will never change
			res.statusCode = 304;
			res.end();
		} else {
			// proxy image (because of stupid referrer-check
			try {
				request.get(queryData.thumbUrl).pipe(res);
			} catch (e) {
				res.writeHead(404, {'Content-Type': 'text/plain'});
				res.write('404 Not Found\n');
				res.end();
				return;
			}
		}
	} else if (queryData.imageNumber) {
		if (req.headers['if-none-match']) { // hope they will never change
			res.statusCode = 304;
			res.end();
		} else {
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
		}
	} else if (cookies.get('mk4_userid') && cookies.get('mk4_userpw')) {
		async.series([
			function(callback){
				getFavourites(cookies,'https://www.model-kartei.de/bilder/favoriten/',callback);
			},
			function(callback){
				getFavourites(cookies,'https://www.model-kartei.de/bilder/favoriten/1/',callback);
			},
			function(callback){ // Radar 1. Seite
				getJobs(cookies,'https://www.model-kartei.de/index.php?p=radar&t=25',callback);
			},
			function(callback){ // Radar 2. Seite
				getJobs(cookies,
					'https://www.model-kartei.de/index.php?p=radar&t=25&show=line&l=0&s=1',callback);
			},
			function(callback){ // NetzwerkJobs
				getJobs(cookies,'https://www.model-kartei.de/index.php?p=neues&show=2',callback);
			},
			function(callback){ // FavoritenJobs
				getJobs(cookies,'https://www.model-kartei.de/index.php?p=neues&show=6',callback);
			}
			],
			function(error,results){
				displaySite(res,results);
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
						res.setHeader('WWW-Authenticate', 'Basic realm="Bitte MK-Login eingeben."');
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

