/**
 * Created by whorto01 on 6/19/2015.
 */

var createQcSlider = function(imageGroup){
    /*
    This function takes an HTML element that contains one or more images and builds a set of slides around it, turning each contained image into a slide.
    In this initial iteration, very little work will be done to correct image size or placement, presuming that the developer will be thoughtful enough to curate their images prior to calling this function.
    */
    if (!imageGroup) return false;

    // create container element

    $(imageGroup).each(function() {

        var slideContainer = '<div class="imageSliderContainer"><div class="slides">';

        var thisGroup = $(this);

        $(thisGroup).find('img').each(function (i) {
            var newSlide = '<div class="imageSlide"><div class="slideTitleBar"><span class="slideTitle">' + $(this).prop('title') + '</span>';
            newSlide += '<span class="slideCounter">' + (i + 1) + ' of ' + $(thisGroup).find('img').length + '</span></div>';
            newSlide += '<img src="' + $(this).prop('src') + '" /></div>';
            slideContainer += newSlide;
        });

        slideContainer += '</div><div class="imageSliderControls"><span class="slideRight" onclick="changeSlide(this)"></span><span class="slideLeft" onclick="changeSlide(this)"></span></div></div>';

        // replace the contents of the image group with this slider. Set the first slide to active to make it visible.
        $(thisGroup).html(slideContainer);
        $(thisGroup).find('.imageSlide').first().addClass('active');

        // if there one or fewer slides, hide the controls.
        if ($(thisGroup).find('img').length < 2) {
            $(thisGroup).find('.imageSliderControls').addClass('hidden');
        }

    });
};



var changeSlide = function(el){
    var slideContainer, slides, nextSlide, currentSlide, directionToSlide = $(el).prop('class');

    slideContainer = $(el).parents('.imageSliderContainer');
    slides = $(slideContainer).find('.imageSlide');
    currentSlide = $(slideContainer).find('.active');

    if (directionToSlide === 'slideRight') {
        // write a case if the slide clicked is the right-most in the group of slides, or if no slide is active
        if ($(currentSlide).index() === $(slides).length-1) {
            nextSlide = $(slides).first();
        } else if ($(slideContainer).find('.active').length === 0) {
            nextSlide = $(slides).first();
        } else {
            nextSlide = $(currentSlide).next();
        }

        $(currentSlide).removeClass('active');
        $(nextSlide).addClass('active');
    } else {
        // write a case if the slide clicked is the left-most in the group of slides, or if no slide is active
        if ($(currentSlide).index() === 0) {
            nextSlide = $(slides).last();
        } else if ($(slideContainer).find('.active').length === 0) {
            nextSlide = $(slides).last();
        } else {
            nextSlide = $(currentSlide).prev();
        }

        $(currentSlide).removeClass('active');
        $(nextSlide).addClass('active');
    }
};