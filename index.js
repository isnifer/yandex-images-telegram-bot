import Bot from 'node-telegram-bot';
import request from 'request';
import fs from 'fs';
import token from './token';

const bot = new Bot(token);

var users = [];

function trasformMonth (month) {
    if (month + 1 < 10) {
        return '0' + (month + 1);
    }

    return month + 1;
}

function sendPhoto (id, imgPath) {
    bot.sendPhoto({
        chat_id: id,
        caption: 'Yandex.Images Picture of the Day',
        files: {
            photo: imgPath
        }
    });
}

function sendPhotoHandler (id) {
    const today = new Date();
    const imgPath = './' + today.getFullYear() + trasformMonth(today.getMonth()) + today.getDate() + '.jpg';
    var file = fs.createReadStream(imgPath);

    file.on('error', function () {
        request
            .get('https://yandex.ru/images/today?size=2560x1600')
            .pipe(fs.createWriteStream(imgPath))
            .on('finish', sendPhoto.bind(this, id, imgPath));
    });

    file.on('readable', sendPhoto.bind(this, id, imgPath));
}

function subscribe (id) {
    users.push(id);
    console.log('==================== USER SUBSCRIBED ====================');

    // Send today's photo after subscription
    sendPhotoHandler(id);
}

function unsubscribe (id) {
    var index = users.indexOf(id);
    if (index !== -1) {
        users.splice(index, 1);
        console.log('==================== USER DELETED ====================');
        console.log(users);
    }
}

function onMessageReceived (message) {
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
