'use strict';

var TwitchViewer = function(users){

  var userList = users;

  return {

    //creates and appends div to proper section
    parseUserData: function(data, isOnline){
      //console.log(data);
      var userDiv = $('<div class="user-container">'),
          collapser = $('<div class="collapse-user collapse">'),
          status = '',
          game = '',
          viewers = 0;
      
      if (isOnline){
        console.log(data);

        //avatar
        userDiv.append($('<div class="user-logo">')
          .append($('<img src="' + data.stream.channel.logo + '" alt="' + data.stream.channel.name + ' avatar">')));
        
        //display name - status - game
        status = data.stream.channel.status || '';
        game = data.stream.game ? 'Streaming: ' + data.stream.game : '';
        viewers = data.stream.viewers ? data.stream.viewers + ' viewers' : 0;

        userDiv.append($('<div class="user-text">').append($('<h4>' + data.stream.channel.display_name + '</h4><p class=user-status>' + status + '</p><p class=user-game>' + game + ' - ' + viewers+ '</p>')));

        //x icon for user removal
        userDiv.append($('<div class="user-remove">').append($('<a href="#"><i class="fa fa-times-circle" aria-hidden="true"></i></a>')));
        $('#users-online').append(collapser.append(userDiv));
      } else if (isOnline === false) {
        //avatar
        userDiv.append($('<div class="user-logo">')
          .append($('<img src="' + data.logo + '" alt="' + data.name + ' avatar">')));
        
        //display name - status
        status = data.status || '';

        userDiv.append($('<div class="user-text">').append($('<h4>' + data.display_name + '</h4><p class=user-status>' + status + '</p>')));
        
        //x icon for user removal
        userDiv.append($('<div class="user-remove">').append($('<a href="#"><i class="fa fa-times-circle" aria-hidden="true"></i></a>')));
        $('#users-offline').append(collapser.append(userDiv));
      } else {
        //user does not currently exist
        
        //default avatar
        userDiv.append($('<div class="user-logo">')
          .append($('<img src="images/default_avatar.png" alt="default avatar">')));
        
        //username - null status
        userDiv.append($('<div class="user-text">').append($('<h4>' + data + '</h4><p class="null-status">This user no longer exists.</p>')));

        //x icon for user removal
        userDiv.append($('<div class="user-remove">').append($('<a href="#"><i class="fa fa-times-circle" aria-hidden="true"></i></a>')));
        $('#users-offline').append(collapser.append(userDiv));
        }
      //smoothly add content to DOM
      collapser.collapse('toggle');
    },

    getOfflineUser: function(channelURL){
      var thisTwitchViewer = this;

      $.ajax({
        dataType: 'jsonp',
        url: channelURL,
        success: function(data){
          thisTwitchViewer.parseUserData(data, false);
        },
        error: function(err){
          console.log(err);
        }
      });
    },

    updateUserList: function(){
      var thisTwitchViewer = this;
      
      $.each(userList, function(i, username){
        //console.log(username);
        $.ajax({
          dataType: 'jsonp',
          url: 'https://api.twitch.tv/kraken/streams/' + username,
          success: function(data){
            if (data.hasOwnProperty('error')){
              //user no longer exists or never did
              thisTwitchViewer.parseUserData(username, null);
            } else {
              if (data.stream === null){
                //channel is offline, need to request channel data
                thisTwitchViewer.getOfflineUser(data._links.channel);
              } else {
                //parse channel info
                thisTwitchViewer.parseUserData(data, true);
              }
            }
          },
          error: function(err){
            console.log(err); 
          }
        });
      });
    }

  };

};

$(document).ready(function(){
  var defaultList = 'esl_sc2, ogamingsc2, cretetion, freecodecamp, storbeck, habathcx, robotcaleb, noobs2ninjas, brunofin, comster404',
      userList = '';
  
  if (localStorage.hasOwnProperty('userList')){
    console.log("Found Local List");
    userList = localStorage.getItem('userList').split(", ");
    console.log(userList);
  } else {
    console.log("Initializing List");
    localStorage.setItem('userList', defaultList);
    userList = defaultList.split(", ");
  }
  
  var myTwitchViewer = new TwitchViewer(userList);
  
  myTwitchViewer.updateUserList();
  
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
  });
  
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