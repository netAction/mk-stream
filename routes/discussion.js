var
	request = require('request'),
	login = require('./login'),
	fs = require('fs'),
	async = require('async'),
	fetchGlobalInfos = require('./fetchGlobalInfos');


function getDiscussions(logindata,pageUrl,callback) {
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
			try {
				if (error || response.statusCode != 200) throw 'fuck';

				var view = fetchGlobalInfos(body);
				view.favouriteImages = [];

				var images = body.split('href="https://www.model-kartei.de/bilder/bild/');
				// 12905321/" title="Anonym"><img alt="" border="0" height="180" src="https://img7.model-kartei.de/q/j/c/302872/12905321_0.jpg" width="179" /></a></div><div class="marl190"><div><a class="ntop" href="https://www.model-kartei.de/sedcards/fotograf/302872/ingo-b-ibgrafix/" title="Ingo B [IBgrafiX]">Ingo B [IBgrafiX]</a> <span class="scinfo sedcol2"><code class="scd2"></code> Fotograf</span><div class="fright"><a class="vip216" href="https://www.model-kartei.de/vip.html"></a></div><div class="fright echt16"></div><div class="fright"><a class="online16" href="https://www.model-kartei.de/online/-/"></a></div></div><div class="pictitle">Anonym</div><div class="commentator"><a class="cmlink" href="https://www.model-kartei.de/sedcards/fotograf/142318/brinkschultekommentiert-zurueck-wenns-gefaellt/" title="Brinkschulte::kommentiert zur&uuml;ck wenns gef&auml;llt">Brinkschulte::kommentiert zur&uuml;ck wenns gef&auml;llt</a> schrieb vor 10 Stunden<div class="fright"><a class="vip216" href="https://www.model-kartei.de/vip.html"></a></div><div class="fright echt16"></div></div><div class="lastcomment">jaja diese Gegenlichtspielereien. Sehr sch&ouml;n gemacht. lg Rainer</div><div class="comminfo"><b>10</b> Kommentare &middot; <b>19</b> &hearts;</div></div></li><li class="newpicborder" id="outid12904772"><div class="pleft180"><a 

				images.splice(0,1); // remove first element
				images.forEach(function(image){
					var imageNumber = image.split('/"');
					imageNumber = imageNumber[0];

					var thumbUrl = image.split('.jpg"');
					thumbUrl = thumbUrl[0].split('src="');
					if (thumbUrl.length==1) throw 'thumbUrl fucked';
					thumbUrl = thumbUrl[1]+'.jpg';

					var userName = image.split('</a>');
					userName = userName[1].split('>');
					if (userName.length==1) throw 'userName fucked';
					userName = userName[userName.length-1];
					view.favouriteImages.push({imageNumber:imageNumber,thumbUrl:thumbUrl,userName:userName});
				});
				callback(0,view);
			} catch(error) {
				callback(1,error);
			}
		});
} // getDiscussions


function displaySite(error,res,data) {
	if(!error) {
		var view = {
			favouriteImages:[]
		};

		var images = [];
		view.favouriteImages = images.concat(
			data[0].favouriteImages,
			data[1].favouriteImages,
			data[2].favouriteImages,
			data[3].favouriteImages
		);

		// remove double elements
		var arr = {};
		for ( var i=0; i < view.favouriteImages.length; i++ ) {
			arr[view.favouriteImages[i].imageNumber] = view.favouriteImages[i];
		}
		view.favouriteImages = [];
		for ( key in arr )
			view.favouriteImages.push(arr[key]);

		// sort images
		view.favouriteImages.sort(function(a,b){
			if (a.imageNumber > b.imageNumber) return -1;
			if (a.imageNumber < b.imageNumber) return 1;
			return 0;
		});

		view.sedcards = data[0].sedcards;
		view.newMessage = data[0].newMessage;

		res.render('discussion',view);
	} else {
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.write('404 Not Found. Error in index.js\n');
		res.end();
		console.log(data);
	}
} // displaySite



module.exports = function(req, res){
	var logindata = login(req,res);
	if (!logindata) return;

	async.series([
		function(callback){
			getDiscussions(logindata,'https://www.model-kartei.de/bilder/diskussion/',callback);
		},
		function(callback){
			getDiscussions(logindata,'https://www.model-kartei.de/bilder/diskussion/1/',callback);
		},
		function(callback){
			getDiscussions(logindata,'https://www.model-kartei.de/bilder/diskussion/2/',callback);
		},
		function(callback){
			getDiscussions(logindata,'https://www.model-kartei.de/bilder/diskussion/3/',callback);
		}
		],
		function(error,results){
			displaySite(error,res,results);
		}
	);
};
