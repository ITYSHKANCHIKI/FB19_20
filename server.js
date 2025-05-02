import express from 'express';
import webpush from 'web-push';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import 'dotenv/config';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  publicVapidKey,
  privateVapidKey
);

// Очищаем подписки при запуске
let subscriptions = [];
console.log("📭 Подписки очищены при запуске сервера");

app.post('/subscribe', (req, res) => {
  const sub = req.body;
  if (!subscriptions.find(s => s.endpoint === sub.endpoint)) {
    subscriptions.push(sub);
    console.log('✅ Подписка добавлена:', sub.endpoint);
  }
  res.status(201).json({});
});

app.post("/send", async (req, res) => {
  const payload = JSON.stringify({
    title: "Напоминание",
    body: "У вас есть незавершённые задачи",
  });

  setTimeout(async () => {
    const validSubscriptions = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(sub, payload);
        validSubscriptions.push(sub); // подписка рабочая
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.warn('❌ Удалена неактивная подписка:', sub.endpoint);
        } else {
          console.error('⚠️ Ошибка при отправке:', err);
          validSubscriptions.push(sub); // оставляем, если ошибка не связана с удалением
        }
      }
    }

    subscriptions = validSubscriptions;
    res.status(200).json({ message: "Уведомления отправлены" });
  }, 5000);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

// Периодическая отправка уведомлений (каждую минуту)
setInterval(async () => {
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: 'Напоминание',
    body: 'У вас есть незавершённые задачи (напоминание каждые 2 минуты)',
  });

  const validSubscriptions = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      validSubscriptions.push(sub);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.warn('❌ Удалена неактивная подписка:', sub.endpoint);
      } else {
        console.error('⚠️ Ошибка при отправке:', err);
        validSubscriptions.push(sub);
      }
    }
  }

  subscriptions = validSubscriptions;
}, 2 * 60 * 1000); // каждые 2 минуты
