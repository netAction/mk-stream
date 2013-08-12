var
	request = require('request'),
	url = require('url'),
	login = require('./login');


module.exports = function(req, res){
	var logindata = login(req,res);
	if (!logindata) return;

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
				if (imageUrl.length==1) throw 'imageUrl a fucked!';
				imageUrl = imageUrl[1].split('src="');
				if (imageUrl.length==1) throw 'imageUrl b fucked!';
				imageUrl = imageUrl[1].split('"');
				imageUrl = imageUrl[0];
				imageMetadata.url = imageUrl;

				var likeCount = body.split('Personen die dieses Bild gro&szlig;artig finden">');
				if (likeCount.length>1) {
					likeCount = likeCount[1].split('</a>');
					likeCount = likeCount[0];
					imageMetadata.likeCount = likeCount;
				} else {
					likeCount = false;
				}

				imageMetadata.users=[];
				var owner = body.split('<div class="ptz">Ein Bild von');
				if (owner.length==1) throw 'owner a fucked!';
				owner = owner[1].split('href="https://www.model-kartei.de/sedcards/');
				if (owner.length==1) throw 'owner b fucked!';
				owner = owner[1].split('">');
				var ownerUrlPart = owner[0];
				var ownerName = owner[1].split('</a>');
				ownerName = ownerName[0];
				var ownerType = body.split('<div class="ptz">Ein Bild von');
				if (ownerType.length==1) throw 'ownerType a fucked!';
				ownerType = ownerType[1].split('"></code>');
				ownerType = ownerType[0].split('<code class="');
				if (ownerType.length==1) throw 'ownerType b fucked!';
				ownerType = ownerType[1];
				switch (ownerType) {
					case "scd1": ownerType = "Model"; break;
					case "scd2": ownerType = "Fotograf"; break;
					case "scd3": ownerType = "Visagist"; break;
					case "scd7": ownerType = "Bildbearbeiter"; break;
					case "scd99": ownerType = "Malemodel"; break;
					// TODO: More sedcard types
					default: ownerType = "User";
				}
				imageMetadata.users.push({
					'urlPart':ownerUrlPart,
					'name':ownerName,
					'type':ownerType
					});

				var imageMembers = body.split('<h1>Bildteilnehmer</h1>');
				if (imageMembers.length>1) {
					imageMembers = imageMembers[1].split('<h1>');
					imageMembers = imageMembers[0].split('<li class="userlistitem">');
					imageMembers.splice(0,1); // remove first element
					imageMembers.forEach(function(imageMember){
						var imageMemberType = imageMember.split('<div class="userlistsedcardtype ');
						if (imageMemberType.length==1) console.log(imageMember);
						if (imageMemberType.length==1) throw 'imageMemberType fucked!';
						imageMemberType = imageMemberType[1].split('"></div>');
						imageMemberType = imageMemberType[0];
						switch (imageMemberType) {
							case "bgcolor1": imageMemberType = "Model"; break;
							case "bgcolor2": imageMemberType = "Fotograf"; break;
							case "bgcolor3": imageMemberType = "Visagist"; break;
							case "bgcolor7": imageMemberType = "Bildbearbeiter"; break;
							case "bgcolor99": imageMemberType = "Malemodel"; break;
							// TODO: More sedcard types
							default: imageMemberType = "User";
						}

						imageMember = imageMember.split('<div class="userlistname">');
						if (imageMember.length==1) throw 'imageMember fucked!';
						imageMember = imageMember[1];

						var imageMemberUrlPart = imageMember.split('href="https://www.model-kartei.de/sedcards/');
						if (imageMemberUrlPart.length==1) throw 'imageMemberUrlPart fucked!';
						imageMemberUrlPart = imageMemberUrlPart[1].split('"');
						imageMemberUrlPart = imageMemberUrlPart[0];

						var imageMemberName = imageMember.split('">');
						if (imageMemberName.length==1) throw 'imageMemberName fucked!';
						imageMemberName = imageMemberName[1].split('</a>');
						imageMemberName = imageMemberName[0];

						imageMetadata.users.push({
							'urlPart':imageMemberUrlPart,
							'name':imageMemberName,
							'type':imageMemberType
							});
					});
				}

				var iLikeThis = body.split('title="Klicke hier wenn dir das Bild nicht mehr gef&auml;llt">Doch nicht so toll</a>');
				imageMetadata.iLikeThis = (iLikeThis.length>1);

				var ds9 = body.split("ds9:'");
				ds9 = ds9[1].split("'");
				imageMetadata.ds9 = ds9[0];

				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(JSON.stringify(imageMetadata));
				res.end();
			} catch (e) {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(JSON.stringify({error:true}));
				res.end();
				console.log(e);
			} 
	});
}

