/**
 * Created by user on 11/03/15.
 */
var redis = require('redis');
var config =  require('../config');
var util = require('util');
var redis_cli = redis.createClient(config['redis_data']);
var async = require('async');
var Q = require('q');
function redis_add(key, socket, data){
    data["msg"] = undefined;
    key=get_redis_key(key);
    redis_cli.sadd(key, JSON.stringify(data),function(err){
        if(err){
            util.log('There was an error while setting the socket.id to redis'+err);
        }
    });
}
function get_redis_key(key){
    return "chatroom:"+key.toString();
}

function parseContents(contents){
    var user_hash = {};
    contents.map(function(content){
        var parsed_content = JSON.parse(content);
            //console.log("id :"+id+"socket id: "+socket["socket_id"]);
        user_hash[parsed_content["socket_id"]] = parsed_content["nick"];
    });
    return user_hash;
}
function getConcurrentUsers(key) {
    var defer = Q.defer();
    key = get_redis_key(key);
    var foreach_promise = Q.denodeify(async.forEach);
    //var smembers = Q.denodeify(redis_cli.smembers);
    Q.ninvoke(redis_cli,"smembers", key).then(function (contents) {
            return parseContents(contents);
    }).then(function (concurrent_users) {
        defer.resolve(concurrent_users);
        // console.log("Concurrent Users : " + JSON.stringify(concurrent_users));
    }).catch(function(err){
        console.log("errored out!"+err);
    });
    return defer.promise;
}

function redis_remove(key, id){
    key = get_redis_key(key);
    var ret_val = {};
    redis_cli.smembers(key, function(err, contents){
        if(!err && contents){
            async.forEach(contents, function(content){
                    var parsed_content = JSON.parse(content);
                    //console.log("id :"+id+"socket id: "+socket["socket_id"]);
                if(parsed_content["socket_id"] === id){
                    //socketobj.broadcast.to(socketobj.chatroom).emit('user left', parsed_content);
                    redis_cli.srem(key, content, function(err){
                       if(err){
                          console.log("Error removing redis key");
                       }
                    });
                }
            });
        }
    });
}

module.exports.redis_add = redis_add;
module.exports.redis_remove = redis_remove;
module.exports.getConcurrentUsers = getConcurrentUsers;