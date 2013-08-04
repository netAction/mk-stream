module.exports = function(req, res){
	var urlPart = req.url;
	urlPart = urlPart.split('://www.model-kartei.de/');
	if (urlPart.length==1) {
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.write('Ups! This should not happen in mkUrlRedirect.js!');
		res.end();
		return;
	}

	res.writeHead(301, {'Location': '/'+urlPart[1]});
	res.end();
}
