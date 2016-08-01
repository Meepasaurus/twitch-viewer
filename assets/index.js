'use strict';

var TwitchViewer = function(defaultList){

  var localUserList = [],
      userObjs = {};

  //check for saved user list
  if (localStorage.hasOwnProperty('userList')){
    console.log("Found Local List");
    localUserList = localStorage.getItem('userList').split(", ");
    console.log(localUserList);
  } else {
    console.log("Initializing List");
    localStorage.setItem('userList', defaultList);
    localUserList = defaultList.split(", ");
  }

  return {

    createUserObj: function(newUserName){
      var collapser = $('<div class="collapse-user collapse">'), //top-most individual user container
          userDiv = $('<div class="user-container">'),
          userLink = $('<a class="user" target="_blank" rel="noopener noreferrer" href="https://www.twitch.tv/' + newUserName + '">');

        //avatar
        userLink.append($('<div class="user-logo">')
          .append($('<img>')));
        
        //display name - status - game
        userLink.append($('<div class="user-text">')
          .append($('<h4 class="display-name"></h4><p class="user-status"></p><p class="user-game"></p>')));

        userDiv.append(userLink);

        //x icon for user removal
        userDiv.append($('<div class="user-remove">')
          .append($('<a class="x" href="#"><i class="fa fa-times-circle" aria-hidden="true"></i></a>')));
        
        //add to userObjs
        collapser.append(userDiv);
        userObjs[newUserName] = {
          collapser: collapser,
          logo: collapser.find('img'),
          displayName: collapser.find('.display-name'),
          status: collapser.find('.user-status'),
          game: collapser.find('.user-game'),
          isOnline: null
        };
    },

    deleteUser: function(userRemoveLink){
      var deleteUser = $(userRemoveLink).closest('.collapse-user'),
          deleteUserName = $(userRemoveLink).closest('.user-container').find('h4').html().toLowerCase();

      //remove from userList and userObjs
      localUserList.splice(localUserList.indexOf(deleteUserName), 1);
      delete userObjs[deleteUserName];

      //update localStorage
      localStorage.setItem('userList', localUserList.join(", "));
      deleteUser.collapse('hide');
      
      //remove from DOM, note not using .on hidden.bs.collapse event because users will be hidden when moving containers between online and offline lists
      setTimeout(function(){
        $(deleteUser).remove();
      }, 5000);

    },

    resetLocalList: function(){
      localStorage.setItem('userList', defaultList);
      localUserList = defaultList.split(", ");
      location.reload();
    },

    //updates display data and appends div to proper section
    parseUserData: function(data, isOnline){
      //console.log(data);
      
      var collapser = $('<div class="collapse-user collapse">'), //top-most individual user container
          userDiv = $('<div class="user-container">'),
          status = '',
          game = '',
          viewers = 0;
      
      if (isOnline){
        //console.log(data);

        var channelLogo = data.stream.channel.logo,
            channelName = data.stream.channel.name,
            thisUserObj = userObjs[channelName];

        //avatar
        thisUserObj.logo.attr({'src': channelLogo, 'alt': channelName + ' avatar'});
        
        //display name - status - game
        status = data.stream.channel.status || '';
        game = data.stream.game ? 'Streaming: ' + data.stream.game : '';
        viewers = data.stream.viewers ? data.stream.viewers + ' viewers' : 0;

        thisUserObj.displayName.text(data.stream.channel.display_name);
        thisUserObj.status.text(status);
        thisUserObj.game.text(game + ' - ' + viewers);

        //append to DOM if it isn't already
        if(thisUserObj.isOnline === null){
          thisUserObj.isOnline = true;
          $('#users-online').append(thisUserObj.collapser);
          thisUserObj.collapser.collapse('show');
        }
      } else if (isOnline === false) {
        //console.log(data);

        var channelLogo = data.logo,
            channelName = data.name,
            thisUserObj = userObjs[channelName];

        //avatar
        thisUserObj.logo.attr({'src': channelLogo, 'alt': channelName + ' avatar'});
        
        //display name - status
        status = data.status || '';

        thisUserObj.displayName.text(data.display_name);
        thisUserObj.status.text(status);        
        
        //append to DOM if it isn't already
        if(thisUserObj.isOnline === null){
          thisUserObj.isOnline = false;
          $('#users-offline').append(thisUserObj.collapser);
          thisUserObj.collapser.collapse('show');
        }
      } else {
        //user does not currently exist
        var thisUserObj = userObjs[data];

        //avatar
        thisUserObj.logo.attr({'src': 'images/default_avatar.png', 'alt': 'default avatar'});
        
        //display name - status
        status = data.status || '';

        thisUserObj.displayName.text(data);
        thisUserObj.status.html('<p class="null-status">This user no longer exists.</p>');        
        
        //append to DOM if it isn't already
        if(thisUserObj.isOnline === null){
          thisUserObj.isOnline = false;
          $('#users-offline').append(thisUserObj.collapser);
          thisUserObj.collapser.collapse('show');
        }
      }
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
      
      $.each(localUserList, function(i, username){
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
    },

    init: function(){
      var thisTwitchViewer = this;
      
      $.each(localUserList, function(i, username){
        thisTwitchViewer.createUserObj(username);
      });
      
      thisTwitchViewer.updateUserList();
    }

  };

};

$(document).ready(function(){
  var defaultList = 'esl_sc2, ogamingsc2, cretetion, freecodecamp, storbeck, habathcx, robotcaleb, noobs2ninjas, brunofin, comster404';
  
  var myTwitchViewer = new TwitchViewer(defaultList);
  
  myTwitchViewer.init();
  
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

  //removes focus after clicking a user link
  $('#collapse-user-list').on('click', 'a.user', function(e){
    this.blur();
  });

  //remove user from list
  $('#collapse-user-list').on('click', '.user-remove>a', function(e){
    e.preventDefault();
    myTwitchViewer.deleteUser(this);
  });
  
  //reset to demo userlist
  $('#btn-reset').on('click', function(e){
    myTwitchViewer.resetLocalList();
  });
  
});