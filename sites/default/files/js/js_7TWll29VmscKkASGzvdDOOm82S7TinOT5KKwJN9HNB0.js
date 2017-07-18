(function ($) {

    //Creates Live Method if it does not exist.
    if (typeof $.fn.live != 'function') {

        $.fn.extend({

            live: function (types, data, fn) {
                $(this.context).on(types, this.selector, data, fn);
                return this;
            },
            die: function (types, fn) { //Die is prob not a function either, they were deprecated at the same time.
                $(this.context).off(types, this.selector || "**", fn);
                return this;
            }

        });

    }
	
    //
    $.browser = {
            msie: (navigator.appName == 'Microsoft Internet Explorer')?true:false,
    };
    

})(jQuery);
;
//Get Query String Param
function getQuerystring(key, default_) {
    if (default_ == null) default_ = "";
    key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
    var qs = regex.exec(window.location.href);
    if (qs == null)
        return default_;
    else
        return qs[1];
}


(function ($) {

    $.updateListings = function (type) {

        function getPathFromUrl(url) {
            if (url.indexOf("?") != -1) {
                return url.split("?")[0];
            } else {
                return url;
            }
        }

        var nid = 0;
        if (Drupal.settings.nid != '')
            nid = Drupal.settings.nid;

        var trailingSlash = '';
        if (Drupal.settings.trailing_slash)
            trailingSlash = '/';

        institutionId = typeof institutionId !== 'undefined' ? institutionId : 0;

        var UserResultsCookieName = "_UserChangeResultsCount";
        var resultsCount = 0;
        var qsParams = new Array();
        var qsParamsString = '';
        var modulefolder = '/sites/all/modules/EDDY/eddy_listing/';

        try {

            if ($.cookie("user_postal_code")) {

                qsParams.postal_code = $.cookie("user_postal_code");

                qsParams.radius = 0;

                if ($.cookie("user_radius"))
                    qsParams.radius = $.cookie("user_radius");

            }

            //var page = getQuerystring("page");

            //if(page > 0){
            //	qsParams.page = page;
            //}

            if (institutionId > 0) {
                qsParams.institution = institutionId;
            }

            var qsCount = 0;

            for (key in qsParams) {
                qsCount++;
                qsParamsString += key + '=' + qsParams[key] + '&';
            }

            qsParamsString = '?' + qsParamsString.replace(/&+$/, '');

            var currentQS = location.href.split('?')[1];

            if (currentQS != "" && currentQS != undefined && currentQS != 'undefined') {

                if (qsCount > 0) {

                    qsParamsString += "&" + currentQS;

                } else {

                    qsParamsString = "?" + currentQS;

                }

            }

            $(".block-eddy-listing").each(function (i) {

                $(this).before("<p class='listing-loader'>Loading...</p>");

                var elementId = $(this).attr('id');
                var listId = 0;

                listId = elementId.split('-').slice(-1)[0];

                if ($(this).find('.pager').length > 0 && $.cookie(UserResultsCookieName) != null)
                    resultsCount = $.cookie(UserResultsCookieName)

                $.ajax({
                    url: '/eddy-listing-ajax/' + nid + '/' + listId + '/' + resultsCount + trailingSlash + qsParamsString,
                    context: this,
                    success: function (data) {

                        $(this).find('.content').html(data);
                        $(this).css('visibility', 'visible');
                        $(this).prev('.listing-loader').remove();

                        try {
                            //get campus locations and total result count in json---------------------------
                            if (data != '' && data !== null) {

                                $.view_map();

                            } else {

                                $.initializeMap('map_canvas');
                            }
                        } catch (e) { }

                        if (type == "update") {
                            $(this).addClass("listings-block-updated");
                            $(".listings-block-updated").show();
                        }

                        var loc_href = getPathFromUrl(window.location.href);

                        $('.block-eddy-listing .pager li a, .block-eddy-listing .pager-container li a').each(function () {
                            if ($(this).attr('href') == "")
                                $(this).attr('href', getPathFromUrl(window.location.href));
                        });

                        $('.block-eddy-listing .pager li').each(function () {
                            if ($(this).text().replace(/[^\d]/g, '') != "")
                                $(this).addClass('pager-item-' + $(this).text().replace(/[^\d]/g, ''));
                        });

                        if ($(this).find(".globalProgramResultsCount").length > 0) {
                            $(".pager-count").text($(this).find(".globalProgramResultsCount").val());
                            $(".sponsored-text").show();
                        }
                        else if ($(this).find(".globalResultsCount").length > 0) {
                            $(".pager-count").text($(this).find(".globalResultsCount").val());
                            $(".sponsored-text").show();
                        }
                        else if ($(this).hasClass("main-listings") && !$(this).hasClass("featured-main-listings") && !$("body").hasClass("node-type-school") && $(this).find(".content").html() == "") {

                            $(".pager-count").text("0");

                            if ($("body").hasClass("campus-colleges"))
                                $(this).find(".content").html('<div class="messages warning">Sorry But there Are no Matching Colleges in your location.</div>');
                            else
                                $(this).find(".content").html('<div class="messages warning">Sorry But there Are no Matching Programs in your location.</div>');

                            $(".sponsored-text").hide();
                        }

                        $('.results-count-holder a').each(function () {
                            if ($.cookie(UserResultsCookieName) == $(this).attr("class").split("-").slice(-1)[0]) {
                                $(this).parent("li").addClass("current");
                            }
                            else if ($.cookie(UserResultsCookieName) == null) {
                                $(".results-25").parent("li").addClass("current");
                            }
                        });

                        $(".results-25").click(function (event) {
                            event.preventDefault();
                            $.cookie(UserResultsCookieName, '25', { path: '/', expires: 365 });
                            location.href = location.href;
                        });

                        $(".results-50").click(function (event) {
                            event.preventDefault();
                            $.cookie(UserResultsCookieName, '50', { path: '/', expires: 365 });
                            location.href = location.href.replace("&page=" + getQuerystring("page"), "");
                        });

                        $(".results-100").click(function (event) {
                            event.preventDefault();
                            $.cookie(UserResultsCookieName, '100', { path: '/', expires: 365 });
                            location.href = location.href.replace("&page=" + getQuerystring("page"), "");
                        });


                        //Click Event for Pay for Click Listings
                        $(".eddy-listings a").click(function (e) {

                            if (typeof (SaveClick) == 'function' && $(this).attr("data-track-clicks") == "1") {

                                e.preventDefault();
                                var programProductId = $(this).attr("data-program-product-id");
                                var programId = $(this).attr("data-program-id");
                                var position = $(this).attr("data-position");
                                var listingTypeId = $(this).attr("data-listing-type-id");
                                var pageNumber = $(this).attr("data-page");
                                var redirectURL = $(this).attr("data-redirect-url");
                                var programName = $(this).attr("data-program-name");

                                //Push GTM Event
                                try {
                                    if (typeof dataLayer != 'undefined') {
                                        dataLayer.push({
                                            "event": "gaEvent",
                                            "eventCategory": "client",
                                            "eventAction": "cpc-click",
                                            "eventLabel": programId,
                                            "programProductId": programProductId,
                                            "position": position,
                                            "pageNumber": pageNumber,
                                        });
                                    }
                                } catch (e) { }

                                //Sets Optimizely Goal.
                                if (window.optimizely != undefined) {
                                    window['optimizely'].push(["trackEvent", "ad_click_cpc"]);
                                }

                                //Calls Tracking and redirects user to the correct Click Through URL.
                                SaveClick(programProductId, listingTypeId, pageNumber, position, redirectURL);

                            }

                        });

                        //Get Aggregate Listings
                        $(".view-additional-holder a").click(function (event) {
                            event.preventDefault();

                            var aggrListId = $(this).parent().attr("data-aggregation-list-id");
                            var aggrInstitutionId = $(this).attr("href").replace("#", "");
                            
                            if ($(this).parents('.listing-row').find('.eddy-listings').length == 0) {

                                $(this).html($(this).html() + ' <img class="loader" src="' + modulefolder + 'images/ajax-loader-16-blue.gif" />');
                                
                                $.ajax({
                                    url: '/eddy-listing-ajax/' + nid + '/' + aggrListId + '/' + 100 + trailingSlash + '?institution=' + aggrInstitutionId,
                                    context: this,
                                    success: function (data) {
                                        $(this).parent().before(data);
                                        $(this).parents('.listing-row').find("li:first").remove();
                                        $(this).parents('.listing-row').find('.eddy-listings').hide().slideDown(500);

                                        $(this).attr("data-original-text", $(this).text());
                                        $(this).find(".loader").remove();
                                        $(this).text("Hide Additional Programs");
                                    }
                                });
                            }
                            else {

                                //Text for View More Link
                                if ($(this).closest('.listing-row').find('.eddy-listings').is(":visible")) {

                                    //Animates User to the top of the listing
                                    var target_offset = $(this).closest(".listing-row").offset();
                                    var target_top = target_offset.top - 10;
                                    $('html, body').animate({ scrollTop: target_top }, 500);

                                    $(this).closest('.listing-row').find('.eddy-listings').delay(800).slideUp(300);
                                    $(this).text($(this).attr("data-original-text"));

                                } else {
                                    $(this).closest('.listing-row').find('.eddy-listings').slideDown(300);
                                    $(this).attr("data-original-text", $(this).text());
                                    $(this).text("Hide Additional Programs");
                                }

                            }


                        });

                        $(".eddy-listings a").click(function (event) {

                            var matchResponseField = $(this).parents(".block-eddy-listing").find(".matchResponseGuid").val();

                            if (matchResponseField.length > 0)
                                $.cookie('_matchingResponseGuid', matchResponseField, { path: '/' });

                        });

                    }

                });

            });

        } catch (e) { }

    }

}(jQuery));



