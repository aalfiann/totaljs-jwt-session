'use strict';

const fs = require('fs');
const jwt = require('jsonwebtoken');

/**
 * Generate JWT
 * @param {object} payload 
 * @param {object} $Options 
 * @param {*} callback 
 * @return {callback}
 */
function sign(payload, $Options, callback) {
  // use 'utf8' to get string instead of byte array  (512 bit key)
  var privateKEY  = fs.readFileSync(F.path.root('jwt_private.key'), 'utf8');

  // Token signing options
  var signOptions = {
      issuer:  CONF.jwt_issuer,
      subject:  $Options.subject,
      audience:  CONF.jwt_audience,
      expiresIn:  CONF.jwt_expires,
      algorithm:  CONF.jwt_algorithm
  };

  jwt.sign(payload, privateKEY, signOptions, function(err, token) {
    if (err) return callback(err);
    return callback(null,token);
  });
}

/**
 * Verify JWT
 * @param {string} token 
 * @param {object} $Option 
 * @param {*} callback
 * @return {callback} 
 */
function verify(token, $Option, callback) {
  var publicKEY  = fs.readFileSync(F.path.root('jwt_public.key'), 'utf8');
  var verifyOptions = {
      issuer:  CONF.jwt_issuer,
      subject:  $Option.subject,
      audience:  CONF.jwt_audience,
      expiresIn:  CONF.jwt_expires,
      algorithm:  [CONF.jwt_algorithm]
  };
  jwt.verify(token, publicKEY, verifyOptions, function(err,decode){
    if (err) return callback(err);
    return callback(null,decode);
  });
}

function decode(token) {
  return jwt.decode(token, {complete: true});
}

module.exports = {
  sign,
  verify,
  decode
}