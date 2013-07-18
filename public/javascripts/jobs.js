$(document).ready(function() {
	$('div.jobCollapsible').bind("expand", function(event, ui) {
		var job = $(this);
		var jobNumber = $(this).attr('data-jobnumber');
		$.getJSON('/jobData', {jobNumber:jobNumber})
			.done(function(data) {
				$('.jobDescription',job).html(data.jobText);
				$('.fs11',job).wrap('<small></small>'); // „Letzte Änderung...“
				if (data.jobImage) {
					$('.jobDescription',job).append('<img src="/image?url='+data.jobImage+'" />');
				}
				$('a.ignore',job).click(function(event) {
					$(job).slideUp('slow');
					event.preventDefault();
				});
		});
	});
});