(function ($) {

    $(document).ready(function () {

        $.updateListings("load");

    });

})(jQuery);
;
﻿
(function ($) {
    $(document).ready(function () {

        $('.operation').not('.edit').on('click', function (e) {
            
            e.preventDefault();
            var irow = $(this).parents('tr');
            
            $.ajax({
                url: $(this).attr("rel"),
                context: this,
                success: function (data, irow) {
                    
                    var irow = $(this).parents('tr');
                    
                    if (data != ''){
                        switch(data.toLowerCase()){
                            case "deleted":                                
                                location.reload();
                                break;
                            case "published":
                                $(irow).find('.views-field-status').text(data);
                                $(irow).find('.views-field-rid a:last').remove();
                                break;
                            case "approved":
                                $(irow).find('.views-field-status').text(data);
                                $(irow).find('.views-field-rid a:last').text("Publish");

                                //replace href with new operation url
                                href_o = $(irow).find('.views-field-rid a:last').attr("rel");
                                op = href_o.split("/");
                                op[op.length - 1] = "publish";                                
                                $(irow).find('.views-field-rid a:last').attr("rel", op.join("/"));
                                break;
                            default:
                                $(irow).find('.views-field-status').text(data);
                                break;

                        }
                        
                    }    


                }
            });
        });

        


        /** reviews on detail **/
        //hide load more if reviews less than 5
        if ($('#review-detail-widget ul').length == 1) {
            $('#review-detail-widget .reviews-load-more').hide();
        }
        $('#review-detail-widget .reviews-load-more').on("click", function (e) {
            e.preventDefault();
            $(this).parent('ul').find('.reviews-load-more').hide();
            $(this).parent('ul').next('ul').show();
            if ($(this).parent('ul').next('ul').next('ul').length = 0) {
                $(this).parent('ul').next('ul').next('ul').find('.reviews-load-more').hide();
            }
        });
        $('.review-read-more').click(function (e) {
            e.preventDefault();
            if ($(this).text() == 'read more') {
                $(this).prev('.collapsed').css('display', 'inline');
                $(this).text('read less');
            } else {
                $(this).prev('.collapsed').css('display', '');
                $(this).text('read more');
            }
        });
        /** reviews on admin **/
       
        var rating = $('#eddy_reviews_container .review-rating .form-type-radios input[type="radio"]:checked').attr("value");
        set_rating(rating);
        //$('#eddy_reviews_container .review-rating .form-type-radios input[type="radio"]').attr('checked', true).trigger('click');

        $('#eddy_reviews_container .review-rating .form-type-radios input[type="radio"]').on('click', function () {
            var rating = $(this).attr("value");
            set_rating(rating);
        });

    });
    //end of document ready

    function set_rating(rating){
        $('#eddy_reviews_container .review-rating .form-type-radios input[type="radio"]').each(function () {
            $(this).parent().removeClass("rated");
            if ($(this).attr("value") <= rating) {
                $(this).parent().addClass("rated");
            }
        });
    }
})(jQuery);
;
(function ($) {

    $(document).ready(function () {
        
        $('.block-sab-landing-page form select').change(function () {

            var qs = $(this).parents("form").find('select:has(option[value!=""]:selected)').serialize();
            var action = $(this).parents('form').attr("action");
            var url = action.split("?")[0];            
            
            window.location.href = url + "?" + qs;
        });

        currentQS = location.href.split('?')[1];
        qsstring = '';
        if (currentQS != "" && currentQS != undefined && currentQS != 'undefined') {
            qsstring = '?'+ currentQS;
        }
        $(".landing_page_program_list_container").each(function (i) {
            $.ajax({
                url: '/landing-page-ajax/' + qsstring,
                context: this,
                success: function (data) {

                    $(this).html(data);
                }
            });
        });
    });


})(jQuery);

