var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/chat', function(req, res, next) {
	console.log(req.body);
 	res.render('chat',{ 
 		title: 'Chat',
 		room: req.body.room,
 		nickname: req.body.nick
 	});
 	
 });

module.exports = router;
