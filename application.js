var APP = function(){
	var app = function(){
		var self = this;
		self.accessToken;
		self.uid;
		self.init(function(){
			console.log(self.accessToken);
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
	var checkiList = function(){
		var self = this;
		var pagesList = [];
		self.list = {};
		self.getImages(function(imagesList){
			self.getCheckins(function(checkinsList){
				imagesList.forEach(function(image){
					if(pagesList.indexOf(image.place_id === -1)){
						pagesList.push(image.place_id);
					}
				});
				checkinsList.forEach(function(checkin){
					if(pagesList.indexOf(checkin.page_id === -1)){
						pagesList.push(checkin.page_id);
					}
				});
				var mergeResult = self.mergeResult(checkinsList.concat(imagesList), self.config.minLength);
				self.getPlaces(mergeResult, function(placesList){
					console.dir(mergeResult);
					console.dir(placesList);
				});
				console.log(pagesList.length);
			});
		});
		return self;
	}
	checkiList.prototype = {
		config:{
			dx:10,
			dy:10,
			minLength:2
			//dx:0.4,
			//dy:0.3
		},
		getFrindLists: function(){
			var self = this;
			FB.api(
				{
					method: 'fql.query',
					query: "SELECT flid, owner, name FROM friendlist WHERE owner=me()"
				},
				function(response) {
					console.log( response);
				}
			)
		},
		getPlaces: function(target, callback){
			var self = this;
			var idsArray = Object.keys(target);
			FB.api(
				{
					method: 'fql.query',
					query: self.buildPlacesQuery(idsArray)
				},
				function(response) {
					callback(response);
				}
			);
		},
		mergeResult:function(arr, minLength) {
			var res = {};
			arr.forEach(function(e) {
				if (typeof e.page_id === "undefined") {
						//photo
						if (!(e.place_id in res)) {
								res[e.place_id] = [];
						}
						res[e.place_id].push({
								type: "photo",
								obj: e
						});
				};
				if (typeof e.place_id === "undefined") {
					if (!(e.page_id in res)) {
						res[e.page_id] = [];
					}
					res[e.page_id].push({
						type: "checkin",
						obj: e
					});
				}
			});
			var finalRes = {};
			for(var key in res){
				if (res[key].length >= minLength){
					finalRes[key] = res[key];
				}
			}
			return finalRes;
		},
		buildPlacesQuery:function(placesIdArray) {
			var queryPart = "SELECT page_id, name, description, latitude, longitude, display_subtext FROM place";
			var subs = placesIdArray.map(function(el) {
					return "page_id = " + el;
			});
    	return queryPart + " WHERE " + subs.join(" OR ");
		},
		getCheckins: function(callback) {
			var self = this;
			var locationQuery = "(SELECT id FROM location_post WHERE (author_uid = me() OR author_uid IN (select uid2 from friend where uid1=me())) ORDER BY timestamp DESC)";
			var queryBase = "SELECT page_id,timestamp,tagged_uids,message,author_uid FROM checkin WHERE checkin_id IN " + locationQuery; 
			self.current(function(currentCoords){
				FB.api(
					{
						method: 'fql.query',
						query: queryBase
					},
					function(response) {
						//response.forEach(function(elem){
						//	console.log(elem);
						//});
						callback(response);
					}
				);
			});
		},
		getImages: function(callback) {
			var self = this;
			var locationQuery = "(SELECT id FROM location_post WHERE (author_uid = me() OR author_uid IN (select uid2 from friend where uid1=me())) ORDER BY timestamp DESC)";
			var queryBase = "SELECT src,owner,caption, place_id FROM photo WHERE object_id in " + locationQuery; 
			self.current(function(currentCoords){
				FB.api(
					{
						method: 'fql.query',
						query: queryBase
					},
					function(response) {
						callback(response);
					}
				);
			});
		},
		getPostsFromWall: function(callback) {
			var self = this;
			self.current(function(currentCoords){
				var sw = [];
				var ne = [];
				sw.push(currentCoords[0] - self.config.dy)
				sw.push(currentCoords[1] - self.config.dx)
				ne.push(currentCoords[0] + self.config.dy)
				ne.push(currentCoords[1] + self.config.dx)
				var queryBase = "SELECT message,comments,attachment, post_id FROM stream WHERE post_id IN " + 
				"(SELECT post_id, coords, timestamp FROM checkin WHERE (coords.latitude > 'sw[0]' AND " + 
				" coords.latitude < 'ne[0]' AND coords.longitude > 'sw[1]' AND coords.longitude < 'ne[1]') AND author_uid IN " +
				"(SELECT uid2 from friend where uid1=me()) ORDER BY timestamp DESC)"
				var query = queryBase.replace("sw[0]", sw[0], "gi").replace("sw[1]", sw[1], "gi").replace("ne[0]", ne[0], "gi").replace("ne[1]", ne[1], "gi");
				FB.api(
					{
						method: 'fql.query',
						query: query
					},
					function(response) {
						self.list = response;
						response.forEach(function(elem){
							console.log(elem.message);
						});
						
						callback(self.list);
					}
				);
			});
		},
		getFriendsCheckins: function(callback) {
			var self = this;
			self.current(function(currentCoords){
				var sw = [];
				var ne = [];
				sw.push(currentCoords[0] - self.config.dy)
				sw.push(currentCoords[1] - self.config.dx)
				ne.push(currentCoords[0] + self.config.dy)
				ne.push(currentCoords[1] + self.config.dx)
				var queryBase = "SELECT author_uid, page_id, tagged_uids, post_id," + 
				" coords, timestamp, message FROM checkin WHERE (author_uid in (select"+
				" uid2 from friend where uid1=me())) AND coords.latitude > 'sw[0]' AND"+
				" coords.latitude < 'ne[0]' AND coords.longitude > 'sw[1]' AND"+
				" coords.longitude < 'ne[1]' ORDER BY timestamp DESC"
				var query = queryBase.replace("sw[0]", sw[0], "gi").replace("sw[1]", sw[1], "gi").replace("ne[0]", ne[0], "gi").replace("ne[1]", ne[1], "gi");
				FB.api(
					{
						method: 'fql.query',
						query: query
					},
					function(response) {
						self.list = response;
						//response.forEach(function(elem){
						//	console.log(elem.message);
						//});
						callback(self.list);
					}
				);
			});
		},
		current: function(callback){
			var error = function(msg){
				//console.log(msg);
			}
			var success = function(position){
				//console.log(typeof callback);
				callback([position.coords.latitude, position.coords.longitude]);
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
