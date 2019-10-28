const app_helper = require(F.path.definitions('app_helper'));
const jwt = require(F.path.definitions('jwt'));

// Authenticate api
MIDDLEWARE('auth_api',function($) {
    $.controller.req.headers['x_token'] = ($.controller.req.headers['x_token'] == undefined)?'':$.controller.req.headers['x_token'];
    if($.controller.req.headers['x_token'] == F.config.api_xtoken) {
        $.next();
    } else {
        $.controller.status = 401;
        $.controller.json({code:401,status:'error',message:'You\'re not authorized to use this API!'});
    }
});

// Authenticate User
MIDDLEWARE('auth_user',function($) {
    $.controller.req.headers['jwt_token'] = ($.controller.req.headers['jwt_token'] == undefined)?'':$.controller.req.headers['jwt_token'];
    var jwt_token = $.controller.req.headers['jwt_token'];
    if(jwt_token) {
        var decode = jwt.decode(jwt_token);
        if(decode) {
            jwt.verify(jwt_token,{subject:decode.payload.sub},function(err,payload) {
                if(err) {
                    $.controller.status = 401;
                    $.controller.json({code:401,status:'error',message:'Failed to verify your session!',error:err});
                } else {
                    $.controller.repository.payload = payload;
                    $.next();
                }
            });
        } else {
            $.controller.status = 401;
            $.controller.json({code:401,status:'error',message:'You\'re token is broken!'});
        }
    } else {
        $.controller.status = 401;
        $.controller.json({code:401,status:'error',message:'You\'re not authorized to use this API!'});
    }
});

// Is Admin
MIDDLEWARE('is_admin',function($) {
    if($.controller.repository !== undefined && $.controller.repository.payload !== undefined && $.controller.repository.payload.ids !== undefined) {
        if(app_helper.verifyPublicRole($.controller.repository.payload.ids) === '1'){
            $.next();
        }
    } else {
        $.controller.status = 401;
        $.controller.json({code:401,status:'error',message:'You\'re not authorized to use this API!'});
    }
});

// Middleware for firewall in url parameter
// Note: 
// - this is required options.whitelist_url_parameter in controller
// - use this for API only
MIDDLEWARE('firewall_url_parameter',function($) {
    var whitelist = ($.controller.route.options.whitelist_url_parameter == undefined)? []:$.controller.route.options.whitelist_url_parameter;
    if(app_helper.firewallUrlParameter($.controller.req.uri.href,whitelist)) {
        $.next();
    } else {
        $.controller.status = 400;
        $.controller.json({code:400,status:'error',message:'Invalid parameter!'});
    }
});

// Session for API
// Note: 
// - MAIN is a global shared object (it's part of Total.js)
// - Why do we use MAIN.session? Because we can access into the session from every place (on server-side) in this application
// - SESSION is better using redis than we create session instance like this below
MAIN.session = SESSION();
MIDDLEWARE('session_api',function($) {
    var uid = $.controller.repository.payload.uid;
    MAIN.session.has2(uid,function(err,exists){
        if(err) console.log(err);
        if(exists) {
            // Extend session expires time
            MAIN.session.update2(uid,'',CONF.api_session_expires,'','');
            $.next();
        }
        $.controller.status = 401;
        $.controller.json({code:401,status:'error',message:'You\'re not authorized to use this API!'});
    });
});


// Session for page
const SESSION_PAGE = {};
MIDDLEWARE('session_page', function($) {
    var cookie = $.controller.req.cookie('__session');
    var ip = $.controller.req.ip.hash().toString();
    // A simple prevention for session hijacking
    if (cookie) {
        var arr = cookie.split('|');
        if (arr[1] !== ip)
        cookie = null;
    }
    if (!cookie) {
        cookie = U.GUID(15) + '|' + ip;
        // Writes cookie
        $.controller.res.cookie('__session', cookie);
    }
    // Get session
    var session = SESSION_PAGE[cookie];
    // Get current time
    var now = Date.now();
    // Refresh session timeout
    var refresh = new Date(now + CONF.app_session_timeout*60000);
    if (session) {
        $.controller.req.session = session;
        if($.controller.req.session.refresh !== undefined) {
            if(now > $.controller.req.session.refresh) {
                SESSION[cookie] = $.controller.req.session = {};
            } else {
                $.controller.req.session.refresh = refresh.getTime();
            }
        }
    } else {
        SESSION_PAGE[cookie] = $.controller.req.session = {};
        $.controller.req.session.refresh = refresh.getTime();
    }
    $.next();
});

MIDDLEWARE('session_page_is_login', function($) {
    if($.session !== undefined && $.session.jwt_token !== undefined) {
        $.next();
    } else {
        var cookie = $.controller.req.cookie('__session');
        delete SESSION_PAGE[cookie];
        $.controller.redirect('/login');
    }
});

MIDDLEWARE('session_page_is_admin', function($) {
    if($.session !== undefined && $.session.jwt_token !== undefined) {
        var decode = jwt.decode($.session.jwt_token);
        if(decode) {
            jwt.verify($.session.jwt_token,{subject:decode.payload.sub},function(err,payload) {
                if(err) {
                    console.log(err);
                } else {
                    if(app_helper.verifyPublicRole(payload.ids) === '1') {
                        $.next();
                    }
                }
            });
        }
        $.controller.redirect('/profile');
    } else {
        var cookie = $.controller.req.cookie('__session');
        delete SESSION_PAGE[cookie];
        $.controller.redirect('/login');
    }
});

F.on('logout', function($) {
    var cookie = $.cookie('__session');
    delete SESSION_PAGE[cookie];
});