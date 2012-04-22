var APP = function(){
	var app = function(){
		var self = this;
		self.accessToken;
		self.uid;
		self.init(function(){
			console.log(self.accessToken);
			var events;
			UsersEvents.getFriendsEvents(function(response){
				events = response;
			});
			var myCheckiList = new checkiList();
      self.getAllData(function (data) {
        self.showBestOnMap(data);
      });  
		});
	}
	app.prototype = {
		conf:{
			appId      : '403886702969818',
			channelUrl : 'http://friday.incubus.univ.kiev.ua/index.html',
      templates: {
        placemark: '<div class="placemark"><h4>{name}</h4><img src="{pic_small}"/></div><div class="placemark-tail"></div>',
        balloon: '<div class="balloon"><h4>{name}</h4><img src="{pic_big}"/></div><div class="placemark-tail"></div>',
        me: '<img src="http://graph.facebook.com/{id}/picture">'
      }
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
		},
    template: function (name, options) {
      var self = this,
        st = self.conf.templates[name];
      Object.keys(options || {}).forEach(function (key) {
        if (typeof options[key] !== 'string') {
          return;
        }
        st = st.replace(new RegExp('{' + key + '}', 'g'), options[key]);
      });
      return st;
    },
    getAllData: function (callback) {
      var data = {
        events: [
          {name: 'metallica', pic_small: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/373005_173676372738073_345025705_n.jpg', location: {latitude: 50.455, longitude: 30.52}, pic_big: 'http://icons.iconseeker.com/png/fullsize/smurf-houses/smurf-house-exterior.png'},
          {name: 'metallica', pic_small: 'http://profile.ak.fbcdn.net/hprofile-ak-snc4/373005_173676372738073_345025705_n.jpg', location: {latitude: 50.465, longitude: 30.52}}
        ]
      };
      setTimeout(function () {
        callback(data);
      }, 300)
    },
    showMeOnMap: function () {
      var self = this,
        placemark = self.template('me', { id: self.uid });
      Map.placemark(null, placemark);
    },
    showBestOnMap: function (data) {
      var self = this,
        placemark,
        balloon = 'qq';
      data.events.forEach(function (event) {
        placemark = self.template('placemark', event);
        balloon = self.template('balloon', event);
        Map.placemark(event.location, placemark, balloon);
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
			self.current(function(currentCoords){
				var sw = [];
				var ne = [];
				sw.push(currentCoords[0] - self.config.dy)
				sw.push(currentCoords[1] - self.config.dx)
				ne.push(currentCoords[0] + self.config.dy)
				ne.push(currentCoords[1] + self.config.dx)
				var locationQuery = "(SELECT id FROM location_post WHERE (coords.latitude > 'sw[0]' AND " +
				" coords.latitude < 'ne[0]' AND coords.longitude > 'sw[1]' AND coords.longitude < 'ne[1]')"+
				" AND (author_uid=me() OR author_uid IN (select uid2 from friend where uid1=me())) ORDER BY timestamp DESC)";
				var queryBase = "SELECT page_id, timestamp, tagged_uids, message,author_uid FROM checkin WHERE checkin_id IN " + locationQuery; 
				var query = queryBase.replace("sw[0]", sw[0], "gi").replace("sw[1]", sw[1], "gi").replace("ne[0]", ne[0], "gi").replace("ne[1]", ne[1], "gi");
				self.current(function(currentCoords){
					FB.api(
						{
							method: 'fql.query',
							query: query
						},
						function(response) {
							callback(response);
						}
					);
				});
			});
		},
		getImages: function(callback) {
			var self = this;
			self.current(function(currentCoords){
				var sw = [];
				var ne = [];
				sw.push(currentCoords[0] - self.config.dy)
				sw.push(currentCoords[1] - self.config.dx)
				ne.push(currentCoords[0] + self.config.dy)
				ne.push(currentCoords[1] + self.config.dx)
				var locationQuery = "(SELECT id FROM location_post WHERE (coords.latitude > 'sw[0]' AND " +
				" coords.latitude < 'ne[0]' AND coords.longitude > 'sw[1]' AND coords.longitude < 'ne[1]')"+
				" AND (author_uid=me() OR author_uid IN (select uid2 from friend where uid1=me())) ORDER BY timestamp DESC)";
				var queryBase = "SELECT src, images, created, link,  owner, caption, place_id FROM photo WHERE object_id in " + locationQuery; 
				var query = queryBase.replace("sw[0]", sw[0], "gi").replace("sw[1]", sw[1], "gi").replace("ne[0]", ne[0], "gi").replace("ne[1]", ne[1], "gi");
				FB.api(
					{
						method: 'fql.query',
						query: query
					},
					function(response) {
						callback(response);
					}
				);
			});
		},
		current: function(callback){
			var error = function(msg){
				console.log(msg);
			}
			var success = function(position){
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
