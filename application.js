var APP = function(){
	var app = function(){
		var self = this;
		self.init();
	}
	app.prototype = {
		init: function(){
			FB.init({
				appId      : '403886702969818',
				channelUrl : 'http://friday.incubus.univ.kiev.ua/index.html', // Channel File
				status     : true, // check login status
				cookie     : true, // enable cookies to allow the server to access the session
				xfbml      : true  // parse XFBML
			});
			FB.login(function(response) {
				if (response.authResponse) {
					console.log('Welcome!  Fetching your information.... ');
					console.dir(response);
					FB.api('/me', function(response) {
						console.log('Good to see you, ' + response.name + '.');
					});
				} else {
					console.log('User cancelled login or did not fully authorize.');
				}
			});	
		}
	}
	return new app();
}
