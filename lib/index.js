'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _nodeTelegramBot = require('node-telegram-bot');

var _nodeTelegramBot2 = _interopRequireDefault(_nodeTelegramBot);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _token = require('./token');

var _token2 = _interopRequireDefault(_token);

var bot = new _nodeTelegramBot2['default'](_token2['default']);

var users = [];

function trasformMonth(month) {
    if (month + 1 < 10) {
        return '0' + (month + 1);
    }

    return month + 1;
}

function sendPhoto(id, imgPath) {
    bot.sendPhoto({
        chat_id: id,
        caption: 'Yandex.Images Picture of the Day',
        files: {
            photo: imgPath
        }
    });
}

function sendPhotoHandler(id) {
    var today = new Date();
    var imgPath = './' + today.getFullYear() + trasformMonth(today.getMonth()) + today.getDate() + '.jpg';
    var file = _fs2['default'].createReadStream(imgPath);

    file.on('error', function () {
        _request2['default'].get('https://yandex.ru/images/today?size=2560x1600').pipe(_fs2['default'].createWriteStream(imgPath)).on('finish', sendPhoto.bind(this, id, imgPath));
    });

    file.on('readable', sendPhoto.bind(this, id, imgPath));
}

function subscribe(id) {
    users.push(id);
    console.log('==================== USER SUBSCRIBED ====================');

    // Send today's photo after subscription
    sendPhotoHandler(id);
}

function unsubscribe(id) {
    var index = users.indexOf(id);
    if (index !== -1) {
        users.splice(index, 1);
        console.log('==================== USER DELETED ====================');
        console.log(users);
    }
}

function onMessageReceived(message) {
    if (message.text === '/subscribe') {
        subscribe(message.from.id);
    } else if (message.text === '/unsubscribe') {
        unsubscribe(message.from.id);
    }
}

bot.on('message', onMessageReceived);

bot.start();

setInterval(function () {
    users.forEach(sendPhotoHandler);
}, 86400000);
