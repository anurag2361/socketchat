$(function () {
    var socket = io('/chat');
    var username = $('#user').val();
    var nochat = 0;//all chat history not loaded then 0 else 1.
    var msgcount = 0;//total no. of message displayed
    var oldinitdone = 0;//0 if old chat init not executed else 1
    var chatroomID;//variable for setting room
    var toUser;

    //passing data in connection
    socket.on('connect', function () {
        socket.emit('setuserdata', username);
        socket.on('broadcast', function (data) {
            document.getElementById("hey").innerHTML += '<li>' + data.description + '</li>';
            $('#hey').scrollTop($('#hey')[0].scrollHeight);
        });
    });

    //recieving onlineStack
    socket.on('onlineStack', function (stack) {
        $('#list').empty();
        $('#list').append($('<li>').append($('<button id="ubtn" class="btn btn-danger btn-block btn-lg"></button').text("Group").css({ "font-size": "18px" })));
        var totalonline = 0;
        for (var user in stack) {
            //setting txt1 and showing users button
            if (user == username) {
                var txt1 = $('<button class="boxF disabled"></button').text(user).css({ "font-size": "18px" });

            }
            else {
                var txt1 = $('<button id="ubtn" class="btn btn-success btn-md">').text(user).css({ "font-size": "18px" });
            }

            //setting txt2 and showing user's online status
            if (stack[user] == "Online") {
                var txt2 = $('<span class="badge"></span>').text("*" + stack[user]).css({ "float": "right", "color": "#009933", "font-size": "18px" });
                totalonline++;
            }
            else {
                var txt2 = $('<span class="badge"></span>').text(stack[user]).css({ "float": "right", "color": "#a6a6a6", "font-size": "18px" });
            }

            //showing all users
            $('#list').append($('<li>').append(txt1, txt2));
            $('#totalonline').text(totalonline);
        }
        $('#scrl1').scrollTop($('#scrl1').prop("scrollHeight"));
    });

    //what happens when button is clicked
    $(document).on("click", "#ubtn", function () {
        //empty messages
        $('#messages').empty();
        $('#typing').text("");
        msgcount = 0;
        nochat = 0;
        oldinitdone = 0;

        //assigning friend's name to whom we will send the message. If Group is selected here, value is group
        toUser = $(this).text();

        //show and hide info
        $('#frndname').text(toUser);
        $('#initmsg').hide();
        $('#chatform').show();//show chat form
        $('#sendbtn').hide();//hide send button so that empty messages are not sent

        //assign two names for chatroom for one-to-one as well as group chats
        if (toUser == "Group") {
            var currentroom = "Group-Group";
            var reverseroom = "Group-Group";
        }
        else {
            var currentroom = username + "-" + toUser;
            var reverseroom = toUser + "-" + username;
        }

        //setting room and joining
        socket.emit('setchatroom', { name1: currentroom, name2: reverseroom });

    });

    //setting roomID
    socket.on('setchatroom', function (chatroom) {
        //empty messages
        $('#messages').empty();
        $('#typing').text("");
        msgcount = 0;
        nochat = 0;
        oldinitdone = 0;

        //assign room id to roomID variable for 1-1 and group chat
        chatroomID = chatroom;
        console.log("chatroomID: " + chatroomID);

        //event for getting chat history on button click and room setting
        socket.emit('oldchatsinit', { chatroom: chatroomID, username: username, msgcount: msgcount });

    });

    //loading chats while scrolling
    $('#scrl2').scroll(function () {
        if ($('#scrl2').scrollTop() == 0 && nochat == 0 && oldinitdone == 1) {
            $('#loading').show();
            socket.emit('oldchats', { chatroom: chatroomID, username: username, msgcount: msgcount });
        }
    });

    //recieving old chats
    socket.on('oldchats', function (data) {
        if (data.chatroom == chatroomID) {
            oldinitdone = 1;//this implied first old chats event is completed
            if (data.result.length != 0) {
                $('#nochat').hide();//no more chats message is hidden here
                for (var i = 0; i < data.result.length; i++) {
                    //stylising chat messages
                    var chatdate = moment(data.result[i].created).format("MMMM Do YYYY, hh:mm:ss a");
                    var txt1 = $('<span></span>').text(data.result[i].msgFrom + " : ").css({ "color": "#006080" });
                    var txt2 = $('<span></span>').text(chatdate).css({ "float": "right", "color": "#a6a6a6", "font-size": "16px" });
                    var txt3 = $('<p></p>').append(txt1, txt2);
                    var txt4 = $('<p></p>').text(data.result[i].msg).css({ "color": "#000000" });
                    //showing chats in chatbox
                    $('#messages').prepend($('<li>').append(txt3, txt4));
                    msgcount++;
                }

                console.log(msgcount);
            }
            else {
                $('#nochat').show();//no more chat message is displayed
                nochat = 1;//preventing unwanted scroll
            }
            $('#loading').hide();//hide loading bar

            //scrollbar position while first 5 chat messages loads
            if (msgcount <= 5) {
                $('#scrl2').scrollTop($('#scrl2').prop("scrollHeight"));
            }
        }
    });

    //handling keyup event
    $('#mymsg').keyup(function () {
        if ($('#mymsg').val()) {
            $('#sendbtn').show();//showing send button
            socket.emit('typing');
        }
        else {
            $('#sendbtn').hide();//hiding send button to so that empty messages are not sent
        }
    });

    //recieve typing message
    socket.on('typing', function (msg) {
        var settime;
        //clear settimeout function added previously
        clearTimeout(settime);
        //show typing message
        $('#typing').text(msg);
        //showing it only for a some seconds
        settime = setTimeout(function () {
            $('#typing').text("");
        }, 3500);
    });

    //send message
    $('form').submit(function () {
        socket.emit('chatmsg', { msg: $('#mymsg').val(), msgTo: toUser, date: Date.now() });
        $('#mymsg').val("");
        $('#sendbtn').hide();
        return false;
    });

    //recieving message
    socket.on('chatmsg', function (data) {
        //styling of chat
        var chatdate = moment(data.date).format("MMMM Do YYYY,hh:mm:ss a");
        var txt1 = $('<span></span>').text(data.msgFrom + ":").css({ "color": "#006080" });
        var txt2 = $('<span></span>').text(chatdate).css({ "float": "right", "color": "#a6a6a6", "font-size": "16px" });
        var txt3 = $('<p></p>').append(txt1, txt2);
        var txt4 = $('<p></p>').text(data.msg).css({ "color": "#000000" });
        //showing chat in chatbox
        $('#messages').append($('<li>').append(txt3, txt4));
        msgcount++;
        console.log(msgcount);
        $('#typing').text("");
        $('#scrl2').scrollTop($('#scrl2').prop("scrollHeight"));
    });

    //on disconnection, pass data on connection
    socket.on('disconnect', function () {
        //showing and hiding info
        $('#list').empty();
        $('#messages').empty();
        $('#typing').text("");
        $('#frndname').text("Disconnected..");
        $('#loading').hide();
        $('#nochat').hide();
        $('#initmsg').show().text("Refresh Your Page...");
        $('#chatform').hide();
        msgcount = 0;
        nochat = 0;
    });

});