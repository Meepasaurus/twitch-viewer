'use strict';

var TwitchViewer = function(defaultList, cooldown){

  var localUserList = [],
      userObjs = {},
      initCounter = 0;

  //check for saved user list
  if (localStorage.hasOwnProperty('userList')){
    //console.log('Found Local List');
    localUserList = localStorage.getItem('userList').split(', ');
    //check for empty list
    if (localUserList[0] === ''){
      localUserList = [];
    }
    //console.log(localUserList);
  } else {
    //console.log('Initializing List');
    localStorage.setItem('userList', defaultList);
    localUserList = defaultList.split(', ');
  }

  initCounter = localUserList.length;

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

    addUser: function(userAddLink){
      $('#collapse-search').collapse('hide');
      $('#txt-search').val('');
      var addUserName = $(userAddLink).closest('.user-container').find('h4').html().toLowerCase();
      
      //prevent rapid clicking
      if (localUserList.indexOf(addUserName) === -1){
        localUserList.push(addUserName);
        //console.log(localUserList);
        localStorage.setItem('userList', localUserList.join(', '));
        this.createUserObj(addUserName);
        this.updateUserList();
      }
    },

    deleteUser: function(userRemoveLink){
      var deleteUser = $(userRemoveLink).closest('.collapse-user'),
          deleteUserName = $(userRemoveLink).closest('.user-container').find('h4').html().toLowerCase(),
          deleteIndex = localUserList.indexOf(deleteUserName);

      //prevents user clicking rapidly and removing from index -1
      if (deleteIndex !== -1){
        //remove from userList and userObjs
        localUserList.splice(deleteIndex, 1);
        delete userObjs[deleteUserName];

        //update localStorage
        localStorage.setItem('userList', localUserList.join(', '));
        deleteUser.collapse('hide');
        
        //remove from DOM, note not using .on hidden.bs.collapse event because users will be hidden when moving containers between online and offline lists
        setTimeout(function(){
          $(deleteUser).remove();
        }, 5000);
      }

    },

    resetLocalList: function(){
      localStorage.setItem('userList', defaultList);
      localUserList = defaultList.split(", ");
      location.reload();
    },

    //sort online or offline list alphabetically, modified from jsfiddle user hibbard_eu
    sortUsers: function(isOnline){
      var container = isOnline? '#users-online' : '#users-offline',
          divs = $(container + ' .collapse-user');

      var sortedDivs = divs.sort(function (a, b) {
          return $(a).find("h4").text().toLowerCase() > $(b).find("h4").text().toLowerCase();
        });
      
      $(container).append(sortedDivs);
    },

    //updates display data and appends div to proper section
    parseUserData: function(data, isOnline, err){
      //console.log(data);
      
      var thisTwitchViewer = this,
          channelLogo = '',
          channelName = '',
          displayName = '',
          thisUserObj = {},
          collapser = null,
          status = '',
          game = '',
          viewers = 0;
      
      if (isOnline){
        //console.log(data);

        displayName = data.stream.channel.display_name;
        channelLogo = data.stream.channel.logo || 'images/default_avatar.png';
        channelName = data.stream.channel.name;
        thisUserObj = userObjs[channelName];
        collapser = thisUserObj.collapser;
        game = '';
        viewers = 0;

        //if user has changed to online status
        if (thisUserObj.isOnline === false){
          //console.log('Switching user ' + displayName + ' to Online list.');
          collapser.collapse('hide');
          //reminder as before, do not use .on hidden.bs.collapse
          setTimeout(function(){
            $(collapser).remove();
            //console.log('Added user ' + displayName + ' to Online list.');
            thisUserObj.isOnline = true;
            $('#users-online').append(collapser);
            //sort here
            thisTwitchViewer.sortUsers(true);
            collapser.collapse('show');
          }, 1000);
        }

        //avatar
        thisUserObj.logo.attr({'src': channelLogo, 'alt': displayName + ' avatar'});
        
        //display name - status - game
        status = data.stream.channel.status || '';
        game = data.stream.game ? 'Streaming: ' + data.stream.game : '';
        viewers = data.stream.viewers ? data.stream.viewers + ' viewers' : 0;

        thisUserObj.displayName.text(displayName);
        thisUserObj.status.text(status);
        thisUserObj.game.text(game + ' - ' + viewers);

        //append to DOM if it isn't currently
        if (thisUserObj.isOnline === null){
          //console.log('Added user ' + displayName + ' to Online list.');
          thisUserObj.isOnline = true;
          $('#users-online').append(collapser);
          //sort here
          thisTwitchViewer.sortUsers(true);
          collapser.collapse('show');
        }
      } else if (isOnline === false) {
        //console.log(data);

        displayName = data.display_name;
        channelLogo = data.logo || 'images/default_avatar.png';
        channelName = data.name;
        thisUserObj = userObjs[channelName];
        collapser = thisUserObj.collapser;

        //if user has changed to offline status
        if (thisUserObj.isOnline === true){
          //console.log('Switching user ' + channelName + ' to Offline list.');
          collapser.collapse('hide');
          //reminder as before, do not use .on hidden.bs.collapse
          setTimeout(function(){
            $(collapser).remove();
            //console.log('Added user ' + displayName + ' to Offline list.');
            thisUserObj.isOnline = false;
            $('#users-offline').append(collapser);
            //sort here
            thisTwitchViewer.sortUsers(false);
            collapser.collapse('show');
          }, 1000);
        }

        //avatar
        thisUserObj.logo.attr({'src': channelLogo, 'alt': displayName + ' avatar'});
        
        //display name - status
        status = data.status || '';

        thisUserObj.displayName.text(displayName);
        thisUserObj.status.text(status);        
        thisUserObj.game.text('');

        //append to DOM if it isn't currently
        if(thisUserObj.isOnline === null){
          //console.log('Added user ' + displayName + ' to Offline list.');
          thisUserObj.isOnline = false;
          $('#users-offline').append(collapser);
          //sort here
          thisTwitchViewer.sortUsers(false);
          collapser.collapse('show');
        }
      } else {
        //user does not currently exist
        thisUserObj = userObjs[data];
        collapser = thisUserObj.collapser;

        //if user's account no longer accessible
        if (thisUserObj.isOnline === true){
          //console.log('Switching user ' + data + ' to Offline list.');
          collapser.collapse('hide');
          //reminder as before, do not use .on hidden.bs.collapse
          setTimeout(function(){
            $(collapser).remove();
            //console.log('Added user ' + data + ' to Offline list.');
            thisUserObj.isOnline = false;
            $('#users-offline').append(collapser);
            //sort here
            thisTwitchViewer.sortUsers(false);
            collapser.collapse('show');
          }, 1000);
        }

        //avatar
        thisUserObj.logo.attr({'src': 'images/default_avatar.png', 'alt': data + ' avatar'});
        
        //display name - status
        status = data.status || '';

        thisUserObj.displayName.text(data);
        
        if (err === 503){
          thisUserObj.status.html('<p class="null-status">Twitch server is currently unavailable. Please refresh or wait 20 seconds.</p>');        
        } else {
          thisUserObj.status.html('<p class="null-status">This user no longer exists.</p>');        
        }

        thisUserObj.game.text('');

        //append to DOM if it isn't currently
        if(thisUserObj.isOnline === null){
          //console.log('Added user ' + data + ' to Offline list.');
          thisUserObj.isOnline = false;
          $('#users-offline').append(collapser);
          //sort here
          thisTwitchViewer.sortUsers(false);
          collapser.collapse('show');
        }
      }
      //add slight delay o smoothly display info
      if (initCounter === 1){
        setTimeout(function(){
          $('.loader').fadeOut();
          $('#collapse-users').collapse('show');
        }, 500);
      }
      initCounter--;
    },

    getOfflineUser: function(channelURL){
      var thisTwitchViewer = this;

      $.ajax({
        dataType: 'jsonp',
        url: channelURL,
        headers: {
          'Client-ID': 'ijknjytczppohdhsy0zmsukeu4hv2gu'
        },
        success: function(data){
          thisTwitchViewer.parseUserData(data, false, null);
        },
        error: function(err){
          console.log(err);
        }
      });
    },

    parseSearch: function(data){
      //these are disposable so do not use createUserObj
      var userDiv = $('<div class="user-container">'),
          userLink = $('<a class="user" target="_blank" rel="noopener noreferrer" href="https://www.twitch.tv/' + data.name + '">'),
          userName = data.display_name,
          userLogo = data.logo || 'images/default_avatar.png',
          userStatus = data.status || '';

      //avatar
      userLink.append($('<div class="user-logo" style="height:75px; width:75px">')
          .append($('<img src="' + userLogo + '" alt="' + userName + ' avatar">')));

      //display name - status - game
      userLink.append($('<div class="user-text">')
        .append($('<h4 class="display-name">' + userName + '</h4><p class="user-status">' + userStatus + '</p><p class="user-game"></p>')));

      userDiv.append(userLink);

      //+ icon for adding to userList
      if (localUserList.indexOf(data.name) === -1){
        userDiv.append($('<div class="user-add">')
          .append($('<a class="x" href="#"><i class="fa fa-plus-circle" aria-hidden="true"></i></a>')));
      } else {
        userDiv.append($<'<div class="user-add">');
      }
      $('#search-results').append(userDiv);

      //check if user is online
      $.ajax({
          dataType: 'jsonp',
          url: 'https://api.twitch.tv/kraken/streams/' + data.name,
          headers: {
            'Client-ID': 'ijknjytczppohdhsy0zmsukeu4hv2gu'
          },
          success: function(data){
            if (data.hasOwnProperty('error')){
              //console.log('');
            } else {
              if (data.stream !== null){
                //console.log(data.stream);
                var game = data.stream.game ? 'Streaming: ' + data.stream.game : '',
                    viewers = data.stream.viewers ? data.stream.viewers + ' viewers' : 0;
                userLink.find($(".user-game")).text(game + ' - ' + viewers);
              } else {
                //console.log('');
              }
            }
          },
          error: function(err){
            console.log(err); 
          }
        });

    },

    searchUser: function(username){
      var thisTwitchViewer = this;

      $.ajax({
        dataType: 'jsonp',
        url: 'https://api.twitch.tv/kraken/search/channels?limit=10&q=' + username,
        headers: {
          'Client-ID': 'ijknjytczppohdhsy0zmsukeu4hv2gu'
        },
        success: function(data){
          //console.log(data);

          $('#search-results').html('');
          if (data.channels.length !== 0){
            $.each(data.channels, function(i, channel){
              thisTwitchViewer.parseSearch(channel);
            });
          } else {
            $('#search-results').append($('<p class="no-results">No results found.</p>'));
          }

          //add tiny delay otherwise empty search won't show
          setTimeout(function(){
            $('#collapse-search').collapse('show');  
          }, 100);
        },
        error: function(err){
          console.log(err);
        }
      });
    },

    updateUserList: function(){
      //console.log('UPDATING...');

      var thisTwitchViewer = this;
      
      $.each(localUserList, function(i, username){
        //console.log(username);
        $.ajax({
          dataType: 'jsonp',
          url: 'https://api.twitch.tv/kraken/streams/' + username,
          headers: {
            'Client-ID': 'ijknjytczppohdhsy0zmsukeu4hv2gu'
          },
          success: function(data){
            if (data.hasOwnProperty('error')){
              //console.log(data);
              if(data.status === 503){
                //twitch server is unavailable
                thisTwitchViewer.parseUserData(username, null, 503);
              } else {
                //user no longer exists or never did
                thisTwitchViewer.parseUserData(username, null, null);
              }
            } else {
              if (data.stream === null){
                //channel is offline, need to request channel data
                thisTwitchViewer.getOfflineUser(data._links.channel);
              } else {
                //parse channel info
                thisTwitchViewer.parseUserData(data, true, null);
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
      
      //create user divs
      $.each(localUserList, function(i, username){
        thisTwitchViewer.createUserObj(username);
      });

      //console.log(localUserList);
      
      //get rid of loader if list is empty
      if (localUserList.length === 0){
        $('.loader').fadeOut();
        $('#collapse-users').collapse('show');
      }

      //initialize timer and request data
      var timer = setInterval(function(){thisTwitchViewer.updateUserList();}, cooldown);
      thisTwitchViewer.updateUserList();
    }

  };

};

$(document).ready(function(){
  var defaultList = 'esl_sc2, ogamingsc2, freecodecamp, patrickklepek, giantbomb, doublefine, greenspeak, comster404',
      cooldown = 20000;
  
  var myTwitchViewer = new TwitchViewer(defaultList, cooldown);
  
  myTwitchViewer.init();
  
  //toggle online userlist caret (prevents rapid clicks)
  $('#collapse-online').on('hide.bs.collapse show.bs.collapse', function(e){
    //prevents children triggering event
    if (e.target !== this){
      return;
    }
    $('#caret-online').toggleClass('open');
  });
  
  //toggle offline userlist caret (prevents rapid clicks)
  $('#collapse-offline').on('hide.bs.collapse show.bs.collapse', function(e){
    if (e.target !== this){
      return;
    }
    $('#caret-offline').toggleClass('open');
  });

  //removes focus after clicking a user link
  $('.wrapper').on('click', 'a.user', function(e){
    this.blur();
  });

  //remove user from list
  $('.wrapper').on('click', '.user-remove>a', function(e){
    e.preventDefault();
    myTwitchViewer.deleteUser(this);
  });

  //presses enter in search
  $('#txt-search').keypress(function(e){
    var searchTxt = $('#txt-search').val();
    if(searchTxt !== ''){
      if (e.keyCode == 13) {
        $('#collapse-search').collapse('hide');
        myTwitchViewer.searchUser(searchTxt);
        return false;
      }
    }
  });

  //search button
  $('.btn-search').on('click', function(e){
    this.blur();
    var searchTxt = $('#txt-search').val();
    if(searchTxt !== ''){
      $('#collapse-search').collapse('hide');
      myTwitchViewer.searchUser(searchTxt);
    }
  });

  //add user to list
  $('.wrapper').on('click', '.user-add>a', function(e){
    e.preventDefault();
    myTwitchViewer.addUser(this);
  });

  //close search button
  $('#search-close').on('click', function(e){
    $('#collapse-search').collapse('hide');
    $('#txt-search').val('');
  });

  //presses esc
  $(document).keydown(function(e){
    //note needs to be keydown instead of press to work in Chrome
    if (e.keyCode == 27) {
      $('#collapse-search').collapse('hide');
      $('#txt-search').val('');
      return false;
    }
  });
  
  //reset to demo userlist
  $('#btn-reset').on('click', function(e){
    myTwitchViewer.resetLocalList();
  });
  
});