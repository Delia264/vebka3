document.addEventListener('DOMContentLoaded', function() {
    // Инициализация элементов
    const togglePassword = document.getElementById('togglePassword');
    const loginButton = document.getElementById('loginButton');
    const homeButton = document.getElementById('homeButton');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // Переключение видимости пароля
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);

        // Изменение иконки
        if (type === 'text') {
            this.classList.remove('fa-eye-slash');
            this.classList.add('fa-eye');
        } else {
            this.classList.remove('fa-eye');
            this.classList.add('fa-eye-slash');
        }
    });

    // Обработчик кнопки входа
    loginButton.addEventListener('click', login);

    // Обработчик кнопки "На главную"
    homeButton.addEventListener('click', goToMainPage);

    // Обработка нажатия Enter в форме
    document.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            login();
        }
    });

    // Функция входа
    function login() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const errorMessage = document.getElementById('error-message');

        // Скрыть предыдущее сообщение об ошибке
        errorMessage.style.display = 'none';

        // Проверка заполнения полей
        if (!username || !password) {
            showError('Пожалуйста, заполните все поля');
            return;
        }

        // Отправка запроса на сервер для проверки учетных данных
        fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Успешный вход
                alert('Успешный вход!');
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userData', JSON.stringify(data.user));

                // Перенаправление на страницу расписания
                window.location.href = '../front/raspisanie.html';
            } else {
                showError(data.error || 'Неверный логин или пароль');
            }
        })
        .catch(error => {
            console.error('Ошибка авторизации:', error);
            showError('Ошибка подключения к серверу');
        });
    }

    // Функция отображения ошибки
    function showError(message) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';

        // Скрыть сообщение через 5 секунд
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    // Функция перехода на главную страницу
    function goToMainPage() {
        window.location.href = 'Glavkom.html';
    }
});

// Функция выхода из системы
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userData');
    window.location.href = '../index.html';
}