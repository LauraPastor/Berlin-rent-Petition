exports.cleanUrl = function(url) {
    if (url === '') {
        return '';
    } else if (url.startsWith(`https://`) || url.startsWith(`http://`)){
        console.log("correct url");
        return url;
    } else {
        return `http://${url}`;
    }
};
