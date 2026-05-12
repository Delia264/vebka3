// Функция импорта из Excel
function importFromExcel(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Преобразовать в JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Проверить, есть ли столбец "класс" в Excel файле
        const hasClassColumn = jsonData.length > 0 && jsonData[0]['класс'] !== undefined;
        
        if (!hasClassColumn) {
            alert('В Excel файле отсутствует столбец "класс". Добавьте столбец "класс" для каждого урока.');
            return;
        }
        
        // Группировка данных по классам
        const groupedByClass = {};
        
        jsonData.forEach(row => {
            const classValue = row['класс'] ? row['класс'].toString().toLowerCase() : 'без_класса';
            // Нормализуем формат класса (например: "1а", "1/а", "1-а" -> "1а")
            const normalizedClass = classValue.replace(/[\/\-]/g, '');
            
            if (!groupedByClass[normalizedClass]) {
                groupedByClass[normalizedClass] = [];
            }
            
            groupedByClass[normalizedClass].push(row);
        });
        
        // Сохранить все расписания по классам
        for (const className in groupedByClass) {
            saveScheduleToLocalStorage(className, groupedByClass[className]);
        }
        
        alert(`Все расписания были успешно импортированы и сохранены для ${Object.keys(groupedByClass).length} классов!`);

        // Скрыть приветственное сообщение после импорта
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }

        // Обновить расписание для текущего выбранного класса
        if (typeof refreshCurrentSchedule === 'function') {
            refreshCurrentSchedule();
        }
    };

    reader.readAsArrayBuffer(file);
}

// Функция сохранения расписания в localStorage
function saveScheduleToLocalStorage(className, scheduleData) {
    // Сохраняем данные в формате {className: scheduleData}
    const storedSchedules = JSON.parse(localStorage.getItem('storedSchedules') || '{}');
    storedSchedules[className] = scheduleData;
    localStorage.setItem('storedSchedules', JSON.stringify(storedSchedules));
}

// Функция загрузки расписания из localStorage
function loadScheduleFromLocalStorage(className) {
    const storedSchedules = JSON.parse(localStorage.getItem('storedSchedules') || '{}');
    return storedSchedules[className] || null;
}

// Функция очистки всех списков уроков
function clearAllLessonLists() {
    const lessonLists = document.querySelectorAll('.lesson-list');
    lessonLists.forEach(list => {
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }
    });
}

// Функция очистки всех дней
function clearAllDays() {
    const scheduleContainer = document.getElementById('scheduleContainer');
    while (scheduleContainer.firstChild) {
        scheduleContainer.removeChild(scheduleContainer.firstChild);
    }
}

// Функция добавления дней и уроков из Excel
function addDaysAndLessonsFromExcel(data) {
    // Группировка данных по дням недели
    const groupedData = {};
    
    data.forEach(row => {
        const day = row['день'] || 'Неизвестный день';
        const date = row['дата'] || '-';
        
        if (!groupedData[day]) {
            groupedData[day] = {
                date: date,
                lessons: []
            };
        }
        
        // Форматирование строки времени
        const timeFormatted = row['время'] ? row['время'].toString().replace(/\./g, '<br>') : '-';
        
        groupedData[day].lessons.push({
            time: timeFormatted,
            subject: row['предмет'] || '-', // исправлено название столбца
            teacher: row['препод'] || '-',
            room: row['кабинет'] || '-'
        });
    });
    
    // Добавление дней и уроков
    Object.keys(groupedData).forEach(day => {
        // Создание элемента дня
        const dayElement = document.createElement('div');
        dayElement.className = 'schedule-day';
        
        // Создание заголовка дня
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        
        const dayName = document.createElement('div');
        dayName.className = 'day-name';
        dayName.textContent = day;
        
        const dayDate = document.createElement('div');
        dayDate.className = 'day-date';
        dayDate.textContent = formatExcelDate(groupedData[day].date);
        
        dayHeader.appendChild(dayName);
        dayHeader.appendChild(dayDate);
        
        // Создание списка уроков
        const lessonList = document.createElement('div');
        lessonList.className = 'lesson-list';
        
        // Добавление уроков в список
        groupedData[day].lessons.forEach(lesson => {
            const lessonItem = document.createElement('div');
            lessonItem.className = 'lesson-item';
            
            const lessonTime = document.createElement('div');
            lessonTime.className = 'lesson-time orange';
            lessonTime.innerHTML = lesson.time;
            
            const lessonContent = document.createElement('div');
            lessonContent.className = 'lesson-content';
            
            const lessonTitle = document.createElement('div');
            lessonTitle.className = 'lesson-title';
            lessonTitle.textContent = lesson.subject;
            
            const lessonTeacher = document.createElement('div');
            lessonTeacher.className = 'lesson-meta';
            lessonTeacher.innerHTML = `<i class="fa-solid fa-user"></i><span class="lesson-teacher">преп. ${lesson.teacher}</span>`;

            const lessonRoom = document.createElement('div');
            lessonRoom.className = 'lesson-meta';
            lessonRoom.innerHTML = `<i class="fa-solid fa-location-dot"></i><span class="lesson-room">Аудитория: ${lesson.room}</span>`;

            
            lessonContent.appendChild(lessonTitle);
            lessonContent.appendChild(lessonTeacher);
            lessonContent.appendChild(lessonRoom);

            
            lessonItem.appendChild(lessonTime);
            lessonItem.appendChild(lessonContent);
            
            lessonList.appendChild(lessonItem);
        });
        
        dayElement.appendChild(dayHeader);
        dayElement.appendChild(lessonList);
        
        document.getElementById('scheduleContainer').appendChild(dayElement);
    });
}

// Функция форматирования даты из Excel
function formatExcelDate(excelDate) {
    // Проверка, является ли дата числом (Excel формат даты)
    if (typeof excelDate === 'number') {
        // Конвертация Excel даты в JavaScript дату
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date.toLocaleDateString('ru-RU');
    }
    
    // Если строка, пытаемся преобразовать
    if (typeof excelDate === 'string') {
        // Пытаемся распознать различные форматы даты
        let date = null;
        
        // Проверяем формат dd.mm.yyyy
        if (excelDate.includes('.')) {
            const parts = excelDate.split('.');
            if (parts.length === 3) {
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        }
        // Проверяем формат mm/dd/yy
        else if (excelDate.includes('/')) {
            const parts = excelDate.split('/');
            if (parts.length === 3) {
                // Если год в формате yy, преобразуем в yyyy
                let year = parseInt(parts[2]);
                if (year < 100) {
                    year += 2000;
                }
                date = new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
            }
        }
        
        if (date && !isNaN(date.getTime())) {
            return date.toLocaleDateString('ru-RU');
        }
    }
    
    // Если не удалось распознать, возвращаем как есть
    return excelDate;
}