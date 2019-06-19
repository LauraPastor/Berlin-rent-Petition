
console.log($('body').width());

function getConfirmation(){
    var retVal = confirm("Are you SURE you want to delete your account?");
    if( retVal == true ){
        return true;
    }
    else {
        $('#delete').val('stop');
        return true;
    }
}

$('.sure').on('click', function(){
    console.log("clicked");
    getConfirmation();
});

console.log("test");

$('.hamburger').on('click', function(){
    console.log("clicked mobile menu");
    $('.hamburger').css("display", "none");
    $('.cross').removeClass('hidden');
    $('.mobilelinks').addClass('activeHeader');
    // $('.hide').addClass('hidden');

});

$('.cross').on('click', function(){
    $('.hamburger').css("display", "block");
    $('.cross').addClass('hidden');
    $('.mobilelinks').removeClass('activeHeader');
    // $('.hide').removeClass('hidden');
});

$("body").on("submit", "form", function(){
    $(this).submit(function(){
        return false;
    });
    $('.btn').css("background-color", "#D4D9ED");

    return true;
});
