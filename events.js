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
			Object.keys(res).forEach(function(key){
				self.getEventDetail(key, function(obj){
					var data = {users: res[key]};
					jQuery.extend(data, obj[0]);
					events.push(data);
					if((Object.keys(res).length == ++count) && callback) callback(events);
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
