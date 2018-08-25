import TelegramBot from 'node-telegram-bot-api'
import config from 'config'

const fs = require('fs');
const _ = require('lodash');
const request = require('request');

const TOKEN = config.get('token');
const bot = new TelegramBot(TOKEN, { polling: true });

/*bot.on('message', msg => {
    const { chat: { id }} = msg;
    bot.sendMessage(id, 'Pong')
});*/

const KB = {
    currency: 'Курс валюты',
    picture: 'Картинка',
    cat: 'Котик',
    car: 'Тачка',
    back: 'Назад'
};

const PicSrcs = {
    [KB.cat]: [
        'cat1.jpg',
        'cat2.jpg',
        'cat3.jpg',
    ],
    [KB.car]: [
        'car1.jpg',
        'car2.jpg',
        'car3.jpg',
    ]
};

bot.onText(/\/start/, msg => {
    sendGreeting(msg);
});

bot.on('message', msg => {
    switch (msg.text) {
        case KB.currency:
            sendCurrencyScreen(msg.chat.id);
            break;
        case KB.picture:
            sendPictureScreen(msg.chat.id);
            break;
        case KB.back:
            sendGreeting(msg, false);
            break;
        case KB.cat:
        case KB.car:
            sendPictureByName(msg.chat.id, msg.text);
            break;
    }
 });

bot.onText(/\/help (.+)/, (msg, [source, match]) => {
    const { chat: { id }} = msg;
    bot.sendMessage(id, match)
});

bot.on('callback_query', query => {

    //console.log(JSON.stringify(query, null, 2));

    let base = query.data;
    let symbol = 'RUB';

    bot.answerCallbackQuery({
       callback_query_id: query.id,
        text: `Вы выбрали ${base}`
    });

    request(`https://api.fixer.io/latest?symbols=${symbol}&base=${base}`, (error, response, body) => {
        if (error) { throw  new Error(error) }
        if (response.statusCode === 200) {
            let currencyData = JSON.parse(body);
            const html = `<b>1 ${base}</b> - <em>${currencyData.rates[symbol]} ${symbol}</em>`;
            bot.sendMessage(query.message.chat.id, html, {
                parse_mode: 'HTML'
            })
        }
    })

});


function sendPictureScreen(chatId) {
    bot.sendMessage(chatId, `Выберите тип картинки: `, {
        reply_markup: {
            keyboard: [
                [KB.car, KB.cat],
                [KB.back]
            ]
        }
    })
}

function sendGreeting(msg, sayHello = true) {

    let text = sayHello
        ? `Приветствую, ${msg.from.first_name}.\nЧто Вы хотите сделать?`
        : 'Что Вы хотите сделать?';

    bot.sendMessage(msg.chat.id, text, {
        reply_markup: {
            keyboard: [
                [KB.currency, KB.picture]
            ]
        }
    })

}

function sendPictureByName(chatId, picName) {
    let srcs = PicSrcs[picName];
    console.log(srcs);

    let src = srcs[_.random(0, srcs.length - 1)];

    fs.readFile(`${__dirname}/pictures/${src}`, (error, picture) => {
        if (error) throw new Error (error);

        bot.sendPhoto(chatId, picture);
    })
}

function sendCurrencyScreen(chatId) {
    bot.sendMessage(chatId, `Выберите тип валюты:`, {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Доллар',
                        callback_data: 'USD'
                    }
                ],
                [
                    {
                        text: 'Евро',
                        callback_data: 'EUR'
                    }
                ]
            ]
        }
    })
}