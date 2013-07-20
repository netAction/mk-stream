var
	request = require('request'),
	url = require('url'),
	login = require('./login');
//	fs = require('fs'),
//	async = require('async');


module.exports = function(req, res){
	if (req.headers['if-none-match']) { // hope they will never change
		res.statusCode = 304;
		res.end();
		return;
	}

	var logindata = login(req,res);
	if (!logindata) return;

	// get big image
	var j = request.jar();
	j.add(request.cookie('mk4_userid='+logindata.userid));
	j.add(request.cookie('mk4_userpw='+logindata.userpw));

	var queryData = url.parse(req.url,true).query;
	request({jar:j,
		url:'https://www.model-kartei.de/bilder/bild/'+queryData.imageNumber+'/'},
		function(error, response, body) {
			try {
				imageMetadata = {};
				var imageUrl = body.split('id="bild"');
				imageUrl = imageUrl[1].split('src="');
				imageUrl = imageUrl[1].split('"');
				imageUrl = imageUrl[0];
				imageMetadata.url = imageUrl;

				var likeCount = body.split('Personen die dieses Bild gro&szlig;artig finden">');
				likeCount = likeCount[1].split('</a>');
				likeCount = likeCount[0];
				imageMetadata.likeCount = likeCount;

				var iLikeThis = body.split('title="Klicke hier wenn dir das Bild nicht mehr gef&auml;llt">Doch nicht so toll</a>');
				imageMetadata.iLikeThis = (iLikeThis.length>1);

				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(JSON.stringify(imageMetadata));
				res.end();
			} catch (e) {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(JSON.stringify({error:true}));
				res.end();
			} 
	});
}

