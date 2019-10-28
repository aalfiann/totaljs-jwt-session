'use strict';

const bcrypt = require('bcryptjs');
const ParallelRequest = require('parallel-http-request');
const Hashids = require('hashids/cjs');
const hashids = new Hashids();

module.exports = {
    scalarArrayToObject,
    scalarObjectToArray,
    sumScalarObject,
    schemaErrorBuilder,
    builderErrorResponse,
    successResponse,
    failResponse,
    customResponse,
    firstHour,
    lastHour,
    timestamp,
    firewallUrlParameter,
    cryptPassword,
    comparePassword,
    requestHttp,
    generatePublicRole,
    verifyPublicRole
}

/**
 * Convert scalar object to array
 * @param {*} name      this is the field name of scalar
 * @param {*} data      this is the object scalar
 * @return {array}
 */
function scalarObjectToArray(name,data) {
    var arr = [];
    for (var k in data) {
        var obj = {};
        if (data.hasOwnProperty(k)) {
            obj[name] = k;
            obj['count'] = data[k];
            arr.push(obj);
        }
    }
    return arr;
}

/**
 * Convert scalar array to object / convert array back to original object scalar
 * @param {*} arr       this is the scalar array
 * @param {*} key       this is the object name of key from scalar array 
 * @param {*} value     this is the object name of value from scalar array
 * @return {object}
 */
function scalarArrayToObject(arr,key,value) {
    var obj = {};
    for (var i = 0; i < arr.length; ++i) obj[arr[i][key]] = arr[i][value];
    return obj;
}

/**
 * Sum the value from scalar object
 * @param {*} data      this is the scalar object
 * @return {float}
 */
function sumScalarObject(data){
    return Object.keys(data).reduce((sum,key)=>sum+parseFloat(data[key]||0),0);
}

/**
 * Modify error from schema
 * @param {string} name     this is the error key name 
 */
function schemaErrorBuilder(name){
    return ErrorBuilder.addTransform(name, function(isResponse) {
        var builder = [];
    
        for (var i = 0, length = this.items.length; i < length; i++) {
            var err = this.items[i];
            builder.push({name:err.name,error:err.error});
        }
    
        if (isResponse) {
            this.status = 400;
            if (builder.length > 0){
                return JSON.stringify({
                    code:this.status,
                    status:'error',
                    message:'Invalid parameter',
                    error:builder
                });
            } else {
                this.status = 500;
                return JSON.stringify({
                    code:this.status,
                    status:'error',
                    message:'Something went wrong...'
                });
            }
        }
        return builder;
    });
}

/**
 * Database builder error response
 * @param {controller} $        this is the totaljs controller
 * @return {callback}
 */
function builderErrorResponse($,err){
    $.controller.status = 409;
    $.callback(JSON.parse(JSON.stringify({
        code:409,
        status:'error',
        message:'Something went wrong...',
        error:err
    })));
}

/**
 * Response success 
 * @param {controller} $        this is the totaljs controller
 * @param {string} message      this is the message of response
 * @param {*} response          this is the response detail
 * @return {callback}
 */
function successResponse ($,message, response=[]) {
    $.controller.status = 200;
    var success = {
        'code':200,
        'status':'success',
        'message':message,
        'response':response
    }
    $.callback(JSON.parse(JSON.stringify(success)));
}

/**
 * Response fail 
 * @param {controller} $        this is the totaljs controller
 * @param {string} message      this is the message of response
 * @param {*} response          this is the response detail
 * @return {callback}
 */
function failResponse ($, message, response=[]) {
    $.controller.status = 200;
    var fail = {
        'code':200,
        'status':'error',
        'message':message,
        'response':response
    }
    $.callback(JSON.parse(JSON.stringify(fail)));
}

/**
 * Response custom 
 * @param {controller} $        this is the totaljs controller
 * @param {int} code            this is the http code you want to sent in response header
 * @param {string} status       this is the status you want to sent in response body
 * @param {string} message      this is the message of response
 * @param {*} response          this is the response detail
 * @param {bool} isError        this is the type of success or error response
 * @return {callback}
 */
function customResponse ($, code, status, message, response=[], isError=false) {
    $.controller.status = code;
    var custom = {
        'code':code,
        'status':status,
        'message':message
    }
    if(response !== undefined && response !== null) {
        var name = undefined;
        if(isError) {
            name = 'error';
        } else {
            name = 'response';
        }
        custom[name] = response;
    }
    $.callback(JSON.parse(JSON.stringify(custom)));
}

