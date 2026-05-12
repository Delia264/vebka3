// Глобальное состояние режима редактирования
let editMode = false;
let originalScheduleData = null;

// Включение режима редактирования
function enableEditMode() {
    editMode = true;
    
    // Сохраняем оригинальные данные для отмены
    const currentClass = localStorage.getItem('selectedClass');
    if (currentClass) {
        const normalizedClass = currentClass.toLowerCase().replace(/[\/\-]/g, '');
        originalScheduleData = loadScheduleFromLocalStorage(normalizedClass);
    }
    
    // Делаем все элементы редактируемыми
    makeElementsEditable();
    
    // Показываем кнопки управления
    showEditControls();
    
    // Добавляем кнопки действий для дней и уроков
    addEditActionButtons();
}

// Отключение режима редактирования
function disableEditMode() {
    editMode = false;
    
    // Делаем элементы не редактируемыми
    makeElementsNonEditable();
    
    // Скрываем кнопки управления
    hideEditControls();
    
    // Удаляем кнопки действий
    removeEditActionButtons();
    
    originalScheduleData = null;
}

// Делаем элементы редактируемыми
function makeElementsEditable() {
    // Дни недели
    document.querySelectorAll('.day-name').forEach(el => {
        el.contentEditable = true;
        el.classList.add('editable');
    });

    // Даты
    document.querySelectorAll('.day-date').forEach(el => {
        el.contentEditable = true;
        el.classList.add('editable');
    });

    // Время уроков
    document.querySelectorAll('.lesson-time').forEach(el => {
        el.contentEditable = true;
        el.classList.add('editable');
    });

    // Предметы
    document.querySelectorAll('.lesson-title').forEach(el => {
        el.contentEditable = true;
        el.classList.add('editable');
    });

    // Преподаватели (внутри span.lesson-teacher)
    document.querySelectorAll('.lesson-teacher').forEach(el => {
        el.contentEditable = true;
        el.classList.add('editable');
    });

    // Кабинеты (внутри span.lesson-room)
    document.querySelectorAll('.lesson-room').forEach(el => {
        el.contentEditable = true;
        el.classList.add('editable');
    });
}

// Делаем элементы не редактируемыми
function makeElementsNonEditable() {
    document.querySelectorAll('.editable').forEach(el => {
        el.contentEditable = false;
        el.classList.remove('editable');
    });
}

// Показываем кнопки управления редактированием
function showEditControls() {
    let editControls = document.getElementById('editControls');
    if (!editControls) {
        editControls = document.createElement('div');
        editControls.id = 'editControls';
        editControls.className = 'edit-controls';
        
        editControls.innerHTML = `
            <button class="btn-edit-save" id="saveEditBtn">
                <i class="fa-solid fa-check"></i> Сохранить
            </button>
            <button class="btn-edit-cancel" id="cancelEditBtn">
                <i class="fa-solid fa-xmark"></i> Отмена
            </button>
            <button class="btn-edit-add-day" id="addDayBtn">
                <i class="fa-solid fa-plus"></i> Добавить день
            </button>
        `;
        
        document.querySelector('.action-buttons').after(editControls);
        
        // Добавляем обработчики
        document.getElementById('saveEditBtn').addEventListener('click', saveChanges);
        document.getElementById('cancelEditBtn').addEventListener('click', cancelChanges);
        document.getElementById('addDayBtn').addEventListener('click', addNewDay);
    }
    
    editControls.style.display = 'flex';
}

// Скрываем кнопки управления
function hideEditControls() {
    const editControls = document.getElementById('editControls');
    if (editControls) {
        editControls.style.display = 'none';
    }
}

