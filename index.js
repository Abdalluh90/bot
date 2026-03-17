const TelegramBot = require('node-telegram-bot-api');
const youtubedl = require('yt-dlp-exec');
const fs = require('fs');

const bot = new TelegramBot(process.env.TOKEN, { polling: true });
const ADMIN_ID = process.env.ADMIN_ID;

console.log("🔥 PRO DOWNLOAD BOT STARTED");

let users = new Set();

// start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name;

    if (!users.has(chatId)) {
        users.add(chatId);

        bot.sendMessage(ADMIN_ID,
`👤 مستخدم جديد
ID: ${chatId}
👥 Total: ${users.size}`);
    }

    bot.sendMessage(chatId,
`🔥 أهلاً يا ${name}

📥 ابعت لينك الفيديو
وبعدين اختار:

🎬 جودة الفيديو
🎧 MP3`);
});

// استقبال اللينك
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith("/")) return;

    if (text.startsWith("http")) {

        bot.sendMessage(chatId, "اختار 👇", {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "🎥 عالي", callback_data: `high|${text}` },
                        { text: "📱 متوسط", callback_data: `low|${text}` }
                    ],
                    [
                        { text: "🎧 MP3", callback_data: `mp3|${text}` }
                    ]
                ]
            }
        });
    }
});

// تحميل
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const [type, url] = query.data.split("|");

    bot.sendMessage(chatId, "⏳ جاري التحميل...");

    let fileName;

    try {
        if (type === "high") {
            fileName = `video_${chatId}.mp4`;

            await youtubedl(url, {
                output: fileName,
                format: 'bestvideo+bestaudio'
            });

            await bot.sendVideo(chatId, fileName);
        }

        if (type === "low") {
            fileName = `video_${chatId}.mp4`;

            await youtubedl(url, {
                output: fileName,
                format: 'worst'
            });

            await bot.sendVideo(chatId, fileName);
        }

        if (type === "mp3") {
            fileName = `audio_${chatId}.mp3`;

            await youtubedl(url, {
                output: fileName,
                extractAudio: true,
                audioFormat: 'mp3'
            });

            await bot.sendAudio(chatId, fileName);
        }

        bot.sendMessage(chatId, "✅ تم التحميل");

        fs.unlinkSync(fileName);

    } catch (err) {
        console.log(err);
        bot.sendMessage(chatId, "❌ فشل التحميل");
    }

    bot.answerCallbackQuery(query.id);
});