;
﻿(function ($) {

    $(document).ready(function () {

        //hide divs when 'empty.gif' exists which means there isn't any actual OAS add to display.

        function trackAction(sender) {
            try {
                var eventCategory = 'client';
                var eventAction = $(sender).attr('id');
                if (typeof dataLayer != 'undefined') {
                    dataLayer.push({
                        "event": "gaEvent",
                        "eventCategory": eventCategory,
                        "eventAction": eventAction
                    });
                }
                window['optimizely'] = window['optimizely'] || [];
                window.optimizely.push(["trackEvent", eventAction]);
            } catch (e) { }
        }

        if ($("#OAS_Position1").html() != null) {
            if ($("#OAS_Position1").html().indexOf('empty.gif') > -1) {
                $("#OAS_Position1").detach();
                $("#Hidden_OAS_Position1").detach();
                //$("#SlideUpContainer").detach();
            } else {
                $('#OAS_Position1').click(function () {
                    trackAction(this);
                });
            }
        };

        if ($("#OAS_x50").html() != null) {
            if ($("#Hidden_OAS_x50").html().indexOf('empty.gif') > -1) {
                $("#OAS_x50").detach();
                $("#Hidden_OAS_x50").detach();
            } else {
                $('#OAS_x50').click(function () {
                    trackAction(this);
                });
            }
        };

        if ($("#OAS_x51").html() != null) {
            if ($("#OAS_x51").html().indexOf('empty.gif') > -1) {
                $("#OAS_x51").detach();
                $("#Hidden_OAS_x51").detach();
            } else {
                $('#OAS_x51').click(function () {
                    trackAction(this);
                });
            }
        };


        if ($("#OAS_x52").html() != null) {
            if ($("#OAS_x52").html().indexOf('empty.gif') > -1) {
                $("#OAS_x52").detach();
                $("#Hidden_OAS_x52").detach();
            } else {
                $('#OAS_x52').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x53").html() != null) {
            if ($("#OAS_x53").html().indexOf('empty.gif') > -1) {
                $("#OAS_x53").detach();
                $("#Hidden_OAS_x53").detach();
            } else {
                $('#OAS_x53').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x55").html() != null) {
            if ($("#OAS_x55").html().indexOf('empty.gif') > -1) {
                $("#OAS_x55").detach();
                $("#Hidden_OAS_x55").detach();
            } else {
                $('#OAS_x55').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x56").html() != null) {
            if ($("#OAS_x56").html().indexOf('empty.gif') > -1) {
                $("#OAS_x56").detach();
                $("#Hidden_OAS_x56").detach();
            } else {
                $('#OAS_x56').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x62").html() != null) {
            if ($("#OAS_x62").html().indexOf('empty.gif') > -1) {
                $("#OAS_x62").detach();
                $("#Hidden_OAS_x62").detach();
            } else {
                $('#OAS_x62').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x63").html() != null) {
            if ($("#OAS_x63").html().indexOf('empty.gif') > -1) {
                $("#OAS_x63").detach();
                $("#Hidden_OAS_x63").detach();
            } else {
                $('#OAS_x63').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x64").html() != null) {
            if ($("#OAS_x64").html().indexOf('empty.gif') > -1) {
                $("#OAS_x64").detach();
                $("#Hidden_OAS_x64").detach();
            } else {
                $('#OAS_x64').click(function () {
                    trackAction(this);
                });
            }
        };

        if ($("#OAS_x65").html() != null) {
            if ($("#OAS_x65").html().indexOf('empty.gif') > -1) {
                $("#OAS_x65").detach();
                $("#Hidden_OAS_x65").detach();
            } else {
                $('#OAS_x65').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x66").html() != null) {
            if ($("#OAS_x66").html().indexOf('empty.gif') > -1) {
                $("#OAS_x66").detach();
                $("#Hidden_OAS_x66").detach();
            } else {
                $('#OAS_x66').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x67").html() != null) {
            if ($("#OAS_x67").html().indexOf('empty.gif') > -1) {
                $("#OAS_x67").detach();
                $("#Hidden_OAS_x67").detach();
            } else {
                $('#OAS_x67').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x68").html() != null) {
            if ($("#OAS_x68").html().indexOf('empty.gif') > -1) {
                $("#OAS_x68").detach();
                $("#Hidden_OAS_x68").detach();
            } else {

                $('#OAS_x68').click(function () {
                    trackAction(this);
           
                });
            }
        };

        if ($("#OAS_x69").html() != null) {
            if ($("#OAS_x69").html().indexOf('empty.gif') > -1) {
                $("#OAS_x69").detach();
                $("#Hidden_OAS_x69").detach();
            } else {
                $('#OAS_x69').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x77").html() != null) {
            if ($("#OAS_x77").html().indexOf('empty.gif') > -1) {
                $("#OAS_x77").detach();
                $("#Hidden_OAS_x77").detach();
            } else {
                $('#OAS_x77').click(function () {
                    trackAction(this);
                });
            }
        };


        if ($("#OAS_x81").html() != null) {
            if ($("#OAS_x81").html().indexOf('empty.gif') > -1) {
                $("#OAS_x81").detach();
                $("#Hidden_OAS_x81").detach();
            } else {
                $('#OAS_x81').click(function () {
                    trackAction(this);
                });
            }
        };

        if ($("#OAS_x82").html() != null) {
            if ($("#OAS_x82").html().indexOf('empty.gif') > -1) {
                $("#OAS_x82").detach();
                $("#Hidden_OAS_x82").detach();
            } else {
                $('#OAS_x82').click(function () {
                    trackAction(this);
                });
            }
        };

        if ($("#OAS_x84").html() != null) {
            if ($("#OAS_x84").html().indexOf('empty.gif') > -1) {
                $("#OAS_x84").detach();
                $("#Hidden_OAS_x84").detach();
            } else {
                $('#OAS_x84').click(function () {
                    trackAction(this);
                });
            }
        };

        if ($("#OAS_x85").html() != null) {
            if ($("#OAS_x85").html().indexOf('empty.gif') > -1) {
                $("#OAS_x85").detach();
                $("#Hidden_OAS_x85").detach();
            } else {
                $('#OAS_x85').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x86").html() != null) {
            if ($("#OAS_x86").html().indexOf('empty.gif') > -1) {
                $("#OAS_x86").detach();
                $("#Hidden_OAS_x86").detach();
            } else {
                $('#OAS_x86').click(function () {
                    trackAction(this);
                });
            }
        };

        if ($("#OAS_x88").html() != null) {
            if ($("#OAS_x88").html().indexOf('empty.gif') > -1) {
                $("#OAS_x88").detach();
                $("#Hidden_OAS_x88").detach();
            } else {
                $('#OAS_x88').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x91").html() != null) {
            if ($("#OAS_x91").html().indexOf('empty.gif') > -1) {
                $("#OAS_x91").detach();
                $("#Hidden_OAS_x91").detach();
            } else {
                $('#OAS_x91').click(function () {
                    trackAction(this);
                });
            }
        };
        if ($("#OAS_x92").html() != null) {
            if ($("#OAS_x92").html().indexOf('empty.gif') > -1) {
                $("#OAS_x92").detach();
                $("#Hidden_OAS_x92").detach();
            } else {
                $('#OAS_x92').click(function () {
                    trackAction(this);
                });
            }
        };

        if ($("#OAS_x93").html() != null) {
            if ($("#OAS_x93").html().indexOf('empty.gif') > -1) {
                $("#OAS_x93").detach();
                $("#Hidden_OAS_x93").detach();
            } else {
                $('#OAS_x93').click(function () {
                    trackAction(this);
                });
            }
        };

        if ($("#OAS_x94").html() != null) {
            if ($("#OAS_x94").html().indexOf('empty.gif') > -1) {
                $("#OAS_x94").detach();
                $("#Hidden_OAS_x94").detach();
            } else {
                $('#OAS_x94').click(function () {
                    trackAction(this);
                });
            }
        };

        if ($("#OAS_x95").html() != null) {
            if ($("#OAS_x95").html().indexOf('empty.gif') > -1) {
                $("#OAS_x95").detach();
                $("#Hidden_OAS_x95").detach();
            } else {
                $('#OAS_x95').click(function () {
                    trackAction(this);
                });
            }
        };

        if ($("#OAS_x96").html() != null) {
            if ($("#OAS_x96").html().indexOf('empty.gif') > -1) {
                $("#OAS_x96").detach();
                $("#Hidden_OAS_x96").detach();
            } else {
                $('#OAS_x96').click(function () {
                    trackAction(this);
                });
            }
        };

        if ($("#OAS_x88").html() != null) {
            if ($("#OAS_x88").html().indexOf('empty.gif') > -1) {
                $("#OAS_x88").detach();
                $("#Hidden_OAS_x88").detach();
            } else {
                $('#OAS_x88').click(function () {
                    trackAction(this);
                });
            }
        };


    });

})(jQuery);;
﻿(function ($) {

    $(document).ready(function () {

        //Click Event for Pay for Click Programs
        $(".program-details-page .visit-site a, .program-details-logo a").click(function (e) {

            if (typeof (SaveClick) == 'function' && $(this).attr("data-track-clicks") == "1") {

                e.preventDefault();
                var programProductId = $(this).attr("data-program-product-id");
                var programId = $(this).attr("data-program-id");
                var position = 1;
                var listingTypeId = 1;
                var pageNumber = 1;
                var redirectURL = $(this).attr("data-redirect-url");
                var programName = $(this).attr("data-program-name");

                //Push GTM Event
                try {
                    if (typeof dataLayer != 'undefined') {
                        dataLayer.push({
                            "event": "gaEvent",
                            "eventCategory": "client",
                            "eventAction": "cpc-click",
                            "eventLabel": programId,
                            "programProductId": programProductId,
                            "position": position,
                            "pageNumber": pageNumber,
                        });
                    }
                } catch (e) { }

                //Sets Optimizely Goal.
                if (window.optimizely != undefined) {
                    window['optimizely'].push(["trackEvent", "ad_click_cpc"]);
                }

                //Calls Tracking and redirects user to the correct Click Through URL.
                SaveClick(programProductId, listingTypeId, pageNumber, position, redirectURL);

            }

        });

    });
    
})(jQuery);


function form_wizard_html_completed(data) {
    
    if (data == "NOMATCH") {

        username = ""; 
        if (FormsEngine.hasOwnProperty("UserFullName") && FormsEngine.UserFullName != 'null' && FormsEngine.UserFullName != 'undefined') {
            username = FormsEngine.UserFullName + ", "; 
        }

        jQuery(".eddy-form-wizard-container .form-page-step-message-nomatch").html("<h2><strong>" + username + "Thank you for submitting your information. Unfortunately the program's requirements are not a match.</h2></strong>");
    }
};
