const helper = require(F.path.definitions('app_helper'));
const uuidv4 = require('uuid/v4');
const jwt = require(F.path.definitions('jwt'));

NEWSCHEMA('Account').make(function(schema) {
    schema.define('username', 'string');
    schema.define('password', 'string');
    schema.define('email', 'string');

    schema.required('username,password', function(model, op) {
        switch(true) {
            case (op.login == 1):
                return true;
            case (op.register == 1):
                return true;
            default:
                return false;
        }
    });

    schema.required('email', function(model, op) {
        return op.register;
    });

    // Listen schema validation error from totaljs
    helper.schemaErrorBuilder('custom');
    schema.setError((error) => { error.setTransform('custom') });

    schema.addWorkflow('register', function($) {
        var data = $.model.$clean();
        var username = data.username.toString().toLowerCase();

        var nosql = NOSQL('user_data');

        nosql.find().make(function(builder) {
            builder.where('username', username);
            builder.callback(function(err, response, count) {
                if(err) helper.builderErrorResponse($,err);
                if (count) {
                    helper.failResponse($,'Sorry, Username is already exists!')
                } else {
                    helper.cryptPassword(data.password,function(err,hash) {
                        if(err) helper.customResponse($,409,'error','Failed to encrypt password!',err,true);
                        nosql.insert({
                            id:uuidv4(),
                            username:username,
                            hash:hash,
                            email:data.email,
                            date_created:Date.now()
                        }).callback(function(err) {
                            if(err) {
                                helper.builderErrorResponse($,err);
                            } else {
                                helper.successResponse($,'Register is successfully!');
                            }
                        });
                    });
                }
            });
        });
    });

    schema.addWorkflow('login', function($) {
        var data = $.model.$clean();
        var nosql = NOSQL('user_data');
        nosql.find().make(function(builder) {
            builder.where('username', data.username.toString().toLowerCase());
            builder.callback(function(err,response,count) {
                if(err) helper.builderErrorResponse($,err);
                if(count) {
                    var user = response[0];
                    helper.comparePassword(data.password,user.hash, function(err,isPasswordMatch){
                        if(err) helper.customResponse($,409,'error','Failed to compare password!',err,true);
                        if(isPasswordMatch) {
                            var payload = {
                                uid:user.id,
                                uname:user.username
                            };
                        
                            var options = {
                                subject:user.email
                            };

                            jwt.sign(payload,options, function(err,sign) {
                                if(err) helper.customResponse($,409,'error','Failed to generate signature!',err,true);
                                var decode = jwt.decode(sign);
                            
                                // Creates a cookie and session item
                                var opt = {};
			                    opt.name = 'users';
                                opt.key = CONF.api_xtoken;
                                opt.id = user.id;
                                opt.expire = CONF.api_session_expires;
                                MAIN.session.setcookie($, opt);

                                helper.successResponse($,'Login successful',{
                                    jwt_token:sign,
                                    expire:decode.payload.exp
                                });
                            });
                        } else {
                            helper.failResponse($,'Wrong username or password!');
                        }
                    });
                } else {
                    helper.failResponse($,'Wrong username or password!');
                }
            });
        });
    });

    schema.addWorkflow('verify', function($) {
        helper.successResponse($,'Signature is valid',{payload:$.controller.repository.payload});
    });

    // Performs logout
	schema.addWorkflow('logout', function($) {
		// Removes session if any
		MAIN.session.remove2($.controller.repository.payload.uid,function(err,count) {
            if(err) helper.failResponse($,'You already logout!');
            helper.successResponse($,'Logout succesfully!');
            MAIN.session.clean();
        });
	});

});