(function() {
    var canvas = $('canvas');
    var c = document.getElementById('canv').getContext('2d');
    var left = canvas.offset().left;
    var scrollTop = $(window).scrollTop();
    var elementOffset = canvas.offset().top;
    var distance = (elementOffset - scrollTop);
    var mouseDown = false;
    var touchDown = false;
    // var hasSigned = false;
    var lastX, lastY;
    var sigImgUrl;

    canvas.on('mousedown', function(e){
        mouseDown = true;
        lastX = e.clientX - left;
        lastY = e.clientY - distance;
    });

    canvas.on('mousemove', function(e){
        if (mouseDown) {
            var x = e.clientX - left;
            var y = e.clientY - distance;
            draw(x, y);
        }
    });

    canvas.on('mouseup', function(){
        mouseDown = false;
        // hasSigned = true;
        sigImgUrl = document.getElementById('canv').toDataURL();
        console.log(sigImgUrl);
        $('#sig').val(sigImgUrl);
    });


    function getTouches(evt) {
        return evt.touches;
    }

    canvas.on('touchstart', function(evt){
        touchDown = true;
        console.log("TOUCHDOWN!");
        lastX = getTouches(evt)[0].clientX - left;
        lastY = getTouches(evt)[0].clientY - distance;
    });

    canvas.on('touchmove', function(evt){
        console.log("TOUCH MOVE!");
        console.log(evt.touches[0].clientX);
        if (touchDown) {
            var x = evt.touches[0].clientX - left;
            var y = evt.touches[0].clientY - distance;
            draw(x, y);
        }
    });

    canvas.on('touchend', function(){
        console.log("TOUCH END");
        touchDown = false;
        // hasSigned = true;
        sigImgUrl = document.getElementById('canv').toDataURL();
        console.log(sigImgUrl);
        $('#sig').val(sigImgUrl);
    });

    function draw (x, y) {
        c.beginPath();
        c.moveTo(lastX, lastY);
        c.lineTo(x, y);
        c.strokeStyle = '#f2f4fb';
        c.lineWidth= 2;
        c.stroke();
        c.closePath();
        lastX = x; lastY = y;
    }
}());
