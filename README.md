HTML5 Video + Slides UI
-----------------------

This is HTML, Javascript and CSS that implement a video player side-by side with a slide viewer and a table of contents.  Javascript is used to load metadata for a presentation, and to keep all the parts of the UI in sync as the video plays and the user interacts with the table of contents and video controls.  It also features pop-up slide thumbnails when hovering over the TOC entries, and the UI will automatically scale to the size of the browser window.

In the sample subdirectory are a few dummy slides and a sample metadata file 'transitions.xml'.  To make it work you'll need to edit transitions.xml to provide URLs to your video clips.  You will probably want at least two formats in order to provide better support across browsers.  Mp4 plus ogv or webm should do the trick.  

Once that is done, put it on a web server and use a url like this to see the basic operation:
* http://your.server/path/video.html?id=sample


