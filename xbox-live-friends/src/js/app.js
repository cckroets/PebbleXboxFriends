/**
 * Welcome to Pebble.js!
 *
 * This is where you write your app.
 */

var UI = require('ui');
var Vector2 = require('vector2');
var ajax = require('ajax');
var Settings = require('settings');


var KEY_GAMERTAG = 'gamertag';
var KEY_XUID = 'xuid';
var KEY_FRIENDS = 'chosenFriends';
var AUTH_KEY = '76bf38a397e17fd0113dc31406eb21669a542029';

var next_online_index = 0;
var next_offline_index = 0;

var menu = new UI.Menu({
  sections: [
    { title: 'Online', items: [] }, 
    { title: 'Offline', items: [] }
  ]
});

var signInPage = new UI.Card({
  title: 'Xbox Live Friends',
  body:'Choose your friends in the configuration Page'
});

var loadingPage = new UI.Card({
  title: 'Loading friends list...',
});

function reset() {
  console.log('reset');
  loadingPage.show();
  signInPage.hide();
  menu.hide();
  menu.items(0, []);
  menu.items(1, []);
  next_online_index = 0;
  next_offline_index = 0;
}

function onStart() {
  console.log('onStart');
  var friends = Settings.option(KEY_FRIENDS);
  console.log("friends: " + friends);
  if (friends && friends instanceof Array && friends.length > 0) {
    console.log("Friends = " + JSON.stringify(friends));
    loadingPage.show();
    signInPage.hide();
  } else {
    console.log("No friends found");
    signInPage.show();
    loadingPage.hide();
    return;
  }
    
  for (var i = 0; i < friends.length; i++) {
      var friend = friends[i];
      console.log("friend: " + JSON.stringify(friend));
      loadPresence(friend.gamertag, friend.xuid);
    }
    menu.show();  
    loadingPage.hide();
}
onStart();


function loadPresence(gamertag, xuid) {
  var presenceUrl = "https://xboxapi.com/v2/" + xuid + "/presence";
  ajax({
    url: presenceUrl,
    type: 'json',
    headers: { 'X-AUTH': AUTH_KEY }
       
  }, function(response) {
    console.log("Ajax load presence response: " + JSON.stringify(response));
    var subtitle = "";
    if (response.state == 'Offline') {
      if (response.lastSeen) {
        var timestamp = response.lastSeen.timestamp;
        var date = new Date(timestamp);
        subtitle = "Last seen " + date.toString();
      } else {
        subtitle = 'Offline';
      }
    } else if (response.devices && response.devices.length > 0 && response.devices[0].titles) {
      for (var i = 0; i < response.devices[0].titles.length; i++) {
        if (response.devices[0].titles[i].placement == 'Full') {
          subtitle = response.devices[0].titles[i].name;
          break;
        }
      }
    }
    console.log("state for xuid: " + xuid + " is " + subtitle);
    if (response.state == 'Offline') {
      menu.item(1, next_offline_index++, { title: gamertag, subtitle: subtitle });
    } else {
      menu.item(0, next_online_index++, { title: gamertag, subtitle: subtitle });
    }
  }, function(error) {
    console.log("Ajax load presence error: " + error);
    menu.item(0, next_offline_index++, { title: gamertag, subtitle: 'Unknown' });
  });
}

Settings.config(
  { url: 'https://pebble-xbox-friends.firebaseapp.com/' },
  function(e) {
    console.log('opening configurable');
  },
  function(e) {
    console.log('closing configurable');
    console.log(JSON.stringify(e.options));

    if (e.failed) {
      console.log("Failed: " + e.response);
      return;
    } else if (e.options) {
      console.log("Got options: " + e.options + ", friends=" + e.options.chosenFriends);
      Settings.option(KEY_FRIENDS, e.options.chosenFriends);
    } else {
      console.log("No options :(");
    }
    reset();
    onStart();
  }
);

/* 
 * Opening Configuration Page
 
Pebble.addEventListener('showConfiguration', function(e) {
  // Show config page
  Pebble.openURL('https://pebble-xbox-friends.firebaseapp.com/');
});

Pebble.addEventListener('webviewclosed', function(e) {
  var configData = JSON.parse(decodeURIComponent(e.response));
  console.log('Configuration page returned: ' + JSON.stringify(configData));
  
  localStorage.setItem(KEY_GAMERTAG, configData.gamertag);
  localStorage.setItem(KEY_XUID, configData.xuid);
  localStorage.setItem(KEY_FRIENDS, configData.friends);

  onStart();
});
*/
