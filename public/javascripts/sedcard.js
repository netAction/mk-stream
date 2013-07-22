$(document).one('pagechange',function() {
	$(".ui-content:visible img").unveil();

	$('.descriptionText a img').each(function() {
		$(this).removeAttr('height');
		$(this).removeAttr('width');
		$(this).attr('src','/image?url='+$(this).attr('src'));
	});

	job();
});
