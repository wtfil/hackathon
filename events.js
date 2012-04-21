var UsersEvents = (function(){
	var usersEvents = function(){
		var self = this;
	}
	usersEvents.prototype = {
		getFriendsEvents: function(){
			var self = this;
			FB.api({
				method: 'fql.query',
				query: 'SELECT eid, uid from event_member WHERE uid IN '+
								'(SELECT uid2 FROM friend WHERE uid1=me())'
			},
			function(response) {
				self.getFullEvents(response);
			});
		},
		getFullEvents: function(data){
			var self = this;
			var res = {};
			var events = [];
			Object.keys(data).forEach(function(key){
				var event = data[key];
				var eid = event.eid;
				res[eid] || (res[eid] = []);
				res[eid].push(event.uid)
			});
			Object.keys(res).forEach(function(key){
				var event = {};
				event.users = res[key];
				events.push(event);
				event = self.getEventDetail(key)
			});
			console.log(events);
		},
		getEventDetail: function(eid, callback){
			var self = this;
			FB.api({
				method: 'fql.query',
				query: 'SELECT eid, name, pic_small, pic_big, pic_square, pic, '+
								'description, start_time, end_time, location, venue, privacy '+
								'FROM event WHERE eid ='+eid+';',
			},
			function(response) {
				if(callback) callback();
			});
		},
	}
	return new usersEvents();
})();
