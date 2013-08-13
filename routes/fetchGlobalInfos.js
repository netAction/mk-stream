var
	request = require('request'),
	url = require('url');

module.exports = function(body){
	var loginStatus = body.split('<a href="http://www.model-kartei.de/login.html">Login</a>');
	if (loginStatus.length>1) { // logged out
		var view = {
			loggedOut:true
		};
		return view;
	}

	var view = {
		sedcards:[]
	};
	var sedcards = body.split('href="https://www.model-kartei.de/sedcard.html" title="Sedcards"></a><ul>');
	if (sedcards.length>1) {
		sedcards.splice(0,1); // remove first element
		sedcards.forEach(function(sedcard){
			// <li><a class="lst1" href="https://www.model-kartei.de/sedcards/fotograf/74066/netaction/">Fotograf</a></li>
			var sedcardUrl = sedcard.split('href="https://www.model-kartei.de/sedcards/');
			sedcardUrl = sedcardUrl[1].split('">');
			sedcardUrl = sedcardUrl[0];

			var sedcardTitle = sedcard.split('/">');
			sedcardTitle = sedcardTitle[1].split('</a>');
			sedcardTitle = sedcardTitle[0];

			view.sedcards.push({url:sedcardUrl,title:sedcardTitle});
		});
	}

	var newMessage = body.split('<a class="ttiptop" id="pnlnk" href="https://www.model-kartei.de/pn.html" title="Private Nachrichten"><p>');
	if (newMessage.length<2) {
		newMessage = false;
	} else {
		newMessage = newMessage[1].split('</p></a>');
		newMessage = newMessage[0];
		newMessage = newMessage*1;
	}
	view.newMessage = newMessage;

	return view;
}

