// simply forward image to browser
var
	request = require('request'),
	url = require('url');

module.exports = function(req, res){
	var queryData = url.parse(req.url,true).query;
	if (req.headers['if-none-match']) { // hope they will never change
		res.statusCode = 304;
		res.end();
	} else {
		// proxy image (because of stupid referrer-check)
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
