var APP = function(){
	var app = function(){
		var self = this;
		self.accessToken;
		self.uid;
		self.init(function(){
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
        user: 
          '<a target="_blank" class="user" href="http://facebook.com/profile.php?id={id}">' +
            '<img src="http://graph.facebook.com/{id}/picture">' +
          '</a>',
        placemark: 
          '<div class="placemark">' + 
            '<h4>{name}</h4>' + 
            '<div>{startTime}</div>' +
            '<div><div class="pseudo">{userCount} friends will going</div></div>' +
          '</div>' +
          '<div class="placemark-tail"><div></div></div>',
        balloon:
          '<div class="placemark balloon">' + 
            '<h4>{name}</h4>' +
            '<div class="content col-left">' +
              '<p>{description}</p>' +
              '<div>{friends}</div>' +
            '</div>' +
            '<div class="content col-right">' +
              '<img src="{pic_big}"/>' +
            '</div>' +
          '</div>' + 
          '<div class="placemark-tail"><div></div></div>',
        checkin: 
          '<div class="placemark">' +
            '<h4>{message}</h4>' +
          '</div>',
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
        if (typeof options[key] !== 'string' && typeof options[key] !== 'number') {
          return;
        }
        st = st.replace(new RegExp('{' + key + '}', 'g'), options[key]);
      });
      return st;
    },
    getAllData: function (callback) {
      var allData = {},
        callbackCounter = 0;
			UsersEvents.getFriendsEvents(function(response){
				allData.events = response;
        if (++callbackCounter === 2) callback(allData);
			});
      CheckiList.getFriendsCheckins(function (checkins) {
        allData.checkins = checkins;
        if (++callbackCounter === 2) callback(allData);
      });
    },
    showMeOnMap: function () {
      var self = this,
        placemark = self.template('me', { id: self.uid });
      Map.placemark(null, placemark);
    },
    convertDate: function (timestamp) {
      var d = new Date(timestamp * 1000),
        day = ['Sunday',
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday'
        ][d.getDay()],
        month = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec'
        ][d.getMonth()],
        hours = d.getHours(),
        minutes = d.getMinutes();
      hours = hours < 10 ? ('0' + hours) : hours;
      minutes = minutes < 10 ? ('0' + minutes) : minutes;
      return [day, d.getDate(), month, hours + ':' + minutes].join(' ');
    },
    convertDescription: function (description) {
      var self = this;
      var temp = jQuery(self.template('balloon', {description: description}))
        .find('p');
      return description;
    },
    showBestOnMap: function (data) {
      var self = this,
        placemark,
        balloon = 'qq';
      data.events.forEach(function (event) {
        var d = new Date(event.start_time);
        event.userCount = event.users.length;
        event.startTime = self.convertDate(event.start_time);
        event.description = self.convertDescription(event.description);
        event.friends = event.users.map(function (id) {
          return self.template('user', {id: id});
        }).join('');
        //console.log(event)
        placemark = self.template('placemark', event);
        balloon = self.template('balloon', event);
        Map.placemark(event.venue, placemark, balloon);
      });
      //data.checkins.forEach(function (checkin) {
      //  placemark = self.template('checkin', checkin);
      //  balloon = self.template('balloon', checkin);
      //  Map.placemark(checkin.coords, placemark, balloon);
      //});
    }
	}
  var CheckiList = (function () {
	  var checkiList = function(){
	  	var self = this;
	  	self.list = {};
	  	return self;
	  }
	  checkiList.prototype = {
	  	config:{
	  		dx:10,
	  		dy:10
	  	},
      _mergeByCoordinates: function (raw) {
        var result = {},
          accuracy = 0.002 * 0.002,
          i, j,
          first,
          diff,
          anyChanges = false,
          second;
        for (i = 0; i < raw.length; i++) {
          raw[i].group = raw[i].group || i;
        }
        for (i = 0; i < raw.length - 1; i++) {
          first = raw[i];
          for (j = i + 1; j < raw.length; j++) {
            second = raw[j];
            diff = Math.pow(first.coords.latitude - second.coords.latitude, 2) +
              Math.pow(first.coords.longitude - second.coords.longitude, 2);
            if (diff < accuracy && first.group !== second.group) {
              second.group = first.group;
              anyChanges = true;
            }
          }
        }
        if (anyChanges) {
          return this.mergeByCoordinates(raw);
        }
        return raw;
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
	  			var queryBase = "SELECT message,comments,attachment FROM stream WHERE post_id IN (SELECT author_uid, page_id, tagged_uids, post_id," + 
	  			" coords, timestamp, message FROM checkin WHERE (author_uid in (select"+
	  			" uid2 from friend where uid1=me())) AND coords.latitude > 'sw[0]' AND"+
	  			" coords.latitude < 'ne[0]' AND coords.longitude > 'sw[1]' AND"+
	  			" coords.longitude < 'ne[1]' ORDER BY timestamp DESC)"
	  			var query = queryBase.replace("sw[0]", sw[0], "gi").replace("sw[1]", sw[1], "gi").replace("ne[0]", ne[0], "gi").replace("ne[1]", ne[1], "gi");
	  			FB.api(
	  				{
	  					method: 'fql.query',
	  					query: query
	  				},
	  				function(response) {
	  					self.list = response;
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
	  					callback(self.list);
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
    return new checkiList();
  })();
	return new app();
}
