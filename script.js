'use strict';

/* ================== Настройки ================== */

const STEP = 10;                    // на сколько % растёт прогресс за один клик
const HABITS_KEY = 'ecoHabits';     // ключ в localStorage для привычек
const THEME_KEY = 'theme';          // ключ в localStorage для темы

// Привычки, которые показываются при первом заходе на сайт
const DEFAULT_HABITS = [
    'Использовать многоразовые бутылки',
    'Сортировать мусор',
    'Экономить воду'
];

/* ================== Вспомогательные функции ================== */

// Выводит сообщение под кнопками. Ошибки дополнительно пишутся в консоль.
function showMessage(text, isError = true) {
    if (isError) {
        console.error(text);
    }

    const status = document.getElementById('status');
    if (!status) {
        return;
    }

    status.textContent = text;
    status.classList.toggle('status--error', isError);
}

// Ищет контейнер для карточек. Если его нет — сообщает об ошибке и возвращает null.
function getContainer() {
    const container = document.getElementById('habits-container');

    if (!container) {
        showMessage('Ошибка! Контейнер #habits-container не найден на странице.');
        return null;
    }
    return container;
}

// Безопасно вешает обработчик клика: сначала проверяет, что элемент существует.
function bindClick(selector, handler) {
    const element = document.querySelector(selector);

    if (!element) {
        console.error(`Элемент ${selector} не найден, обработчик не назначен.`);
        return;
    }
    element.addEventListener('click', handler);
}

/* ================== localStorage: привычки ================== */

// Собирает данные со всех карточек и сохраняет их в localStorage.
function saveHabits() {
    const container = document.getElementById('habits-container');
    if (!container) {
        return;
    }

    const habits = Array.from(container.querySelectorAll('.habit-card')).map((card) => ({
        title: card.querySelector('.habit-card__title').textContent,
        progress: Number(card.dataset.progress) || 0
    }));

    try {
        localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    } catch (error) {
        console.error('Не удалось сохранить привычки:', error);
    }
}

// Читает привычки из localStorage.
// Возвращает массив {title, progress} или null, если сохранённых данных нет.
function loadHabits() {
    try {
        const raw = localStorage.getItem(HABITS_KEY);
        if (raw === null) {
            return null;
        }

        const data = JSON.parse(raw);
        if (!Array.isArray(data)) {
            return null;
        }

        // Отбрасываем всё, что не похоже на привычку (защита от «битых» данных)
        return data
            .filter((item) => item && typeof item.title === 'string' && item.title.trim() !== '')
            .map((item) => ({
                title: item.title,
                progress: Number(item.progress) || 0
            }));
    } catch (error) {
        console.error('Не удалось прочитать привычки:', error);
        return null;
    }
}

/* ================== Прогресс и карточки ================== */

// Обновляет полосу, проценты и кнопку карточки.
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

// Клик по «Отметить»: +STEP % и сохранение.
function markHabit(card) {
    const current = Number(card.dataset.progress) || 0;
    setProgress(card, current + STEP);
    saveHabits();
}

// Клик по «Удалить»: убирает карточку из DOM и обновляет localStorage.
function removeHabit(card) {
    const titleElement = card.querySelector('.habit-card__title');
    const title = titleElement ? titleElement.textContent : 'Привычка';

    card.remove();
    updateEmptyState();
    saveHabits();
    showMessage(`Привычка «${title}» удалена.`, false);
}

// Если карточек нет — показывает подсказку, если есть — убирает её.
function updateEmptyState() {
    const container = getContainer();
    if (!container) {
        return;
    }

    const cardsCount = container.querySelectorAll('.habit-card').length;
    const hint = container.querySelector('.habits-empty');

    if (cardsCount === 0 && !hint) {
        const message = document.createElement('p');
        message.className = 'habits-empty';
        message.textContent = 'Привычек пока нет. Добавьте первую!';
        container.appendChild(message);
    } else if (cardsCount > 0 && hint) {
        hint.remove();
    }
}

// Создаёт карточку привычки через createElement.
function createHabitCard(title, progress = 0) {
    const card = document.createElement('article');
    card.className = 'habit-card';
    card.dataset.progress = '0';

    // Шапка карточки: название + кнопка удаления
    const head = document.createElement('div');
    head.className = 'habit-card__head';

    const name = document.createElement('h3');
    name.className = 'habit-card__title';
    name.textContent = title;

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'habit-card__delete';
    removeButton.textContent = 'Удалить';
    removeButton.setAttribute('aria-label', `Удалить привычку «${title}»`);
    removeButton.addEventListener('click', () => removeHabit(card));

    head.appendChild(name);
    head.appendChild(removeButton);

    // Прогресс-бар: div внутри div
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

    // Кнопка «Отметить»
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'habit-card__btn';
    button.addEventListener('click', () => markHabit(card));

    card.appendChild(head);
    card.appendChild(row);
    card.appendChild(button);

    setProgress(card, progress);

    return card;
}

// Добавляет карточку в контейнер (без сохранения — его делает вызывающий код).
function addHabit(title, progress = 0) {
    const container = getContainer();
    if (!container) {
        return;
    }

    container.appendChild(createHabitCard(title, progress));
    updateEmptyState();
}

/* ================== Обработчики кнопок ================== */

function onAddHabit() {
    const input = document.getElementById('habit-input');

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
    saveHabits();

    input.value = '';
    input.focus();
    showMessage(`Привычка «${title}» добавлена.`, false);

    // Если секция была скрыта — показываем, чтобы пользователь увидел новую карточку
    const section = document.getElementById('habits-section');
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
    saveHabits();
    showMessage('Прогресс сброшен.', false);
}

function toggleHabits() {
    const section = document.getElementById('habits-section');

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

/* ================== Тема ================== */

// Включает или выключает тёмную тему и обновляет текст кнопки.
function applyTheme(isDark) {
    document.body.classList.toggle('dark', isDark);

    const button = document.getElementById('theme-toggle');
    if (button) {
        button.textContent = isDark ? 'Светлая тема' : 'Тёмная тема';
    }
}

function toggleTheme() {
    const isDark = !document.body.classList.contains('dark');
    applyTheme(isDark);

    try {
        localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch (error) {
        console.error('Не удалось сохранить тему:', error);
    }
}

function restoreTheme() {
    try {
        applyTheme(localStorage.getItem(THEME_KEY) === 'dark');
    } catch (error) {
        console.error('Не удалось прочитать тему:', error);
    }
}

/* ================== Запуск ================== */

// Показывает сохранённые привычки, а при первом заходе — привычки по умолчанию.
function restoreHabits() {
    if (!getContainer()) {
        return;
    }

    const saved = loadHabits();
    const habits = saved !== null
        ? saved
        : DEFAULT_HABITS.map((title) => ({ title, progress: 0 }));

    habits.forEach(({ title, progress }) => addHabit(title, progress));
    updateEmptyState();
}

function init() {
    try {
        bindClick('#add-habit', onAddHabit);
        bindClick('#reset-progress', resetProgress);
        bindClick('#toggle-habits', toggleHabits);
        bindClick('#theme-toggle', toggleTheme);

        const input = document.getElementById('habit-input');
        if (input) {
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    onAddHabit();
                }
            });
        }

        restoreHabits();
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
