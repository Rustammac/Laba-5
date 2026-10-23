const STEP = 10;

const DEFAULT_HABITS = [
    'Использовать многоразовые бутылки',
    'Сортировать мусор',
    'Экономить воду'
];


function showMessage(text, isError = true){
    if(isError){
        console.error(text)
    }

    const status = document.querySelector('#status');
    if(!status){
        return;
    }

    status.textContent = text;
    status.classList.toggle('status-error', isError)
}

function getContainer(){
    const container = document.querySelector('#habits-container');

    if(!container){
        showMessage('Ошибка! контейнер #habits-container не найден на странице.');
        return null;
    }
    return container;
}

function bindClick(selector, handler){
    const element = document.querySelector(selector);

    if(!element){
        console.error(`Элемент ${selector} не найден, обработчик не назначен.`);
        return;
    }
    element.addEventListener('click', handler) 
}

function setProgress(card, value) {
    const progress = Math.max(0, Math.min(100, value));
 
    const fill = card.querySelector('.progress__fill');
    const percent = card.querySelector('.habit-card__percent');
    const button = card.querySelector('.habit-card__btn');
 
    if (!fill || !percent || !button) {
        console.error('В карточке не хватает элементов прогресса.', card);
        return;
    }
 
    card.dataset.progress = progress;
    fill.style.width = `${progress}%`;
    percent.textContent = `${progress}%`;
    fill.parentElement.setAttribute('aria-valuenow', progress);

    const isDone = progress >= 100;
    button.disabled = isDone;
    button.textContent = isDone ? 'Выполнено' : 'Отметить';
}

function markHabit(card) {
    const current = Number(card.dataset.progress) || 0;
    setProgress(card, current + STEP);
}

function createHabitCard(title) {
    const card = document.createElement('article');
    card.className = 'habit-card';
    card.dataset.progress = '0';

    const name = document.createElement('h3');
    name.className = 'habit-card__title';
    name.textContent = title;

    const row = document.createElement('div');
    row.className = 'habit-card__row';
 
    const track = document.createElement('div');
    track.className = 'progress';
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
 
    const fill = document.createElement('div');
    fill.className = 'progress__fill';
    track.appendChild(fill);
 
    const percent = document.createElement('span');
    percent.className = 'habit-card__percent';
 
    row.appendChild(track);
    row.appendChild(percent);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'habit-card__btn';
    button.addEventListener('click', () => markHabit(card));
 
    card.appendChild(name);
    card.appendChild(row);
    card.appendChild(button);
 
    setProgress(card, 0);
 
    return card;
}
 
/* ------------- Основная логика -------------- */

function addHabit(title) {
    const container = getContainer();
    if (!container) {
        return;
    }
 
    container.appendChild(createHabitCard(title));
}

function onAddHabit() {
    const input = document.querySelector('#habit-input');
 
    if (!input) {
        showMessage('Ошибка: поле #habit-input не найдено на странице.');
        return;
    }
 
    const title = input.value.trim();
 
    if (title === '') {
        showMessage('Введите название привычки.');
        input.focus();
        return;
    }
 
    if (!getContainer()) {
        return;
    }
 
    addHabit(title);
    input.value = '';
    input.focus();
    showMessage(`Привычка «${title}» добавлена.`, false);
 
    const section = document.querySelector('#habits-section');
    if (section && section.classList.contains('hidden')) {
        toggleHabits();
    }
}

function resetProgress() {
    const container = getContainer();
    if (!container) {
        return;
    }
 
    const cards = container.querySelectorAll('.habit-card');
 
    cards.forEach((card) => setProgress(card, 0));
    showMessage('Прогресс сброшен.', false);
}

function toggleHabits() {
    const section = document.querySelector('#habits-section');
 
    if (!section) {
        showMessage('Ошибка: секция #habits-section не найдена на странице.');
        return;
    }
 
    const isHidden = section.classList.toggle('hidden');
 
    const button = document.querySelector('#toggle-habits');
    if (button) {
        button.textContent = isHidden ? 'Показать привычки' : 'Скрыть привычки';
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
 
    const button = document.querySelector('#theme-toggle');
    if (button) {
        button.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
    }

    try {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch (error) {
        console.error('Не удалось сохранить тему:', error);
    }
}

function restoreTheme() {
    try {
        if (localStorage.getItem('theme') === 'dark') {
            toggleTheme();
        }
    } catch (error) {
        console.error('Не удалось прочитать тему:', error);
    }
}

function init() {
    try {
        bindClick('#add-habit', onAddHabit);
        bindClick('#reset-progress', resetProgress);
        bindClick('#toggle-habits', toggleHabits);
        bindClick('#theme-toggle', toggleTheme);

        const input = document.querySelector('#habit-input');
        if (input) {
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    onAddHabit();
                }
            });
        }
 
        if (getContainer()) {
            DEFAULT_HABITS.forEach(addHabit);
        }
 
        restoreTheme();
    } catch (error) {
        console.error('Ошибка при инициализации страницы:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}