// Добавляем кнопки действий для редактирования
function addEditActionButtons() {
    // Добавляем кнопку удаления для каждого дня
    document.querySelectorAll('.schedule-day').forEach((dayEl, dayIndex) => {
        if (!dayEl.querySelector('.delete-day-btn')) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-day-btn';
            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
            deleteBtn.title = 'Удалить день';
            deleteBtn.addEventListener('click', () => deleteDay(dayIndex));
            dayEl.querySelector('.day-header').appendChild(deleteBtn);
        }
    });
    
    // Добавляем кнопки для уроков
    document.querySelectorAll('.lesson-list').forEach((lessonList, index) => {
        if (!lessonList.querySelector('.add-lesson-btn')) {
            const addBtn = document.createElement('button');
            addBtn.className = 'add-lesson-btn';
            addBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Добавить урок';
            addBtn.addEventListener('click', () => addNewLesson(index));
            lessonList.appendChild(addBtn);
        }
        
        // Добавляем кнопки удаления для каждого урока
        lessonList.querySelectorAll('.lesson-item').forEach((lessonEl, lessonIndex) => {
            if (!lessonEl.querySelector('.delete-lesson-btn')) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-lesson-btn';
                deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                deleteBtn.title = 'Удалить урок';
                deleteBtn.addEventListener('click', () => deleteLesson(index, lessonIndex));
                lessonEl.appendChild(deleteBtn);
            }
        });
    });
}

// Удаляем кнопки действий
function removeEditActionButtons() {
    document.querySelectorAll('.delete-day-btn, .delete-lesson-btn, .add-lesson-btn').forEach(btn => {
        btn.remove();
    });
}

// Сохранение изменений
function saveChanges() {
    const currentClass = localStorage.getItem('selectedClass');
    if (!currentClass) {
        alert('Сначала выберите класс');
        return;
    }

    const normalizedClass = currentClass.toLowerCase().replace(/[\/\-]/g, '');
    const scheduleData = collectScheduleData();

    saveScheduleToLocalStorage(normalizedClass, scheduleData);

    // Отправляем уведомление об изменении расписания
    if (typeof window.notifyScheduleChange === 'function') {
        window.notifyScheduleChange(currentClass);
    }

    alert('Расписание успешно сохранено!');

    // Обновляем оригинальные данные
    originalScheduleData = scheduleData;

    // Выходим из режима редактирования
    disableEditMode();

    // Обновляем кнопку в панели администратора
    const adminEditBtn = document.getElementById('adminEditBtn');
    if (adminEditBtn) {
        adminEditBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Редактировать';
        adminEditBtn.classList.remove('active-edit');
    }
}

// Отмена изменений
function cancelChanges() {
    if (originalScheduleData) {
        const currentClass = localStorage.getItem('selectedClass');
        if (currentClass) {
            const normalizedClass = currentClass.toLowerCase().replace(/[\/\-]/g, '');
            
            // Восстанавливаем оригинальные данные
            saveScheduleToLocalStorage(normalizedClass, originalScheduleData);
            
            // Перезагружаем расписание
            clearAllDays();
            addDaysAndLessonsFromExcel(originalScheduleData);
            
            // Снова включаем режим редактирования
            makeElementsEditable();
            addEditActionButtons();
        }
    }
    
    disableEditMode();
}

// Сбор данных расписания из DOM
function collectScheduleData() {
    const scheduleData = [];
    
    document.querySelectorAll('.schedule-day').forEach(dayEl => {
        const dayName = dayEl.querySelector('.day-name').textContent.trim();
        const dayDate = dayEl.querySelector('.day-date').textContent.trim();
        
        dayEl.querySelectorAll('.lesson-item').forEach(lessonEl => {
            const lessonTime = lessonEl.querySelector('.lesson-time');
            const lessonTitle = lessonEl.querySelector('.lesson-title');
            const lessonTeacher = lessonEl.querySelector('.lesson-teacher');
            const lessonRoom = lessonEl.querySelector('.lesson-room');
            
            // Извлекаем текст, удаляя иконки и лишние пробелы
            const teacherText = lessonTeacher ? lessonTeacher.textContent.replace('преп.', '').trim() : '-';
            const roomText = lessonRoom ? lessonRoom.textContent.replace('Аудитория:', '').trim() : '-';
            
            scheduleData.push({
                'день': dayName,
                'дата': dayDate,
                'время': lessonTime ? lessonTime.innerHTML : '-',
                'предмет': lessonTitle ? lessonTitle.textContent.trim() : '-',
                'препод': teacherText,
                'кабинет': roomText,
                'класс': localStorage.getItem('selectedClass').toLowerCase().replace(/[\/\-]/g, '')
            });
        });
    });
    
    return scheduleData;
}

