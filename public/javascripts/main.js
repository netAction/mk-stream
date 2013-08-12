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
		var $w = $(window),
			th = threshold || 0,
			retina = window.devicePixelRatio > 1,
			images = this,
			loaded,
			inview,
			source;


		function likeToggle(element) {
			var image = $(element).parent().parent().children('img');
			var imageNumber = image.attr('imagenumber');
			$.getJSON('/likeImage', {imageNumber:imageNumber,ds9:$(element).data('ds9')})
				.done(function(data) {
					processImage(image[0],false);
				});
		};

		function processImage(element,first) {
			var image = element;
			var imageNumber = image.getAttribute('imagenumber');
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
						var imageDescription = $(image).parent().children('div.imageDescription')
						imageDescription.html('');

						if (data.likeCount) {
							var likeInfo = data.likeCount+' '+(data.iLikeThis ? '★' : '☆');
							$('<p class="likeCount ui-link"></p>') /* ui-link for jQuery mobile */
								.html(likeInfo)
								.appendTo(imageDescription)
								.data('ds9',data.ds9)
								.click(function(){
									likeToggle(this);
									});
						}

						$(data.users).each(function(i,user) {
							imageDescription.append('<p>'+user.type+': <a class="ui-link" href="/sedcards/'+user.urlPart+'">'+user.name+'</a></p>');
						});

						imageDescription.append('<p><a class="ui-link" href="https://www.model-kartei.de/bilder/bild/'+imageNumber+'">Bild bei Model-Kartei.de</a></p>');

						if (first) { // only once
							$(image).click(function() {
								$(this).parent().children('div.imageDescription').slideToggle();
								$(this).parent().children('p.userName').slideToggle();
								$(this).parent().children('p.likeInfo').slideToggle();
							});
							$(image).css('cursor','pointer');
						}
					});
			}
		} // processImage


		this.one("unveil", function() {
			processImage(this,true);
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
				if(data.jobTown) {
					$('.jobDescription',job)
						.append('<p>Ort: '+
							'<a href="https://maps.google.com/?q='+encodeURIComponent(data.jobTown)+'">'+data.jobTown+'</a>'+
							'</p>');
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

