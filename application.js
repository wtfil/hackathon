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
	return new app();
}