// Добавление нового дня
function addNewDay() {
    const daysContainer = document.getElementById('scheduleContainer');
    
    const dayElement = document.createElement('div');
    dayElement.className = 'schedule-day';
    
    dayElement.innerHTML = `
        <div class="day-header">
            <div class="day-name editable" contenteditable="true">Новый день</div>
            <div class="day-date editable" contenteditable="true">${new Date().toLocaleDateString('ru-RU')}</div>
        </div>
        <div class="lesson-list">
            <button class="add-lesson-btn"><i class="fa-solid fa-plus"></i> Добавить урок</button>
        </div>
    `;
    
    // Добавляем кнопку удаления дня
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-day-btn';
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.title = 'Удалить день';
    deleteBtn.addEventListener('click', () => {
        dayElement.remove();
    });
    dayElement.querySelector('.day-header').appendChild(deleteBtn);
    
    // Добавляем обработчик для кнопки добавления урока
    const addLessonBtn = dayElement.querySelector('.add-lesson-btn');
    addLessonBtn.addEventListener('click', () => {
        const lessonList = dayElement.querySelector('.lesson-list');
        addLessonToContainer(lessonList);
    });
    
    daysContainer.appendChild(dayElement);
    
    // Добавляем первый урок по умолчанию
    const lessonList = dayElement.querySelector('.lesson-list');
    addLessonToContainer(lessonList);
}

// Добавление урока в контейнер
function addLessonToContainer(lessonList) {
    const lessonItem = document.createElement('div');
    lessonItem.className = 'lesson-item';
    
    lessonItem.innerHTML = `
        <div class="lesson-time editable" contenteditable="true">08:30<br>09:15</div>
        <div class="lesson-content">
            <div class="lesson-title editable" contenteditable="true">Предмет</div>
            <div class="lesson-meta">
                <i class="fa-solid fa-user"></i>
                <span class="lesson-teacher editable" contenteditable="true">преп. ФИО</span>
            </div>
            <div class="lesson-meta">
                <i class="fa-solid fa-location-dot"></i>
                <span class="lesson-room editable" contenteditable="true">Аудитория: №</span>
            </div>
        </div>
    `;
    
    // Добавляем кнопку удаления урока
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-lesson-btn';
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.title = 'Удалить урок';
    deleteBtn.addEventListener('click', () => {
        lessonItem.remove();
    });
    lessonItem.appendChild(deleteBtn);
    
    // Вставляем перед кнопкой "Добавить урок"
    const addBtn = lessonList.querySelector('.add-lesson-btn');
    if (addBtn) {
        lessonList.insertBefore(lessonItem, addBtn);
    } else {
        lessonList.appendChild(lessonItem);
    }
}

// Добавление нового урока
function addNewLesson(lessonListIndex) {
    const lessonLists = document.querySelectorAll('.lesson-list');
    const lessonList = lessonLists[lessonListIndex];
    addLessonToContainer(lessonList);
}

// Удаление дня
function deleteDay(dayIndex) {
    const days = document.querySelectorAll('.schedule-day');
    if (days[dayIndex]) {
        if (confirm('Вы уверены, что хотите удалить этот день?')) {
            days[dayIndex].remove();
        }
    }
}

// Удаление урока
function deleteLesson(dayIndex, lessonIndex) {
    const days = document.querySelectorAll('.schedule-day');
    if (days[dayIndex]) {
        const lessonList = days[dayIndex].querySelector('.lesson-list');
        const lessons = lessonList.querySelectorAll('.lesson-item');
        if (lessons[lessonIndex]) {
            lessons[lessonIndex].remove();
        }
    }
}

// Экспорт функций для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        enableEditMode,
        disableEditMode,
        saveChanges,
        cancelChanges
    };
}
