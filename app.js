var morgan  = require('morgan');
var express = require('express');
var app     = express();
var port    = process.env.PORT || 3000;
var router  = express.Router();
var server  = require('http').createServer(app);
var bodyParser = require('body-parser');
var geocoder = require('node-geocoder');
var io = require('socket.io')(server);
var Twit = require('twit');

// var publicConfig = {
//   key: process.env.GOOGLE_API_KEY,
//   stagger_time:       1000, // for elevationPath
//   encode_polylines:   false,
//   secure:             true, // use https
// }
var search_query;
var stream;
app.use(express.static(__dirname + '/public'));
var twitter = new Twit({
  consumer_key: process.env.TWITTER_API_TEST,
  consumer_secret: process.env.TWITTER_SECRET_TEST,
  access_token: process.env.TWITTER_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_TOKEN_SECRET
});

app.use(bodyParser({ extended: false }));

app.set('views', './views');
app.set('view engine', 'ejs');

app.use(morgan('dev'));

router.get('/', function(req, res) {
  res.render('index', { header: 'Stream Tweets'});
});

router.get('/contact', function(req, res) {
  res.render('contact', { header: 'Contact'});
});

router.get('/about', function(req, res) {
  res.render('about', { header: 'About'});
});

app.use('/', router);
server.listen(port);

console.log('Server started on ' + port);

io.on('connect', function(socket) { 

  socket.on('query', function (data) {
    console.log(data);
    if (stream) stream.stop();
    console.log('stop');
      if (data.type == "By Location") {
        console.log(String(data.bounds.bounds));
        var bounds = [ data.bounds.A, data.bounds.B, data.bounds.C, data.bounds.D]
            search_query = { locations: bounds}
      } else if (data.type == "By Your Location") {
        console.log(data.bounds);
      var bounds = [ data.bounds.A, data.bounds.B, data.bounds.C, data.bounds.D]

        search_query = { 'query': data.query, 'locations': bounds }
      } else {
        search_query = { track: data.query };
      }

     stream = twitter.stream('statuses/filter', search_query);
     stream.on('tweet', function(tweet){
       var data = {};
       data.name = tweet.user.name;
       data.screen_name = tweet.user.screen_name;
       data.text = tweet.text;
       data.profile_image_url = tweet.user.profile_image_url
       socket.emit('tweets', data);
     })
     stream.start();
     console.log('started');
  });
 
});

