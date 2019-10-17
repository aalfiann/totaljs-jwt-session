exports.install = function() {

	ROUTE('/', function(){this.view('index')});
	ROUTE('/login', function(){this.view('login')},['#session_page']);
	ROUTE('/login', login, ['post','#session_page']);
	ROUTE('/logout', logout, ['#session_page']);
	ROUTE('/register', function(){this.view('register')});
	ROUTE('/profile', function(){this.view('user-profile')},['#session_page','#session_page_check']);

};

function login() {
	var helper = require(F.path.definitions('app_helper'));
	var self = this;
	if (self.session.jwt_token === undefined) {
		helper.requestHttp(CONF.api_url+'/account/login','post',{
			"content-type":"application/json",
			"x_token":CONF.api_xtoken
		},{
			username:self.body.username,
			password:self.body.password
		}, function(err,response) {
			if (err) {
				if(err.status !== undefined && err.status > 401) {
					console.log(err);
				}
			}
			if(response !== undefined && response.code == 200) {
				self.session.jwt_token = response.response.jwt_token;
				self.redirect('/profile');
			} else {
				self.redirect('/login');
			}
		});
	}
}

function logout() {
	var helper = require(F.path.definitions('app_helper'));
	var self = this;
	helper.requestHttp(CONF.api_url+'/account/logout','post',{
		"content-type":"application/json",
		"x_token":CONF.api_xtoken,
		"jwt_token":self.session.jwt_token
	},'', function(err,response) {
		if (err) {
			if(err.status !== undefined && err.status > 401) {
				console.log(err);
			}
		}
		if(response !== undefined && response.code == 200) {
			F.emit('logout',self);		
		}
		self.redirect('/login');
	});
}