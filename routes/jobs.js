var
	request = require('request'),
	login = require('./login'),
	fs = require('fs'),
	async = require('async');


function getJobs(logindata,pageUrl,callback) {
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
			body = body.split('class="bg');
			body.splice(0,1); // remove first element
			var jobs = [];
			body.forEach(function(job){
				var jobNumber = job.split('href="https://www.model-kartei.de/jobs/');
				jobNumber = jobNumber[1].split('-0-');
				jobNumber = jobNumber[0];

				var jobTitle = job.split('title="');
				jobTitle = jobTitle[1].split('">');
				jobTitle = jobTitle[0];

				var userSedcard = job.split('https://www.model-kartei.de/sedcards');
				userSedcard = userSedcard[1].split('/" ');
				userSedcard = 'https://www.model-kartei.de/sedcards'+userSedcard[0];

				var userName = job.split('https://www.model-kartei.de/sedcards');
				userName = userName[1].split('title="');
				userName = userName[1].split('">');
				userName = userName[0];

				jobs.push({
					jobNumber: jobNumber,
					jobTitle: jobTitle,
					userSedcard: userSedcard,
					userName: userName
				});
			});
			callback(0,{jobs:jobs});
	});
} // getJobs

function displaySite(res,data) {
	var view = {
		jobs:[]
	};

	var jobs = [];
	view.jobs = jobs.concat(
		data[0].jobs,
		data[1].jobs,
		data[2].jobs,
		data[3].jobs
		);
	view.jobs.sort(function(a,b){
		if (a.jobNumber > b.jobNumber) return -1;
		if (a.jobNumber < b.jobNumber) return 1;
		return 0;
	});

	res.render('jobs',view);
} // displaySite



module.exports = function(req, res){
	var logindata = login(req,res);
	if (!logindata) return;

	async.series([
		function(callback){ // Radar 1. Seite
			getJobs(logindata,'https://www.model-kartei.de/index.php?p=radar&t=25',callback);
		},
		function(callback){ // Radar 2. Seite
			getJobs(logindata,
				'https://www.model-kartei.de/index.php?p=radar&t=25&show=line&l=0&s=1',callback);
		},
		function(callback){ // NetzwerkJobs
			getJobs(logindata,'https://www.model-kartei.de/index.php?p=neues&show=2',callback);
		},
		function(callback){ // FavoritenJobs
			getJobs(logindata,'https://www.model-kartei.de/index.php?p=neues&show=6',callback);
		}
		],
		function(error,results){
			displaySite(res,results);
		}
	);
};
