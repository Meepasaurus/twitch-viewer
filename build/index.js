"use strict";var TwitchViewer=function(e){var s=e;return{parseUserData:function(e,s){var a=$('<div class="user-container">'),t=$('<div class="collapse-user collapse">'),n="",r="",l=0;s?(console.log(e),a.append($('<div class="user-logo">').append($('<img src="'+e.stream.channel.logo+'" alt="'+e.stream.channel.name+' avatar">'))),n=e.stream.channel.status||"",r=e.stream.game?"Streaming: "+e.stream.game:"",l=e.stream.viewers?e.stream.viewers+" viewers":0,a.append($('<div class="user-text">').append($("<h4>"+e.stream.channel.display_name+"</h4><p class=user-status>"+n+"</p><p class=user-game>"+r+" - "+l+"</p>"))),a.append($('<div class="user-remove">').append($('<a href="#"><i class="fa fa-times-circle" aria-hidden="true"></i></a>'))),$("#users-online").append(t.append(a))):s===!1?(a.append($('<div class="user-logo">').append($('<img src="'+e.logo+'" alt="'+e.name+' avatar">'))),n=e.status||"",a.append($('<div class="user-text">').append($("<h4>"+e.display_name+"</h4><p class=user-status>"+n+"</p>"))),a.append($('<div class="user-remove">').append($('<a href="#"><i class="fa fa-times-circle" aria-hidden="true"></i></a>'))),$("#users-offline").append(t.append(a))):(a.append($('<div class="user-logo">').append($('<img src="images/default_avatar.png" alt="default avatar">'))),a.append($('<div class="user-text">').append($("<h4>"+e+'</h4><p class="null-status">This user no longer exists.</p>'))),a.append($('<div class="user-remove">').append($('<a href="#"><i class="fa fa-times-circle" aria-hidden="true"></i></a>'))),$("#users-offline").append(t.append(a))),t.collapse("toggle")},getOfflineUser:function(e){var s=this;$.ajax({dataType:"jsonp",url:e,success:function(e){s.parseUserData(e,!1)},error:function(e){console.log(e)}})},updateUserList:function(){var e=this;$.each(s,function(s,a){$.ajax({dataType:"jsonp",url:"https://api.twitch.tv/kraken/streams/"+a,success:function(s){s.hasOwnProperty("error")?e.parseUserData(a,null):null===s.stream?e.getOfflineUser(s._links.channel):e.parseUserData(s,!0)},error:function(e){console.log(e)}})})}}};$(document).ready(function(){var e="esl_sc2, ogamingsc2, cretetion, freecodecamp, storbeck, habathcx, robotcaleb, noobs2ninjas, brunofin, comster404",s="";localStorage.hasOwnProperty("userList")?(console.log("Found Local List"),s=localStorage.getItem("userList").split(", "),console.log(s)):(console.log("Initializing List"),localStorage.setItem("userList",e),s=e.split(", "));var a=new TwitchViewer(s);a.updateUserList(),$("#btn-online").on("click",function(e){e.preventDefault(),$("#caret-online").toggleClass("open")}),$("#btn-offline").on("click",function(e){e.preventDefault(),$("#caret-offline").toggleClass("open")}),$("#collapse-user-list").on("hidden.bs.collapse",".collapse-user",function(){$(this).remove()}),$("#collapse-user-list").on("click",".user-remove>a",function(e){e.preventDefault();var a=$(this).closest(".collapse-user");a.collapse("hide"),s.splice(s.indexOf($(this).closest(".user-container").find("h4").html()),1),localStorage.setItem("userList",s.join(", "))}),$("#btn-reset").on("click",function(a){console.log("Resetting List"),localStorage.setItem("userList",e),s=e.split(", "),console.log(s)})});