/**
 * Get the first hour of datetime
 * @param {*} date      this is the date string / object date (optional)
 * @return {Date}
 */
function firstHour(date){
    date=(date===undefined)?"":date;
    if(date) return new Date(date).setHours(0,0,0,0);
    return new Date().setHours(0,0,0,0);
}

/**
 * Get the last hour of datetime
 * @param {*} date      this is the date string / object date (optional)
 * @return {Date}
 */
function lastHour(date){
    date=(date===undefined)?"":date;
    if(date) return new Date(date).setHours(23,59,59,999);
    return new Date().setHours(23,59,59,999);
}

/**
 * Get the timestamp of datetime
 * @param {*} date      this is the date string / object date (optional)
 * @return {Date}
 */
function timestamp(date){
    date=(date===undefined)?"":date;
    if (date) return new Date(date).toISOString().replace("T", " ").replace("Z", "").substr(0,19);
    return new Date().toISOString().replace("T", " ").replace("Z", "").substr(0,19);
}

/**
 * Firewall URL Parameter
 * @param {string} url              this is the url
 * @param {string|array} whitelist  [optional] this is the whitelist of url params name. If empty then will block any url parameters.
 * @return {bool}
 */
function firewallUrlParameter(url,whitelist) {
    whitelist = (whitelist==undefined)?[]:whitelist;
    whitelist = whitelist instanceof Array ? whitelist : [whitelist];
    var request = {}, result = true;
    if(url.indexOf('?') > 0) {
        var pairs = url.substring(url.indexOf('?') + 1).split('&');
        for (var i = 0; i < pairs.length; i++) {
            if(!pairs[i])
                continue;
            var pair = pairs[i].split('=');
            request[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }

        var data = Object.keys(request).map(function(key) {
            return key;
        });

        for (const key of data) {
            if(whitelist.includes(key) == false) {
                result = false;
            }
        }
    }
    return result;
}

/**
 * Encrypt password
 * @param {string} password     this is the user password 
 * @param {*} callback
 * @return {callback} 
 */
function cryptPassword(password, callback) {
   bcrypt.genSalt(10, function(err, salt) {
    if (err) 
      return callback(err);

    bcrypt.hash(password, salt, function(err, hash) {
      return callback(err, hash);
    });
  });
};

/**
 * Compare password
 * @param {string} plainPass        this is the user password 
 * @param {string} hashword         this is the hashed user password
 * @param {*} callback 
 * @return {callback}
 */
function comparePassword(plainPass, hashword, callback) {
   bcrypt.compare(plainPass, hashword, function(err, isPasswordMatch) {   
       return err == null ?
           callback(null, isPasswordMatch) :
           callback(err);
   });
};

/**
 * Simple HTTP request
 * @param {string} url          this is the url request
 * @param {string} method       [optional] this is the HTTP method GET|POST|PUT|DELETE|HEAD|PATCH|OPTIONS. Default is GET.
 * @param {object} headers      [optional] this is the request headers 
 * @param {object} body         [optional] this is the request body
 * @param {*} callback
 * @return {callback} 
 */
function requestHttp(url,method,headers,body,callback) {
    var request = new ParallelRequest();
    var unirest = undefined;
    method = method.toString().toLowerCase();
    switch(method) {
        case 'post':
            unirest = request.unirest.post(url);
            break;
        case 'put':
            unirest = request.unirest.put(url);
            break;
        case 'delete':
            unirest = request.unirest.delete(url);
            break;
        case 'patch':
            unirest = request.unirest.patch(url);
            break;
        case 'options':
            unirest = request.unirest.options(url);
            break;
        default:
            unirest = request.unirest.get(url);
    }
    if (headers) unirest.headers(headers);
    if (body) unirest.send(body);
	unirest.end(function (response) {
		if(response.error) return callback(response.error);
		return callback(null,response.body); 
	});
}

/**
 * Generate Public Role for JWT
 * @param {int} num
 * @return {string} 
 */
function generatePublicRole(num) {
    return hashids.encode(num+''+Date.now());
}

/**
 * Verify Public Role from JWT
 * @param {string} data
 * @return {string} 
 */
function verifyPublicRole(data) {
    return hashids.decode(data.toString()).toString().charAt(0);
}