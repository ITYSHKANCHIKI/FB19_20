import React from 'react';
// Компонент оболочки приложения
const Shell = ({ children }) => {
 return (
   <div className="app-shell">
     {/* Шапка приложения */}
     <header className="app-header">
       <h1>Мои заметки</h1>
     </header>
     {/* Основная часть приложения */}
     <main className="app-main">{children}</main>
     {/* Подвал приложения */}
     <footer className="app-footer">
       <p>© 2025, Все права защищены</p>
     </footer>
   </div>
 );
};
export default Shell;