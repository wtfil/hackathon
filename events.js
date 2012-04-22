var UsersEvents = (function(){
	var usersEvents = function(){
		var self = this;
	}
	usersEvents.prototype = {
		conf: {
			dx:0.1,
			dy:0.1,
		},
		getFriendsEvents: function(callback){
			var self = this;
			FB.api({
				method: 'fql.query',
				query: "SELECT eid, uid from event_member WHERE uid IN "+
								"(SELECT uid2 FROM friend WHERE uid1=me())"
			},
			function(response) {
				self.current(function(currentCoords){
					self.getFullEvents(response, currentCoords, callback);
				});
			});
		},
		getEventsByTime: function(events, hours){
			var self = this;
			var res = [];
			var now = Math.round(new Date().getTime()/1000);
			events.forEach(function(value){
				var start = value.start_time;
				var end   = value.end_time;
				var timeToBegin = self.timeDiff(now, start);
				var eventLength = self.timeDiff(start, end);
				var timeToEnd   = self.timeDiff(now, end);
				if((timeToBegin <= 0 && timeToEnd < hours) || timeToBegin > hours) return;
				else res.push(value);
			});
			return res;
		},
		timeDiff: function(start, end){
			var self = this;
			var diff = end - start;
			return Math.round(diff/3600);
		},
		getFullEvents: function(data, currentCoords, callback){
			var self = this;
			var res = {};
			var events = [];
			var count = 0;
			Object.keys(data).forEach(function(key){
				var event = data[key];
				var eid = event.eid;
				res[eid] || (res[eid] = []);
				res[eid].push(event.uid);
			});
			var len = Object.keys(res).length;
			Object.keys(res).forEach(function(key){
				self.getEventDetail(key, currentCoords, function(obj){
					var data = {users: res[key]};
					if(!self.isEmpty(obj)){
						jQuery.extend(data, obj[0]);
						events.push(data);
					}
					if((len == ++count) && callback) callback(events);
				});
			});
		},
		isEmpty: function(obj) {
			if (obj.length && obj.length > 0)    return false;
			for (var key in obj) {
				if (hasOwnProperty.call(obj, key))    return false;
			}
			return true;
		},
		getEventDetail: function(eid, currentCoords, callback){
			var self = this;
			var queryBase = "SELECT eid, name, pic_small, pic_big, pic_square, pic, "+
								"description, start_time, end_time, location, venue, privacy "+
								"FROM event WHERE eid ="+eid+" AND venue.latitude > 'sw[0]' AND "+
								"venue.latitude < 'ne[0]' AND venue.longitude > 'sw[1]' AND venue.longitude < 'ne[1]';";
			var sw = [];
			var ne = [];
			sw.push(currentCoords[0] - self.conf.dy)
			sw.push(currentCoords[1] - self.conf.dx)
			ne.push(currentCoords[0] + self.conf.dy)
			ne.push(currentCoords[1] + self.conf.dx)
			var query = queryBase.replace("sw[0]", sw[0], "gi").replace("sw[1]", sw[1], "gi").replace("ne[0]", ne[0], "gi").replace("ne[1]", ne[1], "gi");
			FB.api({
				method: 'fql.query',
				query: query,
			},callback);
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
	return new usersEvents();
})();
