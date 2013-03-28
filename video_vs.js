(function ($) {
    //Slide Transition object
    function transition(title, time) {
        this.title = title;
        this.time = time;
        //This is the time of the previous TOC entry.  If the transition has a toc entry then time and toctime are the same.
        this.toctime = 0;
    }

    //Slide transitions: A list of transition object ordered by time.
    var transitions = new Array();

    //Members
    var currentSlideKey = 1;
    var previousSlideTime = 0;
    var baseUrl = "";
    var extent = "jpg";
    var lectureTitle = "";
    var lectureDate = "";

    $(document).ready(function () {
        //Set initial size and set resize event handler
        resizePage();
        $(window).resize(resizePage);
        //Load presentation data and fill the TOC
        loadPresentation();
        //Start the slide change thread
        setInterval(checkSlideChange, 1000);
    });

    //Slide change
    function checkSlideChange() {
        if (transitions.length == 0) return;
        var currentPos = $("#mediaControl").prop("currentTime");
        var newSlide = binarySearch((currentPos * 1000) + 1);  //The plus one overcomes any rounding error.

        if (newSlide != currentSlideKey) {
            currentSlideKey = newSlide;
            changeSlide(transitions[newSlide], newSlide);
        }
    }

    function changeSlide(t, ti) {
        //Update the image
        $("#slideimg").attr("src", baseUrl + "/" + "slide" + ti + "." + extent);
        //Set the background color and scroll the new toc entry into view.
        //Not all slide transition have a toc entry.
        if ($('#toc' + t.toctime).length > 0) {
            //Clear the background color style for the previous toc entry
            $('#toc' + previousSlideTime).css("background-color", "inherit");
            $('#toc' + t.toctime).css("background-color", "yellow");
            previousSlideTime = t.toctime;
            scrollIntoView("#toc" + t.toctime, "#toc");
        }
    }

    // Scroll such that the element is in view, and if they exist
    // make the next/previous elements visible as well.
    function scrollIntoView(element, container) {
        var containerTop = $(container).scrollTop();
        var containerBottom = containerTop + $(container).height();
        var elemTop = $(element).prop("offsetTop");
        var elemBottom = elemTop + $(element).height();
        if (elemTop - $(element).height() < containerTop) {
            $(container).scrollTop(elemTop - $(element).height());
        } else if (elemBottom + $(element).height() > containerBottom) {
            $(container).scrollTop(elemBottom - $(container).height() + $(element).height());
        }
    }

    function loadPresentation() {
        var args = parseQueryString();
        if (!args.id) {
            alert("Error: No presentation specified.");
            return;
        }

        // If the ID string ends in ".xml" interpret as the path to the file
        // Otherwise interpret as the directory in which transitions.xml will be found.
        var loc = location.protocol + "//" + location.host + location.pathname;
        var path = loc.substring(0, loc.lastIndexOf("/"));
        baseUrl = path + "/" + args.id;
        var extent = args.id.substring(args.id.length - 4);
        //Assume baseUrl is the same as the path to the metadata unless specified in the metadata
        //The time below is added to make each url unique to bypass the browser cache.
        if (extent == ".xml") {
            baseUrl = baseUrl.substr(0, baseUrl.lastIndexOf("/")); // strip the last element
            path = path + "/" + args.id + "?" + +(new Date()).getTime();
        }
        else {
            path = path + "/" + args.id + "/transitions.xml?" + +(new Date()).getTime();
        }

        ajaxQuery(path);
    }

    function ajaxQuery(path) {
        //Note, cross domain fails in IE
        $.ajax({
            url: path,
            success: function (result) {
                parseSlideShowData(result);
                initToc();
                repositionThumbs();
            },
            dataType: "xml",
            error: function (jqxhr, status, errorThrown) { 
                alert(status + "; " + errorThrown);
            }
        });
    }

    function parseSlideShowData(xml) {
        if (xml.documentElement.nodeName == "SlideshowData") {
            var de = xml.documentElement;
            for (var i = 0; i < de.childNodes.length; i++) {
                if (de.childNodes[i].nodeName == "Slides") {
                    parseSlidesNode(de.childNodes[i]);
                }
                else if (de.childNodes[i].nodeName == "SlideTransitions") {
                    parseSlideTransitions(de.childNodes[i]);
                }
                else if (de.childNodes[i].nodeName == "Lecture") {
                    parseLectureNode(de.childNodes[i]);
                }
                else if (de.childNodes[i].nodeName == "AudioClips") {
                    parseAudioClips(de.childNodes[i]);
                }
                else if (de.childNodes[i].nodeName == "VideoClips") {
                    parseVideoClips(de.childNodes[i]);
                }
            }
        }
    }

    function parseSlidesNode(node) {
        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes[i].nodeName == "BaseURL") {
                baseUrl = node.attributes[i].value;
            }
            else if (node.attributes[i].nodeName == "Extent") {
                extent = node.attributes[i].value;
            }
        }
    }

    function parseLectureNode(node) {
        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes[i].nodeName == "Title") {
                $("#lectureTitle").append(node.attributes[i].value);
            }
            else if (node.attributes[i].nodeName == "Date") {
                lectureDate = node.attributes[i].value;
            }
        }
    }

    function parseSlideTransitions(node) {
        for (var i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeName == "st") {
                parseSlideTransitionNode(node.childNodes[i]);
            }
        }
    }

    function parseVideoClips(node) {
        for (var i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeName == "VideoClip") {
                parseMediaClipNode(node.childNodes[i]);
            }
        }
    }

    function parseAudioClips(node) {
        for (var i = 0; i < node.childNodes.length; i++) {
            if (node.childNodes[i].nodeName == "AudioClip") {
                parseMediaClipNode(node.childNodes[i]);
            }
        }
    }

    function parseMediaClipNode(node) {
        var url = "";
        var type = "";
        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes[i].nodeName == "URL") {
                url = node.attributes[i].value;
            }
            else if (node.attributes[i].nodeName == "Type") {
                type = node.attributes[i].value;
            }
        }

        if ((url != "") && (type != "")) {
            $("#mediaControl").append('<source src="' + url + '" type="' + type + '"></source>');
        }
    }

    function parseSlideTransitionNode(node) {
        var title = "";
        var time = "";
        for (var i = 0; i < node.attributes.length; i++) {
            if (node.attributes[i].nodeName == "title") {
                title = node.attributes[i].value;
            }
            else if (node.attributes[i].nodeName == "time") {
                time = node.attributes[i].value;
            }
        }

        if ((title != "") && (time != "")) {
            title = title.substring(0, 75);  //Limit the length of titles
            transitions.push(new transition(title, time));
        }
    }

    function parseQueryString() {
        var querystring = location.search;
        var args = new Object();
        querystring = querystring.substring(1); //chop off the '?'
        var pairs = querystring.split(",");
        for (var i = 0; i < pairs.length; i++) {
            var pos = pairs[i].indexOf('=');
            if (pos == -1) continue;
            var argname = pairs[i].substring(0, pos);
            var value = pairs[i].substring(pos + 1);
            args[argname] = unescape(value);
        }
        return args;
    }

    function initToc() {
        var tocTime = 0;
        var tocCount = 0;
        var prevSlideTitle = null;
        for (var i = 0; i < transitions.length; i++) {
            var titleText = transitions[i].title;
            if (titleText == null) { titleText = "Slide " + (i + 1); }

            if (titleText != prevSlideTitle) {
                appendTocEntry(titleText, transitions[i].time, i, tocCount);
                tocTime = transitions[i].time;
                tocCount++;
            }
            prevSlideTitle = titleText;
            transitions[i].toctime = tocTime;

            if (i == 0) {
                if ($('#toc' + transitions[i].time).length > 0) {
                    $('#toc' + transitions[i].time).css("background-color", "Yellow");
                }
            }
        }
    }

    function appendTocEntry(entryTitle, time, index, transition) {
        var trimmedTitle = entryTitle;
        if (entryTitle.length > 36) {
            trimmedTitle = entryTitle.substring(0, 33) + " ...";  //Limit the length of titles
        }
        trimmedTitle = mSecsToTimeString(time) + " - " + trimmedTitle;
        var id = "toc" + time;
        var thumb = '<img src="' + baseUrl + '/slide' + index + '.' + extent + '"/>';
        var $row = $('<tr id="' + id + '"><td>' + trimmedTitle + thumb + '</td></tr>"');
        $row.attr('data-index', transition);
        $row.click(function () { $("#mediaControl").prop("currentTime", time / 1000); });
        $("#tocTable").append($row);
    }

    function mSecsToTimeString(msecs) {
        var date = new Date();
        date.setTime(msecs);
        var h = twoPlaceNumber(date.getUTCHours());
        var m = twoPlaceNumber(date.getUTCMinutes());
        var s = twoPlaceNumber(date.getUTCSeconds());
        return h + ":" + m + ":" + s;
    }

    function twoPlaceNumber(num) {
        if (num < 10) {
            return "0" + num;
        }
        return num;
    }

    function repositionThumbs() {
        // After filling the toc or resizing, style the thumbs so they'll appear at the right places
        if ($("table#tocTable img").length != 0) {
            $("table#tocTable img").css("left", ($("#tocwrapper").width() + 4) + "px");
            var top = $("#tocwrapper").height() - 240 - 2;
            if (top > 0) {
                top = top / 2;
            }
            $("table#tocTable img").css("top", top + "px");
        }
    }

    function log(msg) {
        $("#log").append(msg);
    }

    function clearLog() {
        $("#log").empty();
    }

    function resizePage() {
        var winWidth = $(window).width();
        var mainWidth = winWidth - 42;
        if (mainWidth < 630) { mainWidth = 630; }
        var mainHeight = mainWidth * 9 / 16;
        var mainTop = $("#main").prop("offsetTop");
        var borderWidth = 3;
        var headerHeight = $("#header").height();
        var viewportHeight = mainHeight - headerHeight - 1;
        var slideHeight = viewportHeight;
        var slideWidth = slideHeight * 1.33334;
        var playerWidth = mainWidth - slideWidth - 1;
        var playerHeight = playerWidth / 1.33334;
        var tocHeaderHeight = 20;
        var tocTop = playerHeight + headerHeight + mainTop + borderWidth;
        var tocHeight = viewportHeight - playerHeight - tocHeaderHeight - 1;

        $("#mediaControl").width(playerWidth);
        $("#mediaControl").height(playerHeight);

        $("#slideimg").width(slideWidth);
        $("#slideimg").height(slideHeight);

        $("#tocHeader").width(playerWidth);
        $("#tocHeader").height(tocHeaderHeight);
        $("#tocHeader").css("top", tocTop + "px");

        $("#tocwrapper").css("top", (tocTop + tocHeaderHeight + 1) + "px");
        $("#tocwrapper").width(playerWidth);
        $("#tocwrapper").height(tocHeight);

        $("#toc").width(playerWidth);
        $("#toc").height(tocHeight);

        $("#main").width(mainWidth);
        $("#main").height(mainHeight);

        repositionThumbs();
    }

    // Return the transitions array index for the element with timestamp
    // less than or equal to the given time where the index+1'th element has a timestamp
    // greater than the given time.
    function binarySearch(targetTime) {
        var left = 0;
        var right = transitions.length - 1;
        while (true) {
            var mid = Math.floor((left + right) / 2);
            if (transitions[mid].time <= targetTime) {
                if (mid + 1 < transitions.length) {
                    if (transitions[mid + 1].time > targetTime)
                        return mid;
                }
                else {
                    // last element: return it.
                    return mid;
                }
                left = mid + 1;
            }
            else {
                if (mid == 0) {
                    // first element: return it.
                    return mid;
                }
                right = mid - 1;
            }
        }
    }

})(jQuery)
