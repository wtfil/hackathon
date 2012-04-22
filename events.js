var UsersEvents = (function(){
	var usersEvents = function(){
		var self = this;
	}
	usersEvents.prototype = {
		getFriendsEvents: function(callback){
			var self = this;
			FB.api({
				method: 'fql.query',
				query: 'SELECT eid, uid from event_member WHERE uid IN '+
								'(SELECT uid2 FROM friend WHERE uid1=me())'
			},
			function(response) {
				self.getFullEvents(response, callback);
			});
		},
		getEventsByTime: function(events, hours){
			var self = this;
			var res = [];
			var now = Math.round(new Date().getTime()/1000);
			events.forEach(function(value){
				var start = value.start_time;
				var end   = value.end_time;
				var eventLength = self.timeDiff(start, end);
				var timeToBegin = self.timeDiff(now, start);
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
		getFullEvents: function(data, callback){
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
				self.getEventDetail(key, function(obj){
					var data = {users: res[key]};
					jQuery.extend(data, obj[0]);
					events.push(data);
					if((len == ++count) && callback) callback(events);
				});
			});
		},
		getEventDetail: function(eid, callback){
			var self = this;
			FB.api({
				method: 'fql.query',
				query: 'SELECT eid, name, pic_small, pic_big, pic_square, pic, '+
								'description, start_time, end_time, location, venue, privacy '+
								'FROM event WHERE eid ='+eid+';',
			},callback);
		},
	}
	return new usersEvents();
})();
