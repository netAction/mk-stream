var
	request = require('request'),
	login = require('./login'),
	fs = require('fs'),
	url = require('url'),
	async = require('async'),
	fetchGlobalInfos = require('./fetchGlobalInfos');



module.exports = function(req, res){
	var logindata = login(req,res);
	if (!logindata) return;

	var queryData = url.parse(req.url,true).query;

	// TODO: Get Private Message status
	var j = request.jar();
	j.add(request.cookie('mk4_userid='+logindata.userid));
	j.add(request.cookie('mk4_userpw='+logindata.userpw));

	request(
		{
			method:'GET',
			url:'https://www.model-kartei.de/sedcards/'+queryData.urlpart,
			jar: j
		},
		function (error, response, body) {
			try {
				var view = fetchGlobalInfos(body);
				view.images = [];

				var userName = body.split('<h1>');
				userName = userName[1].split('</h1>');
				view.userName = userName[0];

				var descriptionText = body.split('<div class="maintextcell"');
				if (descriptionText.length>1) {
					descriptionText = descriptionText[1].split('px;">');
					descriptionText = descriptionText[1].split('</div>');
					descriptionText = descriptionText[0].split('<div');
					view.descriptionText = descriptionText[0];
				} else {
					descriptionText = false;
				}

				var images = body.split('<div class="pici">');
				images.splice(0,1); // remove first element
				images.forEach(function(image){
// <a id="p12592261" name="p12592261" href="https://www.model-kartei.de/bilder/bild/12592261/"><img alt="" border="0" height="180" src="https://img9.model-kartei.de/f/z/7825/12592261.jpg" title="" width="127" /></a></div><div class="nfo"><span title="48 Kommentare, vor 3 Stunden"><b>48</b><code></code></span></div></div><div class="pic superpic">
					var imageNumber = image.split('https://www.model-kartei.de/bilder/bild/');
					imageNumber = imageNumber[1].split('/"');
					imageNumber = imageNumber[0];

					var thumbUrl = image.split('src="');
					thumbUrl = thumbUrl[1].split('"');
					thumbUrl = thumbUrl[0];

					view.images.push({imageNumber:imageNumber,thumbUrl:thumbUrl,userName:''});
				});


				var sedcardType = queryData.urlpart.split('/');
				sedcardType = sedcardType[0];
				switch (sedcardType) {
					case 'fotograf': sedcardType = 'Fotograf'; break;
					case 'model': sedcardType = 'Model'; break;
					default : sedcardType = 'Sedcard'; break;
					// TODO: Add more types
				}
				view.sedcardType = sedcardType;

				res.render('sedcard',view);
			} catch (e) {
					res.writeHead(404, {'Content-Type': 'text/plain'});
					res.write('404 Not Found: '+queryData.url+'\n');
					res.end();
			}
	});

};
