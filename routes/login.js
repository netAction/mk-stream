var Cookies = require('cookies');

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

module.exports = function(req,res) {
	var cookies = new Cookies(req, res);

	if (cookies.get('mk4_userid') && cookies.get('mk4_userpw')) {
		return({
			userid:cookies.get('mk4_userid'),
			userpw:cookies.get('mk4_userpw')
		});
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
		return false;
	}
}
