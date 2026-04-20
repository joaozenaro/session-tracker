const localeMap: Record<string, string> = {
  en: 'en-US',
  pt: 'pt-BR',
};

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatMonthYear(date: Date, locale: string = 'en-US'): string {
  const finalLocale = localeMap[locale] || locale;
  let finalText = date.toLocaleDateString(finalLocale, {
    month: 'long',
    year: 'numeric',
  });
  finalText = finalText.charAt(0).toUpperCase() + finalText.slice(1);

  return finalText;
}

export function formatWeekRange(startOfWeek: Date, locale: string = 'en-US'): string {
  const finalLocale = localeMap[locale] || locale;
  const end = new Date(startOfWeek);
  end.setDate(end.getDate() + 6);
  const startStr = startOfWeek.toLocaleDateString(finalLocale, {
    month: 'short',
    day: 'numeric',
  });
  const endStr = end.toLocaleDateString(finalLocale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${startStr} – ${endStr}`;
}

export function formatDayFull(date: Date, locale: string = 'en-US'): string {
  const finalLocale = localeMap[locale] || locale;
  return date.toLocaleDateString(finalLocale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getCalendarGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay();
  const offset = startDow === 0 ? 6 : startDow - 1;
  const days = getDaysInMonth(year, month);
  const grid: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) grid.push(null);
  days.forEach((d) => grid.push(d));
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

export function formatTime12(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function stripHtml(html: string): string {
  const text = html.replace(/<[^>]*>/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

export function htmlSnippet(html: string, length: number): string {
  const text = stripHtml(html);
  return text.length <= length ? text : `${text.slice(0, length).trim()}…`;
}
