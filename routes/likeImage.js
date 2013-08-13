var
	request = require('request'),
	url = require('url'),
	login = require('./login');


module.exports = function(req, res){
	var logindata = login.login(req,res);
	if (!logindata) return;

	var j = request.jar();
	j.add(request.cookie('mk4_userid='+logindata.userid));
	j.add(request.cookie('mk4_userpw='+logindata.userpw));

	var queryData = url.parse(req.url,true).query;
	request(
		{
			method:'POST',
			url:'https://www.model-kartei.de/js/p/flpic.php',
			form:{pid:queryData.imageNumber,typus:'love',ds9:queryData.ds9},
			jar: j
		},
		function (error, response, body) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.write(JSON.stringify({ok:true}));
			res.end();
		}
	);
}
