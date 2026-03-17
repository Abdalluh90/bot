const TelegramBot = require('node-telegram-bot-api');
const youtubedl = require('yt-dlp-exec');
const fs = require('fs');

const bot = new TelegramBot(process.env.TOKEN, { polling: true });
const ADMIN_ID = process.env.ADMIN_ID;

console.log("🔥 BOT STARTED");

// تخزين المستخدمين
let users = new Set();

// /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name;
    const username = msg.from.username || "NoUsername";

    if (!users.has(chatId)) {
        users.add(chatId);

        bot.sendMessage(ADMIN_ID,
`👤 مستخدم جديد
ID: ${chatId}
Name: ${name}
Username: @${username}
👥 Total: ${users.size}`);
    }

    bot.sendMessage(chatId,
`👋 أهلاً يا ${name}

🎬 ابعت لينك الفيديو
واختار النوع:

📥 فيديو
🎧 MP3

📩 الدعم:
@Abdalluhgomaa`);
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
                        { text: "🎥 جودة عالية", callback_data: `video_high|${text}` },
                        { text: "📱 جودة متوسطة", callback_data: `video_low|${text}` }
                    ],
                    [
                        { text: "🎧 MP3", callback_data: `mp3|${text}` }
                    ]
                ]
            }
        });
    }
});

// التعامل مع الأزرار
bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const data = query.data;

    const [type, url] = data.split("|");

    bot.sendMessage(chatId, "⏳ جاري التحميل...");

    let fileName;

    try {
        if (type === "video_high") {
            fileName = `video_${chatId}.mp4`;
            await youtubedl(url, {
                output: fileName,
                format: 'best'
            });
        }

        if (type === "video_low") {
            fileName = `video_${chatId}.mp4`;
            await youtubedl(url, {
                output: fileName,
                format: 'worst'
            });
        }

        if (type === "mp3") {
            fileName = `audio_${chatId}.mp3`;
            await youtubedl(url, {
                extractAudio: true,
                audioFormat: 'mp3',
                output: fileName
            });
        }

        // إرسال الملف
        if (type === "mp3") {
            await bot.sendAudio(chatId, fileName);
        } else {
            await bot.sendVideo(chatId, fileName);
        }

        bot.sendMessage(chatId,
`✅ تم التحميل

📩 للتواصل:
@Abdalluhgomaa`);

        // إشعار للإدمن
        bot.sendMessage(ADMIN_ID,
`📥 تحميل جديد
🔗 ${url}`);

        // حذف الملف
        fs.unlinkSync(fileName);

    } catch (err) {
        console.log(err);
        bot.sendMessage(chatId, "❌ فشل التحميل");
    }

    bot.answerCallbackQuery(query.id);
});

// عدد المستخدمين
bot.onText(/\/users/, (msg) => {
    if (msg.chat.id == ADMIN_ID) {
        bot.sendMessage(msg.chat.id, `👥 Users: ${users.size}`);
    }
});

// broadcast
bot.onText(/\/broadcast (.+)/, (msg, match) => {
    if (msg.chat.id != ADMIN_ID) return;

    const message = match[1];

    users.forEach(userId => {
        bot.sendMessage(userId, `📢 ${message}`);
    });

    bot.sendMessage(msg.chat.id, "✅ تم الإرسال");
});