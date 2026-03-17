const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const fs = require('fs');

const token = process.env.TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

const bot = new TelegramBot(token, { polling: true });

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
واختار الجودة أو MP3

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
                        { text: "🎥 جودة عالية", callback_data: `high|${text}` },
                        { text: "📱 جودة متوسطة", callback_data: `low|${text}` }
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
    const [type, url] = query.data.split("|");

    bot.sendMessage(chatId, "⏳ جاري التحميل...");

    let fileName = `file_${chatId}`;

    let command;

    if (type === "high") {
        fileName += ".mp4";
        command = `yt-dlp -f best -o ${fileName} "${url}"`;
    }

    if (type === "low") {
        fileName += ".mp4";
        command = `yt-dlp -f worst -o ${fileName} "${url}"`;
    }

    if (type === "mp3") {
        fileName += ".mp3";
        command = `yt-dlp -x --audio-format mp3 -o ${fileName} "${url}"`;
    }

    exec(command, async (error) => {
        if (error) {
            console.log(error);
            return bot.sendMessage(chatId, "❌ فشل التحميل");
        }

        try {
            if (type === "mp3") {
                await bot.sendAudio(chatId, fileName);
            } else {
                await bot.sendVideo(chatId, fileName);
            }

            bot.sendMessage(chatId,
`✅ تم التحميل بنجاح

📩 للتواصل:
@Abdalluhgomaa`);

            fs.unlinkSync(fileName);

        } catch (err) {
            console.log(err);
            bot.sendMessage(chatId, "❌ خطأ أثناء الإرسال");
        }
    });
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
