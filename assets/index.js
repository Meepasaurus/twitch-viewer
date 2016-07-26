'use strict';

var userList = [];

function parseUserData(data, isOnline){
  //console.log(data);
  var userDiv = $('<div class="user-container">');
  if (isOnline){
    //avatar
    userDiv.append($('<div class="user-logo">')
      .append($('<img src="' + data.stream.channel.logo + '" alt="' + data.stream.channel.name + ' avatar">')));
    //display name (username)
    userDiv.append($('<div class="user-text">').append($('<h4>' + data.stream.channel.name + '</h4>')));
    //x icon for user removal
    userDiv.append($('<div class="user-remove">').append($('<a href="#"><i class="fa fa-times-circle" aria-hidden="true"></i></a>')));
    $('#users-online').append($('<div class="collapse-user collapse in">').append(userDiv));
  } else if (isOnline === false) {
    userDiv.append($('<h4>' + data.display_name + '</h4>'));
    $('#users-offline').append(userDiv);
  } else {
    //null
    $('#users-offline').append(userDiv)
      .append('<h4>' + data + '</h4><p>This user no longer exists.</p>');
  }
}

function getOfflineUser(channelURL){
  $.ajax({
    dataType: 'jsonp',
    url: channelURL,
    success: function(data){
      parseUserData(data, false);
    },
    error: function(err){
      console.log(err);
    }
  });
}

function updateUserList(){
  //console.log(userList);
  $.each(userList, function(i, username){
    //console.log(username);
    $.ajax({
      dataType: 'jsonp',
      url: 'https://api.twitch.tv/kraken/streams/' + username,
      success: function(data){
        if (data.hasOwnProperty('error')){
          //user no longer exists or never did
          parseUserData(username, null);
        } else {
          if (data.stream === null){
            //channel is offline, need to request channel data
            getOfflineUser(data._links.channel);
          } else {
            //parse channel info
            parseUserData(data, true);
          }
        }
      },
      error: function(err){
        console.log(err); 
      }
    });
  });
}

$(document).ready(function(){
  //var defaultList = 'brunofin';
  var defaultList = 'esl_sc2, ogamingsc2, cretetion, freecodecamp, storbeck, habathcx, robotcaleb, noobs2ninjas, brunofin, comster404';
  
  if (localStorage.hasOwnProperty('userList')){
    console.log("Found Local List");
    userList = localStorage.getItem('userList').split(", ");
    console.log(userList);
  } else {
    console.log("Initializing List");
    localStorage.setItem('userList', defaultList);
    userList = defaultList.split(", ");
  }
  
  updateUserList();
  
  //toggle online userlist
  $('#btn-online').on('click', function(e){
    e.preventDefault();
    $('#caret-online').toggleClass('open');
  });
  
  //toggle offline userlist
  $('#btn-offline').on('click', function(e){
    e.preventDefault();
    $('#caret-offline').toggleClass('open');
  });
  
  //delete user from DOM
  $('#collapse-user-list').on('hidden.bs.collapse', '.collapse-user', function (){
    $(this).remove();
  })
  
  //remove user from list
  $('#collapse-user-list').on('click', '.user-remove>a', function(e){
    e.preventDefault();
    var deleteUser = $(this).closest('.collapse-user');
    deleteUser.collapse('hide');
    //remove from userList
    userList.splice(userList.indexOf($(this).closest('.user-container').find('h4').html()), 1);
    //update localStorage
    localStorage.setItem('userList', userList.join(", "));
    //event above will fire
  });
  
  //reset to demo userlist
  $('#btn-reset').on('click', function(e){
    console.log("Resetting List");
    localStorage.setItem('userList', defaultList);
    userList = defaultList.split(", ");
    console.log(userList);
    //todo
    //refresh list
  });
  
});