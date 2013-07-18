var
	request = require('request'),
	url = require('url'),
	login = require('./login');
// fs = require('fs')

module.exports = function(req, res){
	var logindata = login(req,res);
	if (!logindata) return;

	var j = request.jar();
	j.add(request.cookie('mk4_userid='+logindata.userid));
	j.add(request.cookie('mk4_userpw='+logindata.userpw));

	var queryData = url.parse(req.url,true).query;
	request(
		{
			method:'GET',
			url:'https://www.model-kartei.de/jobs/'+queryData.jobNumber+'-0-x.html',
			jar: j
		},
		function (error, response, body) {
			try {
				var jobText = body.split('</div><div class="tfield">');
				jobText = jobText[1].split('</div>');
				jobText = jobText[0];

				var jobImage = body.split('background:url(');
				if (jobImage.length>1) {
					jobImage = jobImage[1].split(')');
					jobImage = jobImage[0];
				} else {
					jobImage = false;
				}


				var jobData = {
					jobText:jobText,
					jobImage:jobImage
				};

				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(JSON.stringify(jobData));
				res.end();
			} catch (e) {
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(JSON.stringify({error:true}));
				res.end();
			} 
		}
	);
};
