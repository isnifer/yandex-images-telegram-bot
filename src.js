import Bot from 'node-telegram-bot';
import request from 'request';
import fs from 'fs';
import path from 'path';
import jsonfile from 'jsonfile';
import token from './data/token';

const messages = {
    success: 'Welcome on board! Everything is ok!\nPlease, wait just a moment.\n' +
        'I will send you "Picture of the Day"',
    error: 'Oops, something wrong. Try /subscribe one more time',
    subscribed: 'You\'ve been already successfully subscribed',
    unsubscribed: 'You successfully unsubscribed',
    notFound: 'Sorry, but I haven\'t picture with this id in my collection'
};

const bot = new Bot(token);
const file = path.resolve(__dirname, 'data', 'users.json');

var users = [];
jsonfile.readFile(file, function(err, arr) {
    users = arr || [];
});

function trasformMonth (month) {
    if (month + 1 < 10) {
        return '0' + (month + 1);
    }

    return month + 1;
}

function getDate (today) {
    return today.getFullYear() + trasformMonth(today.getMonth()) + today.getDate();
}

function standardCallback (err) {
    if (err) {
        console.error(err);
    }
    console.log(users);
}

function sendPhoto (id, imgPath) {
    bot.sendPhoto({
        chat_id: id,
        caption: 'Picture of the Day ' + imgPath.match(/\d/g).join(''),
        files: {
            photo: imgPath
        }
    });
}

function sendMessage (id, text) {
    bot.sendMessage({
        chat_id: id,
        text: text
    });
}

function get (id, imgId) {
    imgId = imgId.match(/\d/g);

    if (!imgId || imgId && isNaN(imgId)) {
        sendMessage(id, messages.notFound);
        return;
    } else {
        imgId = imgId.join('')
    }

    var imgPath = path.resolve(__dirname, 'pics', imgId + '.jpg');
    var picture = fs.createReadStream(imgPath);

    picture.on('error', function () {
        sendMessage(id, messages.notFound);
    });

    picture.on('readable', sendPhoto.bind(this, id, imgPath));
}

function sendPhotoHandler (id) {
    const today = new Date();
    const imgPath = path.resolve(
        __dirname,
        'pics',
        getDate(today) + '.jpg'
    );
    var stream = fs.createReadStream(imgPath);

    stream.on('error', function () {
        request
            .get('https://yandex.ru/images/today?size=2560x1600')
            .pipe(fs.createWriteStream(imgPath))
            .on('finish', sendPhoto.bind(this, id, imgPath));
    });

    stream.on('readable', sendPhoto.bind(this, id, imgPath));
}

function subscribe (id) {
    if (users.indexOf(id) === -1) {
        users.push(id);
        console.log('==================== USER SUBSCRIBED ====================');
        jsonfile.writeFile(file, users, standardCallback);
        sendMessage(id, messages.success);

        // Send today's photo after subscription
        return sendPhotoHandler(id);
    }

    return sendMessage(id, messages.subscribed);
}

function unsubscribe (id) {
    var index = users.indexOf(id);
    if (index !== -1) {
        users.splice(index, 1);
        console.log('==================== USER DELETED ====================');
        jsonfile.writeFile(file, users, standardCallback);
        return sendMessage(id, messages.unsubscribed);
    }
}

function onMessageReceived (message) {
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
