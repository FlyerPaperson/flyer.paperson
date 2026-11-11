/* ============================================================
   Кафе «Тёплый угол» - скрипты
   ============================================================ */

/* ============ БУРГЕР-МЕНЮ ============ */
const burger = document.getElementById('burger');
const mobileNav = document.getElementById('mobileNav');

burger.addEventListener('click', () => {
  burger.classList.toggle('open');
  mobileNav.classList.toggle('open');
});
mobileNav.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    burger.classList.remove('open');
    mobileNav.classList.remove('open');
  });
});

/* ============ МОДАЛКА ============ */
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');

function openModal() {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('mName').focus(), 200);
}
function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}
document.querySelectorAll('[data-open-modal]').forEach(btn =>
  btn.addEventListener('click', openModal)
);
modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ============================================================
   ПИКЕРЫ ДАТЫ/ВРЕМЕНИ
   ============================================================ */
function closeAllPickers(except) {
  document.querySelectorAll('.picker.open').forEach(p => {
    if (p !== except) p.classList.remove('open');
  });
}
document.addEventListener('click', e => {
  if (!e.target.closest('.picker')) closeAllPickers();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAllPickers();
});

/* ---------- КАЛЕНДАРЬ ---------- */
class DatePicker {
  constructor(root) {
    this.root = root;
    this.trigger = root.querySelector('.picker-trigger');
    this.text = root.querySelector('.picker-text');
    this.input = root.querySelector('input[type="hidden"]');
    this.popup = root.querySelector('.picker-popup');
    this.title = root.querySelector('.calendar-title');
    this.daysGrid = root.querySelector('.calendar-days');
    this.selectedDate = null;
    this.viewDate = new Date();
    this.viewDate.setDate(1);
    this.minDate = new Date();
    this.minDate.setHours(0, 0, 0, 0);
    this._bind();
  }
  _bind() {
    this.trigger.addEventListener('click', e => {
      e.stopPropagation();
      this.toggle();
    });
    this.popup.querySelectorAll('.calendar-nav').forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.nav === 'prev' ? -1 : 1;
        this.viewDate.setMonth(this.viewDate.getMonth() + dir);
        this._render();
      });
    });
  }
  toggle() { this.root.classList.contains('open') ? this.close() : this.open(); }
  open() { closeAllPickers(this.root); this.root.classList.add('open'); this._render(); }
  close() { this.root.classList.remove('open'); }
  _format(d) {
    const days = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  }
  _dateKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  _isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }
  _render() {
    const y = this.viewDate.getFullYear();
    const m = this.viewDate.getMonth();
    const months = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
    this.title.textContent = months[m] + ' ' + y;

    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    let html = '';
    for (let i = 0; i < startOffset; i++) html += '<span></span>';
    const today = new Date();

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(y, m, d);
      const isPast = date < this.minDate;
      const isToday = this._isSameDay(date, today);
      const isSelected = this.selectedDate && this._isSameDay(date, this.selectedDate);
      let cls = 'calendar-day';
      if (isPast) cls += ' disabled';
      if (isToday) cls += ' today';
      if (isSelected) cls += ' selected';
      html += `<button type="button" class="${cls}" data-date="${this._dateKey(y, m, d)}" ${isPast ? 'disabled' : ''}>${d}</button>`;
    }

    this.daysGrid.innerHTML = html;

    this.daysGrid.querySelectorAll('.calendar-day:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const dateStr = btn.dataset.date;
        this.selectedDate = new Date(dateStr + 'T00:00:00');
        this.input.value = dateStr;
        this.text.textContent = this._format(this.selectedDate);
        this.close();
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }
}

/* ---------- ВРЕМЯ ---------- */
class TimePicker {
  constructor(root) {
    this.root = root;
    this.trigger = root.querySelector('.picker-trigger');
    this.text = root.querySelector('.picker-text');
    this.input = root.querySelector('input[type="hidden"]');
    this.list = root.querySelector('.time-list');
    this.selectedTime = null;
    this._bind();
  }
  _bind() {
    this.trigger.addEventListener('click', e => {
      e.stopPropagation();
      this.toggle();
    });
  }
  toggle() { this.root.classList.contains('open') ? this.close() : this.open(); }
  open() { closeAllPickers(this.root); this._render(); this.root.classList.add('open'); this._scrollToSelected(); }
  close() { this.root.classList.remove('open'); }

