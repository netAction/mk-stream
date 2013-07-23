var
	request = require('request'),
	login = require('./login'),
	fs = require('fs'),
	async = require('async'),
	fetchGlobalInfos = require('./fetchGlobalInfos');


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
			try {
			var jobs = body.split('class="bg');
			jobs.splice(0,1); // remove first element
			var view = fetchGlobalInfos(body);
			view.jobs = [];
			jobs.forEach(function(job){
				var jobNumber = job.split('href="https://www.model-kartei.de/jobs/');
				jobNumber = jobNumber[1].split('-0-');
				jobNumber = jobNumber[0];

				var jobTitle = job.split('title="');
				jobTitle = jobTitle[1].split('">');
				jobTitle = jobTitle[0];

				var userSedcard = job.split('https://www.model-kartei.de/sedcards/');
				userSedcard = userSedcard[1].split('/" ');
				userSedcard = userSedcard[0];

				var userName = job.split('https://www.model-kartei.de/sedcards');
				userName = userName[1].split('title="');
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
			callback(0,view);
		} catch (error) {
			callback(1,error);
		}
	});
} // getJobs

function displaySite(error,res,data) {
	if (!error) {
		var view = {
			jobs:[]
		};

		view.jobs = [].concat(
			data[0].jobs,
			data[1].jobs,
			data[2].jobs,
			data[3].jobs
			);

		// remove double elements
		var arr = {};
		for ( var i=0; i < view.jobs.length; i++ ) {
			arr[view.jobs[i].jobNumber] = view.jobs[i];
		}
		view.jobs = [];
		for ( key in arr )
			view.jobs.push(arr[key]);

		// sort array
		view.jobs.sort(function(a,b){
			if (a.jobNumber > b.jobNumber) return -1;
			if (a.jobNumber < b.jobNumber) return 1;
			return 0;
		});

		view.sedcards = data[0].sedcards;
		view.newMessage = data[0].newMessage;

		res.render('jobs',view);
	} else {
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.write('404 Not Found. Error in jobs.js\n');
		res.end();
		console.log(data);
	}
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
			displaySite(error,res,results);
		}
	);
};
