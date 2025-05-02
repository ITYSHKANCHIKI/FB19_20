function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

import React, { useState, useEffect } from "react";
import Shell from "./Shell";

const App = () => {
  const [note, setNote] = useState("");              // Текущая заметка
  const [notes, setNotes] = useState([]);            // Все заметки
  const [isLoading, setIsLoading] = useState(true);  // Состояние загрузки
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async () => {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Уведомления отклонены пользователем");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      console.log("Уже есть подписка:", existing);
      setIsSubscribed(true);
      return;
    }
    const publicKey = await getPublicKey();
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      console.log("Новая подписка оформлена:", subscription);
      setIsSubscribed(true);
      const response = await fetch("http://localhost:4000/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });
      if (response.ok) {
        console.log("Подписка успешно отправлена на сервер");
      } else {
        console.error("Ошибка при отправке подписки на сервер");
      }
    } catch (error) {
      console.error("Ошибка при оформлении подписки:", error);
    }
  };


  const unsubscribe = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
    await subscription.unsubscribe();
    console.log('Подписка удалена');
    setIsSubscribed(false);
    } else {
    console.log('Нет активной подписки для удаления');
    }
  };

  const getPublicKey = async () => {
    const res = await fetch('/vapid-key.json');
    const data = await res.json();
    return data.publicKey;
  };

  // Эмуляция загрузки заметок с задержкой
  useEffect(() => {
    setTimeout(() => {
      const saved = localStorage.getItem("notes");
      setNotes(saved ? JSON.parse(saved) : []);
      setIsLoading(false); // Готово — можно отображать
    }, 500);
  }, []);

  // Сохраняем заметки в localStorage при каждом изменении
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("notes", JSON.stringify(notes));
      console.log("Заметки сохранены:", notes);
    }
  }, [notes, isLoading]);

  const addNote = () => {
    if (note.trim() === "") return;
    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    setNote("");
    // Уведомление при добавлении
    if (isSubscribed && Notification.permission === "granted") {
      new Notification("Задача добавлена", {
        body: `"${note}" успешно добавлена в список задач.`,
      });
    }
   };

  const deleteNote = (index) => {
    const updated = notes.filter((_, i) => i !== index);
    setNotes(updated);
  };

  // Пока данные загружаются — показываем спиннер
  if (isLoading) {
    return (
      <Shell>
        <div className="loader"></div>
        <p style={{ textAlign: 'center' }}>Загрузка заметок...</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <input
        type="text"
        className="note-input"
        placeholder="Введите заметку"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button className="add-button" onClick={addNote}>
        Добавить
      </button>

      <ul className="notes-list">
        {notes.map((n, index) => (
          <li key={index} className="note-item">
            {n}
            <button className="delete-button" onClick={() => deleteNote(index)}>
              Удалить
            </button>
          </li>
        ))}
      </ul>
      <button onClick={handleSubscribe} className="notify-button">
        {isSubscribed ? "Уведомления включены" : "Включить уведомления"}
      </button>
      {isSubscribed && (
        <button
          onClick={unsubscribe}
          className="notify-button"
          style={{ marginTop: "10px" }}
        >
          Сбросить подписку
        </button>
      )}
      {isSubscribed && (
        <button
          onClick={async () => {
            const res = await fetch("http://localhost:4000/send", {
              method: "POST",
            });
            if (res.ok) {
              console.log("Уведомление отправлено");
            } else {
              console.error("Ошибка при отправке уведомления");
            }
          }}
          className="notify-button"
          style={{ marginTop: "10px" }}
        >
          Проверить уведомление
        </button>
      )}
    </Shell>
  );
};

export default App;