  /* Минимально допустимое время - только для «сегодня» */
  _getMinTime() {
    const form = this.root.closest('form');
    if (!form) return null;
    const dateInput = form.querySelector('input[name="date"]');
    if (!dateInput || !dateInput.value) return null;
    const selected = new Date(dateInput.value + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected.getTime() === today.getTime()) {
      return new Date(Date.now() + 30 * 60 * 1000);
    }
    return null;
  }

  _render() {
    const minTime = this._getMinTime();
    const slots = [];
    for (let h = 9; h <= 22; h++) {
      slots.push(String(h).padStart(2, '0') + ':00');
      slots.push(String(h).padStart(2, '0') + ':30');
    }

    let html = '';
    slots.forEach(slot => {
      const [hh, mm] = slot.split(':').map(Number);
      let disabled = false;
      if (minTime) {
        const slotTime = new Date();
        slotTime.setHours(hh, mm, 0, 0);
        if (slotTime < minTime) disabled = true;
      }
      const isSelected = slot === this.selectedTime;
      let cls = 'time-slot';
      if (disabled) cls += ' disabled';
      if (isSelected) cls += ' selected';
      html += `<button type="button" class="${cls}" data-time="${slot}" ${disabled ? 'disabled' : ''}>${slot}</button>`;
    });

    this.list.innerHTML = html;

    this.list.querySelectorAll('.time-slot:not(.disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedTime = btn.dataset.time;
        this.input.value = this.selectedTime;
        this.text.textContent = this.selectedTime;
        this.close();
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }
  _scrollToSelected() {
    const sel = this.list.querySelector('.selected');
    if (sel) setTimeout(() => sel.scrollIntoView({ block: 'center' }), 50);
  }
}

/* ---------- ИНИЦИАЛИЗАЦИЯ ВСЕХ ПИКЕРОВ ---------- */
const datePickers = [];
const timePickers = [];
document.querySelectorAll('[data-picker="date"]').forEach(el => datePickers.push(new DatePicker(el)));
document.querySelectorAll('[data-picker="time"]').forEach(el => timePickers.push(new TimePicker(el)));

/* При смене даты - если выбранное время стало невалидным, то сбрасывается */
document.querySelectorAll('form').forEach(form => {
  const dateInput = form.querySelector('input[name="date"]');
  const timeInput = form.querySelector('input[name="time"]');
  if (!dateInput || !timeInput) return;
  dateInput.addEventListener('change', () => {
    if (!timeInput.value) return;
    const res = validateDateTime(dateInput.value, timeInput.value);
    if (!res.ok) {
      timeInput.value = '';
      const picker = timeInput.closest('.picker');
      if (picker) {
        picker.querySelector('.picker-text').textContent = '';
        // сбрасывает выделение в объекте пикера
        timePickers.forEach(tp => {
          if (tp.input === timeInput) tp.selectedTime = null;
        });
      }
      setError(timeInput, '');
    }
  });
});

/* ============ ВАЛИДАЦИЯ ============ */
function setError(field, msg) {
  const wrap = field.closest('.field');
  if (!wrap) return;
  const err = wrap.querySelector('.field-err');
  if (msg) {
    wrap.classList.add('error');
    if (err) err.textContent = msg;
  } else {
    wrap.classList.remove('error');
    if (err) err.textContent = '';
  }
}

function validatePhone(value) {
  return value.replace(/\D/g, '').length >= 11;
}

function validateDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return { ok: false, msg: 'Выберите дату и время' };
  const selected = new Date(dateStr + 'T' + timeStr + ':00');
  const minTime = new Date(Date.now() + 30 * 60 * 1000);
  if (selected < minTime) {
    return { ok: false, msg: 'Время должно быть не раньше, чем через 30 минут' };
  }
  return { ok: true };
}

