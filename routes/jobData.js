var
	request = require('request'),
	url = require('url'),
	login = require('./login');


function fetch(jobNumber,j,res) {
	request(
		{
			method:'GET',
			url:'https://www.model-kartei.de/jobs/'+jobNumber+'-0-x.html',
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

				var town = body.split('<code class="flag');
console.log("a");
				if (town.length>1) {
console.log("b", town[1]);
					town = town[1].split('</div>');
					town = town[0].split('</code>');
					if (town.length>1) {
console.log("c",town[1]);
						town = town[1];
					}
				}

				var jobData = {
					jobText:jobText,
					jobImage:jobImage,
					jobTown:town
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
} // fetch

function ignore(jobNumber,j,res) {
	request(
		{
			method:'POST',
			url:'https://www.model-kartei.de/js/p/job.php',
			form:{jid:jobNumber,typus:'ajobignore'},
			jar: j
		},
		function (error, response, body) {
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.write(JSON.stringify({ok:true}));
			res.end();
		}
	);
}


module.exports = function(req, res){
	var logindata = login(req,res);
	if (!logindata) return;

	var j = request.jar();
	j.add(request.cookie('mk4_userid='+logindata.userid));
	j.add(request.cookie('mk4_userpw='+logindata.userpw));

	var queryData = url.parse(req.url,true).query;

	if (queryData.ignore) {
		ignore(queryData.jobNumber,j,res);
	} else {
		fetch(queryData.jobNumber,j,res);
	}

};
