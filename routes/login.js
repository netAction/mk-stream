var
	request = require('request');


module.exports.logout = function(req,res) {
	res.clearCookie('mk4_userpw');
	res.render('login',{logout:true});
} // logout

module.exports.login = function(req,res) {
	// Test wrong password:
	//res.cookie('mk4_userpw', 'XXX', { maxAge: 3600000*24*356 }); res.render('login',{}); return;

	if (req.cookies.mk4_userid && req.cookies.mk4_userpw) { // already logged in
		return {
			userid:req.cookies.mk4_userid,
			userpw:req.cookies.mk4_userpw
		};
	} else if(req.body.userid && req.body.userpw) { // name/password given via HTTP POST
		// Send name/password to MK server, get cookies back and forward them to browser
		var j = request.jar(); // cookie jar
		request(
			{
				method:'POST',
				url:'http://www.model-kartei.de/login.php',
				form:{uid:req.body.userid,pw:req.body.userpw,utype:'1'},
				jar: j
			},
			function (error, response, body) {
				var userId = 0;
				j.cookies.forEach(function(cookie) {
					res.cookie(cookie.name, cookie.value, { maxAge: 3600000*24*356 });
					if (cookie.name == 'mk4_userid') userId = 1; // no error
				});

				if (userId) { // reload on success
					res.writeHead(302, {'Location': '/'});
					res.end();
				} else { // Password wrong
					res.render('login',{userid : req.body.userid, wrongPassword : true});
				}
			}
		);
	} else { // completely new user
		if (req.body.userid) {
			res.render('login',{userid : req.body.userid});
		} else {
			res.render('login',{});
		}
	}
} // login