function validate(form) {
  let ok = true;

  form.querySelectorAll('[required]').forEach(el => {
    if (el.type === 'checkbox') {
      if (!el.checked) ok = false;
      return;
    }
    const v = el.value.trim();
    if (!v) {
      setError(el, 'Заполните поле');
      ok = false;
      return;
    }
    if (el.type === 'tel' && !validatePhone(v)) {
      setError(el, 'Введите номер из не менее 11 цифр');
      ok = false;
      return;
    }
    setError(el, '');
  });

  const dateInput = form.querySelector('input[name="date"]');
  const timeInput = form.querySelector('input[name="time"]');
  if (dateInput && timeInput && dateInput.value && timeInput.value) {
    const res = validateDateTime(dateInput.value, timeInput.value);
    if (!res.ok) {
      setError(dateInput, res.msg);
      ok = false;
    } else {
      setError(dateInput, '');
    }
  }

  return ok;
}

/* ============ ОТПРАВКА ФОРМ ============ */
function handleSubmit(form, successEl) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate(form)) return;

    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Отправляем…';

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = original;
      successEl.classList.add('show');
      form.reset();

      // очистка визуала пикеров после reset
      form.querySelectorAll('.picker-text').forEach(el => el.textContent = '');
      datePickers.forEach(dp => { if (form.contains(dp.root)) dp.selectedDate = null; });
      timePickers.forEach(tp => { if (form.contains(tp.root)) tp.selectedTime = null; });

      setTimeout(() => successEl.classList.remove('show'), 6000);
    }, 900);
  });
}

handleSubmit(document.getElementById('bookingForm'), document.getElementById('bookingSuccess'));
handleSubmit(document.getElementById('modalForm'), document.getElementById('modalSuccess'));

/* ============ АКТИВНАЯ ССЫЛКА В ШАПКЕ ============ */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 120) current = s.id;
  });
  navLinks.forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + current ? 'var(--accent)' : '';
  });
}, { passive: true });

/* ============================================================
   ФИЛЬТРЫ МЕНЮ + КНОПКА «ЕЩЁ / СКРЫТЬ»
   ============================================================ */
(function initMenuFilters() {
  const filtersWrap = document.getElementById('menuFilters');
  const dishes = Array.from(document.querySelectorAll('.dish'));
  const emptyState = document.getElementById('emptyState');
  const moreWrap = document.getElementById('menuMoreWrap');
  const moreBtn = document.getElementById('menuMoreBtn');
  const moreText = document.getElementById('menuMoreText');
  const moreCount = document.getElementById('menuMoreCount');

  if (!filtersWrap || !dishes.length) return;

  const COLLAPSED_LIMIT = 3;
  let currentFilter = 'all';
  let expanded = false;

  /* Подсчёт блюд в категориях */
  const counts = { all: dishes.length };
  dishes.forEach(d => {
    const cat = d.dataset.category;
    counts[cat] = (counts[cat] || 0) + 1;
  });
  filtersWrap.querySelectorAll('.filter-count').forEach(badge => {
    const key = badge.dataset.count;
    badge.textContent = counts[key] ?? 0;
  });

  function applyFilter(category, resetExpanded = true) {
    if (resetExpanded) expanded = false;
    currentFilter = category;

    const matching = dishes.filter(d =>
      category === 'all' || d.dataset.category === category
    );

    dishes.forEach(d => {
      d.style.animation = 'none';
      void d.offsetWidth;
      d.style.animation = '';
    });
    dishes.forEach(d => d.classList.add('hide'));

    const limit = expanded ? matching.length : COLLAPSED_LIMIT;
    matching.slice(0, limit).forEach(d => d.classList.remove('hide'));

    const total = matching.length;

    /* Показывает кнопку только если в категории больше 3 блюд */
    if (total <= COLLAPSED_LIMIT) {
      moreWrap.hidden = true;
      moreText.textContent = 'Ещё';
      moreCount.textContent = '';
    } else {
      moreWrap.hidden = false;
      if (expanded) {
        moreText.textContent = 'Скрыть';
        moreCount.textContent = '';
      } else {
        moreText.textContent = 'Ещё';
        moreCount.textContent = '+' + (total - COLLAPSED_LIMIT);
      }
    }

    emptyState.hidden = total > 0;
  }

  filtersWrap.querySelectorAll('.filter').forEach(btn => {
    btn.addEventListener('click', () => {
      filtersWrap.querySelectorAll('.filter').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      applyFilter(btn.dataset.filter, true);
    });
  });

  moreBtn.addEventListener('click', () => {
    expanded = !expanded;
    applyFilter(currentFilter, false);
  });

  applyFilter('all', true);
})();