This is a html5 video player side by side with a slide view and a table of contents.  Javascript is used to load metadata for a presentation, and to keep all the parts of the UI in sync.  It also features pop-up slide thumbnails when hovering over the TOC entries, and it will automatically scale to the size of the browser window.

In the sample subdirectory are a few dummy slides and a sample metadata file 'transitions.xml'.  To make it work you'll need to edit transitions.xml to provide URLs to your video clips.  Once that is done, put it on a web server and use a url like this to see the basic operation:
 http://your.server/path/video.html?id=sample

