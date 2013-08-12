var
	request = require('request'),
	login = require('./login'),
	fs = require('fs'),
	url = require('url'),
	async = require('async'),
	fetchGlobalInfos = require('./fetchGlobalInfos');





function getSedcard(logindata,urlPart,callback) {
	var j = request.jar();
	j.add(request.cookie('mk4_userid='+logindata.userid));
	j.add(request.cookie('mk4_userpw='+logindata.userpw));

	request(
		{
			method:'GET',
			url:'https://www.model-kartei.de/sedcards/'+urlPart,
			jar: j
		},
		function (error, response, body) {
			try {
				var view = fetchGlobalInfos(body);
				view.images = [];

				var userName = body.split('<h1>');
				if (userName.length==1) throw 'userName fucked';
				userName = userName[1].split('</h1>');
				view.userName = userName[0];

				var descriptionText = body.split('<div class="maintextcell"');
				if (descriptionText.length>1) {
					descriptionText = descriptionText[1].split('px;">');
					if (descriptionText.length==1) throw 'descriptionText fucked';
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
					if (imageNumber.length==1) return; // Polaroid
					imageNumber = imageNumber[1].split('/"');
					imageNumber = imageNumber[0];

					var thumbUrl = image.split('src="');
					if (thumbUrl.length==1) throw 'thumbUrl fucked';
					thumbUrl = thumbUrl[1].split('"');
					thumbUrl = thumbUrl[0];

					view.images.push({imageNumber:imageNumber,thumbUrl:thumbUrl,userName:''});
				});

				// image horizontal above sedcard
				var titleBanner = body.split('id="psh"');
				if(titleBanner.length>1) {
					titleBanner = titleBanner[1].split('background:url(');
					if (titleBanner.length==1) throw 'titleBanner fucked';
					titleBanner = titleBanner[1].split(');');
					titleBanner = titleBanner[0];
					view.titleBanner = titleBanner;
				}

				var sedcardImage = body.split('rdscmpr');
				if(sedcardImage.length>1) {
					sedcardImage = sedcardImage[1].split('style="background:url(');
					if (sedcardImage.length>1) {
						sedcardImage = sedcardImage[1].split(');');
						sedcardImage = sedcardImage[0];
						view.sedcardImage = sedcardImage;
					}
				}

				var modelData = body.split('<div class="txtheader">Sedcarddaten</div>');
				if(modelData.length>1) {
					modelData = modelData[1].split('<ul class="scdaten">');
					if (modelData.length==1) throw 'modelData fucked';
					modelData = modelData[1].split('</ul>');
					modelData = modelData[0];
					view.modelData = modelData;
				}

				var ds9 = body.split('<input id="ds9x" type="hidden" value="');
				if (ds9.length==1) throw 'ds9 fucked';
				ds9 = ds9[1].split('"');
				view.ds9 = ds9[0];

				var town = body.split('<code class="flag');
				if (town.length>1) {
					town = town[1].split('</a>');
					town = town[0].split('</code>');
					if (town.length>1) {
						town = town[1];
						view.town = town;
					}
				}

				var sedcardType = urlPart.split('/');
				sedcardType = sedcardType[0];
				switch (sedcardType) {
					case 'fotograf': sedcardType = 'Fotograf'; break;
					case 'model': sedcardType = 'Model'; break;
					case 'bildbearbeiter': sedcardType = 'Bea'; break;
					case 'malemodel': sedcardType = 'Male'; break;
					case 'designer': sedcardType = 'Design'; break;
					default : sedcardType = 'Sedcard'; break;
					// TODO: Add more types
				}
				view.sedcardType = sedcardType;

				view.sedcardUrl = urlPart;

				callback(0,view);
			} catch (error) {
				callback(1,error);
			}
	});
} // getSedcard


