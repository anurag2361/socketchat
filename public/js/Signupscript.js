//check unique username and email and verifying details
$(function () {
    var socket = io('/signup');
    var uflag = eflag = pflag = 0;//for username,email and password
    //checking unique username
    $('#uname').keyup(function () {
        var uname = $('#uname').val();
        if (uname.length < 5) {
            uflag = 0;
            $('#ik').hide();
            $('#ir').show();
            $('#error1').show().text("Username should have 5 or more character");
        }
        else {
            socket.emit('checkUname', uname);
            socket.on('checkUname', function (data) {
                if (data == 1) {
                    uflag = 1;
                    $('#ik').show();
                    $('ir').hide();
                    $('#error1').hide();
                }
                else {
                    uflag = 0;
                    $('#ik').hide();
                    $('#ir').show();
                    $('#error1').show().text("Username exists. Please try another");

                }
            });
        }
    });

    //checking email
    $('#email').keyup(function () {
        var email = $('#email').val();
        var atpos = email.indexOf("@");//for position of @ sign
        var dotpos = email.lastIndexOf(".");

        if (atpos < 1 || dotpos < atpos + 2 || dotpos + 2 >= email.length) {
            eflag = 0;
            $('#ik1').hide();
            $('#ir1').show();
            $('#error1').show().text("Please Enter Valid Email.");
        }
        else {
            socket.emit('checkEmail', email);
            socket.on('checkEmail', function (data) {
                if (data == 1) {
                    eflag = 1;
                    $('#ik1').show();
                    $('#ir1').hide();
                    $('#error1').hide();
                }
                else {
                    eflag = 0;
                    $('#ik1').hide();
                    $('#ir1').show();
                    $('#error1').show().text("Email exists. Please try another");
                }
            });
        }
    });

    //checking password
    $('#pass').keyup(function () {
        var pass = $('#pass').val();
        if (pass.length < 5) {
            pflag = 0;
            $('#ik2').hide();
            $('#ir2').show();
            $('#error1').show().text("Password Should Have Atleast 5 Characters.");
        }
        else {
            pflag = 1;
            $('#ik2').show();
            $('#ir2').hide();
            $('#error1').hide();
        }
    });

    //on form submit code.
    $('form').submit(function () {
        //validate action.
        if (uflag == 1 && eflag == 1 && pflag == 1) {
            return true;
        }
        else {
            $('#error1').show().text("Input Is Incorrect.");
            return false;
        }
    });

})