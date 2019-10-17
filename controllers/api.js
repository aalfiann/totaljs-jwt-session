exports.install = function() {

    // Account
    ROUTE('/api/account/register', ['post','*Account --> @register','#auth_api']);
    ROUTE('/api/account/login', ['post','*Account --> @login','#auth_api']);
    ROUTE('/api/account/verify', ['post','*Account --> @verify','#auth_api','#auth_user','#session_api']);
    ROUTE('/api/account/logout', ['post','*Account --> @logout','#auth_api','#auth_user','#session_api']);
    
}