function getJobs(sedcard,logindata,urlPart,callback) {
	var j = request.jar();
	j.add(request.cookie('mk4_userid='+logindata.userid));
	j.add(request.cookie('mk4_userpw='+logindata.userpw));

	urlPart = urlPart.split('/');
	userId = 0;
	for(var i=0;i<urlPart.length;i++) {
		if (parseInt(urlPart[i],10)>userId) {
			userId = parseInt(urlPart[i],10);
		}
	}

	request(
		{
			method:'GET',
			url:'https://www.model-kartei.de/jobs/user/'+userId+'/',
			jar: j
		},
		function (error, response, body) {
			try {
				var view = {};
				view.jobs = [];

				var jobs = body.split('class="bg');
				jobs.splice(0,1); // remove first element
				var view = fetchGlobalInfos(body);
				view.jobs = [];
				jobs.forEach(function(job){
					var jobNumber = job.split('href="https://www.model-kartei.de/jobs/');
					if (jobNumber.length==1) throw 'jobNumber fucked';
					jobNumber = jobNumber[1].split('-0-');
					jobNumber = jobNumber[0];

					var jobTitle = job.split('title="');
					if (jobTitle.length==1) throw 'jobTitle fucked';
					jobTitle = jobTitle[1].split('">');
					jobTitle = jobTitle[0];

					var userSedcard = job.split('https://www.model-kartei.de/sedcards/');
					if (userSedcard.length==1) throw 'userSedcard fucked';
					userSedcard = userSedcard[1].split('/" ');
					userSedcard = userSedcard[0];

					var userName = job.split('https://www.model-kartei.de/sedcards');
					if (userName.length==1) throw 'userName a fucked';
					userName = userName[1].split('title="');
					if (userName.length==1) throw 'userName b fucked';
					userName = userName[1].split('">');
					userName = userName[0];

					var payUser = job.split('Pay (User will bezahlt werden)');
					payUser = (payUser.length>1);

					view.jobs.push({
						jobNumber: jobNumber,
						jobTitle: jobTitle,
						userSedcard: userSedcard,
						userName: userName,
						payUser: payUser
					});
				});
				sedcard.jobs = view.jobs; // add jobs to other sedcard data
				callback(0,sedcard);

			} catch (error) {
				callback(1,error);
			}
	});
} // getJobs


function getNotes(sedcard,logindata,urlPart,callback) {
	var j = request.jar();
	j.add(request.cookie('mk4_userid='+logindata.userid));
	j.add(request.cookie('mk4_userpw='+logindata.userpw));

	urlPart = urlPart.split('/');
	userId = 0;
	for(var i=0;i<urlPart.length;i++) {
		if (parseInt(urlPart[i],10)>userId) {
			userId = parseInt(urlPart[i],10);
		}
	}

	request(
		{
			method:'POST',
			url:'https://www.model-kartei.de/js/p/no.php',
			form:{fuid:userId,ds9:sedcard.ds9},
			jar: j
		},
		function (error, response, body) {
			try {
				var notes = body.split('<textarea class="tarea" cols="10" id="noinhalt" name="inhalt" rows="10">');
				if (notes.length>1) {
					notes = notes[1].split('</textarea>');
					notes = notes[0];
					if (notes != '') sedcard.notes = notes; // add notes to other sedcard data
				}
				callback(0,sedcard);
			} catch (error) {
				callback(1,error);
			}
		}
	);
} // getNotes


function displaySite(error,res,data) {
	if (!error) {
		res.render('sedcard',data);
	} else {
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.write('404 Not Found.  Error in sedcard.js\n');
		res.end();
		console.log(data);
	}
} // displaySite


module.exports = function(req, res){
	var logindata = login(req,res);
	if (!logindata) return;

	var urlPart = url.parse(req.url,true).pathname;
	urlPart = urlPart.substr(10);


	async.waterfall([
		function(callback){ // Sedcard
			getSedcard(logindata,urlPart,callback);
		},
		function(arg,callback){ // Jobs
			getJobs(arg,logindata,urlPart,callback);
		},
		function(arg,callback){ // Notes
			getNotes(arg,logindata,urlPart,callback);
		}
		],
		function(error,results){
			displaySite(error,res,results);
		}
	);
};
