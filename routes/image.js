
/*
 * GET home page.
 */

var
//	util = require('util'),
//	http = require('http'),
	request = require('request'),
//	Cookies = require('cookies'),
//	https = require('https'),
//	fs = require('fs'),
	url = require('url');
//	async = require('async');
//	mustache = require('mustache'),
//	path = require('path');



module.exports = function(req, res){
	var queryData = url.parse(req.url,true).query;
	if (req.headers['if-none-match']) { // hope they will never change
		res.statusCode = 304;
		res.end();
	} else {
		// proxy image (because of stupid referrer-check
		try {
			request.get(queryData.url).pipe(res);
		} catch (e) {
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.write('404 Not Found: '+queryData.url+'\n');
			res.end();
			return;
		}
	}
};
