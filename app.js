var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var bwip = require('bwip-js');
var crypto = require('crypto');
var config = require('./config');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.enable('trust proxy');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var bowser = require('bowser');
function checkCompatibility(useragent) {
  var windowsCompatibilityGuide = {
      'XP': {
          'firefox': {
              'silverlight4': true,
              'silverlight5': true
          },
          'chrome': {
              'silverlight4': true,
              'silverlight5': true
          },
          'msie': {
              'silverlight4': true,
              'silverlight5': true
          }
      },
      'Vista': {
          'firefox': {
              'html5': 720,
              'silverlight4': true,
              'silverlight5': true
          },
          'chrome': {
              'silverlight4': true,
              'silverlight5': true
          },
          'opera': {
              'html5': 720
          },
          'msie': {
              'silverlight4': true,
              'silverlight5': true
          }
      },
      '7': {
          'firefox': {
              'html5': 720,
              'silverlight4': true
          },
          'chrome': {
              'html5': 720,
              'silverlight4': true
          },
          'opera': {
              'html5': 720
          },
          'msie': {
              'silverlight4': true
          }
      },
      '8': {
          'firefox': {
              'html5': 720,
              'silverlight5': true
          },
          'chrome': {
              'html5': 720
          },
          'opera': {
              'html5': 720,
              'silverlight5': true
          }
      },
      '8.1': {
          'firefox': {
              'html5': 720,
              'silverlight5': true
          },
          'chrome': {
              'html5': 720,
              'silverlight5': true
          },
          'opera': {
              'html5': 720
          },
          'msie': {
              'html5': 1080,
              'silverlight5': true
          }
      },
      '10': {
          'firefox': {
              'html5': 720
          },
          'chrome': {
              'html5': 720
          },
          'opera': {
              'html5': 720
          },
          'msie': {
              'html5': 1080
          },
          'msedge': {
              'html5': 4096
          }
      }
  };

  var agent = bowser._detect(useragent);
  var comp = {};
  if (agent.windows) {
      if (windowsCompatibilityGuide[agent.osversion] !== undefined) {
          if (windowsCompatibilityGuide[agent.osversion][agent.browser] !== undefined) {
              comp = windowsCompatibilityGuide[agent.osversion][agent.browser];
          }
      }
  } else if (agent.mac && agent.safari) {
      if (bowser.compareVersions([agent.osversion, '10.10.3']) > 0) {
          comp = {'html5': 1080, 'silverlight4': true, 'silverlight5': true};
      } else if (bowser.compareVersions([agent.osversion, '10.10']) > 0) {
          comp = {'html5': 720, 'silverlight4': true, 'silverlight5': true};
      } else if (bowser.compareVersions([agent.osversion, '10.5.7']) > 0) {
          comp = {'silverlight4': true, 'silverlight5': true};
      } else if (bowser.compareVersions([agent.osversion, '10.4.11']) > 0) {
          comp = {'silverlight4': true};
      } else {
          comp = {};
      }
  } else if (agent.mac && agent.firefox) {
      if (bowser.compareVersions([agent.osversion, '10.10.3']) > 0) {
          comp = {'html5': 1080, 'silverlight4': true, 'silverlight5': true};
      } else if (bowser.compareVersions([agent.osversion, '10.10']) > 0) {
          comp = {'html5': 720, 'silverlight4': true, 'silverlight5': true};
      } else if (bowser.compareVersions([agent.osversion, '10.5.7']) > 0) {
          comp = {'silverlight4': true, 'silverlight5': true};
      } else if (bowser.compareVersions([agent.osversion, '10.4.11']) > 0) {
          comp = {'silverlight4': true};
      } else {
          comp = {};
      }
  } else if (agent.os === 'chromeos') {
      comp = {'html5': 1080};
  } else if (agent.linux & agent.chrome || agent.linux & agent.firefox) {
      comp = {'html5': 720};
  } else {
      comp = {};
  }
  console.log(agent);
  return comp;
}

app.get('/', function(req, res) {
    var random = crypto.randomBytes(48).toString('hex');
    var token = jwt.sign(random, config.secret);
    var imgurl = 'http';
    if (config.host.secure) imgurl += 's';
    imgurl += '://' + config.host.name + ':' + config.host.port + '/token/' + random;
    var compatibility = checkCompatibility(req.header('User-Agent'));
    console.log(compatibility);
    var vars = {
        'img': imgurl,
        'compatibility': compatibility
    };
    res.cookie('token', token);
    res.render('./index', vars);
});

app.get('/token/:random', function (req, res) {
    if (!req.params.random) {
        res.writeHead(404, { 'Content-Type':'text/plain' });
        res.end('IT\'S TIME TO STOP', 'utf8');
    } else {
        bwip(req, res, {
            'bcid': 'qrcode',
            'text': req.params.random
        });
    }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
