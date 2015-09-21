'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _nodeTelegramBot = require('node-telegram-bot');

var _nodeTelegramBot2 = _interopRequireDefault(_nodeTelegramBot);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _token = require('./token');

var _token2 = _interopRequireDefault(_token);

var messages = {
    success: 'Welcome on board! Everything is ok!\nPlease, wait just a moment.\n' + 'I will send you "Picture of the Day"',
    error: 'Oops, something wrong. Try /subscribe one more time',
    subscribed: 'You\'ve been already successfully subscribed',
    unsubscribed: 'You successfully unsubscribed',
    notFound: 'Sorry, but I haven\'t picture with this id in my collection'
};

var bot = new _nodeTelegramBot2['default'](_token2['default']);
var file = __dirname + '/users.json';

var users = [];
_jsonfile2['default'].readFile(file, function (err, arr) {
    users = arr || [];
});

function trasformMonth(month) {
    if (month + 1 < 10) {
        return '0' + (month + 1);
    }

    return month + 1;
}

function standardCallback(err) {
    if (err) {
        console.error(err);
    }
    console.log(users);
}

function sendPhoto(id, imgPath) {
    bot.sendPhoto({
        chat_id: id,
        caption: 'Picture of the Day ' + imgPath.match(/\d/g).join(''),
        files: {
            photo: imgPath
        }
    });
}

function sendMessage(id, text) {
    bot.sendMessage({
        chat_id: id,
        text: text
    });
}

function get(id, imgId) {
    var imgPath = './pics/' + imgId.match(/\d/g).join('') + '.jpg';
    var picture = _fs2['default'].createReadStream(imgPath);

    picture.on('error', function () {
        sendMessage(id, messages.notFound);
    });

    picture.on('readable', sendPhoto.bind(this, id, imgPath));
}

function sendPhotoHandler(id) {
    var today = new Date();
    var imgPath = './pics/' + today.getFullYear() + trasformMonth(today.getMonth()) + today.getDate() + '.jpg';
    var file = _fs2['default'].createReadStream(imgPath);

    file.on('error', function () {
        _request2['default'].get('https://yandex.ru/images/today?size=2560x1600').pipe(_fs2['default'].createWriteStream(imgPath)).on('finish', sendPhoto.bind(this, id, imgPath));
    });

    file.on('readable', sendPhoto.bind(this, id, imgPath));
}

function subscribe(id) {
    if (users.indexOf(id) === -1) {
        users.push(id);
        console.log('==================== USER SUBSCRIBED ====================');
        _jsonfile2['default'].writeFile(file, users, standardCallback);
        sendMessage(id, messages.success);

        // Send today's photo after subscription
        return sendPhotoHandler(id);
    }
    return sendMessage(id, messages.subscribed);
}

function unsubscribe(id) {
    var index = users.indexOf(id);
    if (index !== -1) {
        users.splice(index, 1);
        console.log('==================== USER DELETED ====================');
        _jsonfile2['default'].writeFile(file, users, standardCallback);
        return sendMessage(id, messages.unsubscribed);
    }
}

function onMessageReceived(message) {
    if (message.text === '/subscribe') {
        subscribe(message.from.id);
    } else if (message.text === '/unsubscribe') {
        unsubscribe(message.from.id);
    } else if (message.text.match(/\/get/)) {
        get(message.from.id, message.text);
    }
}

bot.on('message', onMessageReceived);

bot.start();

setInterval(function () {
    users.forEach(sendPhotoHandler);
}, 86400000);
