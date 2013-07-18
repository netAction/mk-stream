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

    this.one("unveil", function() {
			var image = this;
      var imageNumber = this.getAttribute('imagenumber');
      if (imageNumber) {
				$.getJSON('/fetchImageMetadata', {imageNumber:imageNumber})
					.done(function(data) {
						image.setAttribute("src", '/image?url='+data.url);
					});
			}
    });

    function unveil() {
      inview = images.filter(function() {
        var $e = $(this),
            wt = $w.scrollTop(),
            wb = wt + $w.height(),
            et = $e.offset().top,
            eb = et + $e.height();

        return eb >= wt - th && et <= wb + th;
      });

      loaded = inview.trigger("unveil");
      images = images.not(loaded);
    }

    $w.scroll(unveil);
    $w.resize(unveil);

    unveil();

    return this;

  };

})(window.jQuery || window.Zepto);


$(document).ready(function() {
  $("img").unveil();
});
