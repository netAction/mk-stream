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
			/* 2">
<div class="pleft40"><a class="jobtfp40" href="https://www.model-kartei.de/jobs/269451-0-suche-fotograf-fr-shooting-mit-2-lteren-damen.html" title="Suche Fotograf f&uuml;r Shooting mit 2 &auml;lteren Damen"></a></div>
<div class="marl50">
<div class="mrgnb4"><a class="bl ttb fs12" href="https://www.model-kartei.de/jobs/269451-0-suche-fotograf-fr-shooting-mit-2-lteren-damen.html" title="Suche Fotograf f&uuml;r Shooting mit 2 &auml;lteren Damen">Suche Fotograf f&uuml;r Shooting mit 2 &auml;lteren Damen</a><div class="fright c888 fs11">11.08.2013 - 15.08.2013</div></div>
<div class="mrgnb8 c888"><code class="scd1" title="Model weiblich"></code> <a class="gr fs12" href="https://www.model-kartei.de/sedcards/model/289192/romina/" title="Romina...">Romina...</a></div>
<div class="c888 fs12"><code class="flag fla1"></code> 13353 Berlin<div class="fright c888 fs12">TfP f&uuml;r <code class="scd2 ml2" title="Fotograf"></code></div><div class="cl"></div></div></div><div class="cl"></div></li>
<li class=" */
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
				if (userSedcard.length==1) { // User does not exist
					return;
				}
				userSedcard = userSedcard[1].split('/" ');
				userSedcard = userSedcard[0];

				var userName = job.split('https://www.model-kartei.de/sedcards');
				if (userName.length==1) throw 'userName 1 fucked';
				userName = userName[1].split('title="');
				if (userName.length==1) throw 'userName 2 fucked';
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
