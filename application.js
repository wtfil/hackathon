var APP = function(){
	var app = function(){
		var self = this;
		self.accessToken;
		self.uid;
		self.init(function(){
			console.log(self.accessToken);
			UsersEvents.getFriendsEvents();
			var myCheckiList = new checkiList([-90,-180], [90,180]);
			//FB.api(
			//	{
			//		method: 'fql.query',
			//		query: "SELECT author_uid, page_id, tagged_uids, post_id, coords, timestamp, message FROM checkin WHERE (author_uid in (select uid2 from friend where uid1=me())) AND coords.latitude > '-90' AND coords.latitude < 90 AND coords.longitude > '-180' AND coords.longitude < 180 ORDER BY timestamp DESC"
			//		//query: 'SELECT author_uid, page_id, tagged_uids, post_id, coords, timestamp, message FROM checkin WHERE ( author_uid in (select uid2 from friend where uid1=me()) ) AND coords.latitude > -90 AND coords.latitude < 90 AND coords.longitude > 180 AND coords.lontitude < 180 ORDER BY timestamp DESC'
			//		//query: 'SELECT name FROM user WHERE uid=me()'
			//	},
			//	function(response) {
			//		console.log(response);
			//	}
			//);
		});
	}
	app.prototype = {
		conf:{
			appId      : '403886702969818',
			channelUrl : 'http://friday.incubus.univ.kiev.ua/index.html',
		},
		init: function(callback){
			var self = this;
			FB.init({
				appId      : self.conf.appId,
				channelUrl : self.conf.channelUrl,
				status     : true, // check login status
				cookie     : true, // enable cookies to allow the server to access the session
				xfbml      : true  // parse XFBML
			});
			FB.getLoginStatus(function(response) {
				if (response.status === 'connected') {
					self.uid = response.authResponse.userID;
					self.accessToken = response.authResponse.accessToken;
					callback(response.authResponse.accessToken);
				} else if (response.status === 'not_authorized') {
					alert( 'the user is logged in to Facebook, but has not authenticated your app')
				} else {
					FB.login(function(response) {
						if (response.authResponse) {
							self.accessToken = response.authResponse.accessToken;
							callback(response.authResponse.accessToken);
						} else {
							alert( 'User cancelled login or did not fully authorize.');
						}
					});
				}
			 });
		}
	}
	var checkiList = function(sw,ne){
		var self = this;
		//self.getFriendsCheckins(sw,ne);
		self.current();
	}
	checkiList.prototype = {
		getFriendsCheckins: function(sw,ne) {
				var queryBase = "SELECT author_uid, page_id, tagged_uids, post_id, coords, timestamp, message FROM checkin WHERE (author_uid in (select uid2 from friend where uid1=me())) AND coords.latitude > 'sw[0]' AND coords.latitude < ne[0] AND coords.longitude > 'sw[1]' AND coords.longitude < ne[1] ORDER BY timestamp DESC"
			var query = queryBase.replace("sw[0]", sw[0], "gi").replace("sw[1]", sw[1], "gi").replace("ne[0]", ne[0], "gi").replace("ne[1]", ne[1], "gi");
			FB.api(
				{
					method: 'fql.query',
					query: query
					//query: 'SELECT name FROM user WHERE uid=me()'
				},
				function(response) {
					return response;
				}
			);
		},
		current: function(){
			var error = function(msg){
				console.log(msg);
			}
			var success = function(position){
				return ([position.coords.latitude, position.coords.longitude]);
			}
			if (navigator.geolocation) {
			  var location = navigator.geolocation.getCurrentPosition(success, error);
			} else {
  			error('not supported');
			}
		}
	}
	return new app();
}
