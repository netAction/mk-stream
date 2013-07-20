var
	request = require('request'),
	login = require('./login'),
	fs = require('fs'),
	async = require('async');



function getFavourites(logindata,pageUrl,callback) {
	// TODO: Get Private Message status
	var j = request.jar();
	j.add(request.cookie('mk4_userid='+logindata.userid));
	j.add(request.cookie('mk4_userpw='+logindata.userpw));

	request(
		{
			method:'GET',
			url:pageUrl,
			jar: j
		},
		function (error, response, body) {
			if (error || response.statusCode != 200) callback(1,{});
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


function displaySite(res,data) {
	var view = {
		favouriteImages:[]
	};

	var images = [];
	view.favouriteImages = images.concat(data[0].favouriteImages,data[1].favouriteImages);
	view.favouriteImages.sort(function(a,b){
		if (a.imageNumber > b.imageNumber) return -1;
		if (a.imageNumber < b.imageNumber) return 1;
		return 0;
	});

	res.render('index',view);
} // displaySite



module.exports = function(req, res){
	var logindata = login(req,res);
	if (!logindata) return;

	async.series([
		function(callback){
			getFavourites(logindata,'https://www.model-kartei.de/bilder/favoriten/',callback);
		},
		function(callback){
			getFavourites(logindata,'https://www.model-kartei.de/bilder/favoriten/1/',callback);
		}
		],
		function(error,results){
			displaySite(res,results);
		}
	);
};
