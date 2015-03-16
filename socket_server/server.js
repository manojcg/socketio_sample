var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var utils = require('./utils');
var Q = require('q');

function disconnect(socket){
    var room = socket.chatroom;

    var user_info;
    user_info = utils.redis_remove(room, socket.id);
    if(room){
        console.log('Emitting on disconnect');
        io.to(room).emit('user left', {
            "socket_id" : socket.id
        });
    }
}
io.on('connection', function(socket){
   console.log("A new socket :" + socket);
    socket.emit('handshake', {'handshake' : true});
    socket.on('join_room', function(data){
        socket.join(data["room"]);
        socket.chatroom = data["room"];
        data['socket_id'] = socket.id;
        socket.broadcast.to(socket.chatroom).emit('new joinee', {
            "socket_id": data["socket_id"],
            "nick":  data["nick"]
        });
        utils.getConcurrentUsers(socket.chatroom).then(function(concurrent_users) {
            utils.redis_add(data["room"], data["socket_id"], data);
            io.to(socket.id).emit('previous clients', {
                "concurrent_users": concurrent_users
            });
        });
    });
    socket.on('disconnect', function(){
        disconnect(socket);
        console.log('user disconnected');
    });
    socket.on('chat message', function(data){
        socket.broadcast.to(data["room"]).emit('new message', data["nick"]+": "+data["msg"]);
    });
});

http.listen(8080, function() {
    console.log("Listening on 8080");
});