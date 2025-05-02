self.addEventListener('push', event => {
    const data = event.data?.json() || {};

    const title = data.title || 'Напоминание';
    const options = {
        body: data.body || 'У вас есть невыполненные задачи!',
        icon: '/icons/icon-192.png', // путь к иконке для уведомлений
        badge: '/icons/icon-192.png', // опционально: иконка в панели уведомлений
        vibrate: [100, 50, 100], // вибрация для поддержки мобильных
        data: {
            url: data.url || '/' // при клике на уведомление
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
