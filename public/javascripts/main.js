/**
	* jQuery Unveil
	* A very lightweight jQuery plugin to lazy load images
	* http://luis-almeida.github.com/unveil
	*
	* Licensed under the MIT license.
	* Copyright 2013 Luís Almeida
	* https://github.com/luis-almeida
	*/

// Modified for MK-Stream by netAction

;(function($) {

	$.fn.unveil = function(threshold) {
console.log("Unveil");
		var $w = $(window),
			th = threshold || 0,
			retina = window.devicePixelRatio > 1,
			images = this,
			loaded,
			inview,
			source;

		this.one("unveil", function() {
			var image = this;
			var imageNumber = this.getAttribute('imagenumber');
			if (imageNumber) {
				$.getJSON('/fetchImageMetadata', {imageNumber:imageNumber})
					.done(function(data) {
						image.setAttribute("src", '/image?url='+data.url);
						if (data.likeCount) {
							var likeInfo = data.likeCount+' '+(data.iLikeThis ? '★' : '☆');
						} else {
							var likeInfo = '';
						}
						$(image).parent().children('p.likeInfo')
							.html(likeInfo);
						$(image).parent().children('div.imageDescription')
							.html('<p><a href="https://www.model-kartei.de/bilder/bild/'+imageNumber+'">Bild bei Model-Kartei.de</a></p>');
						$(image).click(function() {
							$(this).parent().children('div.imageDescription').slideToggle();
							$(this).parent().children('p.userName').slideToggle();
							$(this).parent().children('p.likeInfo').slideToggle();
						});
						$(image).css('cursor','pointer');
					});
			}
		});


		function filter() {
			if ($(this).is(':hidden')) return false;

			var $e = $(this),
				wt = $w.scrollTop(),
				wb = wt + $w.height(),
				et = $e.offset().top,
				eb = et + $e.height();

				return eb >= wt - th && et <= wb + th;
		}

		function unveil() {
			inview = images.filter(filter);

			loaded = inview.trigger("unveil");
			images = images.not(loaded);
		}

		$w.scroll(unveil);
		$w.resize(unveil);

		//unveil();
		images.one('load', function() {
			$w.trigger('scroll');
		}).each(function() {
			if(this.complete) {
				$(this).trigger('load');
			}
		});

		return this;
	};

})(window.jQuery || window.Zepto);




// ######################### Job
function job() {
	$('.ui-content div.jobCollapsible').bind("expand", function(event, ui) {
		var job = $(this);
		var jobNumber = $(this).attr('data-jobnumber');
		$.getJSON('/jobData', {jobNumber:jobNumber})
			.done(function(data) {
				$('.jobDescription',job).html(data.jobText);
				$('.jobDescription a img').each(function() {
					$(this).removeAttr('height');
					$(this).removeAttr('width');
					$(this).attr('src','/image?url='+$(this).attr('src'));
				});
				$('.fs11',job).wrap('<small></small>'); // „Letzte Änderung...“
				if (data.jobImage) {
					$('.jobDescription',job).append('<img src="/image?url='+data.jobImage+'" />');
				}
				$('a.ignore',job).click(function(event) {
					$(job).slideUp('slow');
					event.preventDefault();
					var jobNumber = $(this).attr('data-jobnumber');
					$.getJSON('/jobData', {jobNumber:jobNumber,ignore:true});
				});
		});
	});
};

