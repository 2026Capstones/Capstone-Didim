const SEOUL_TIME_ZONE = 'Asia/Seoul';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getSeoulDateParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: SEOUL_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return {
        year: Number(values.year),
        month: Number(values.month),
        day: Number(values.day),
    };
}

function toDateOnlyUtc(date: { year: number; month: number; day: number }) {
    return Date.UTC(date.year, date.month - 1, date.day);
}

export function getSeoulTodayDate() {
    return getSeoulDateParts();
}

export function addDaysFromSeoulToday(days: number) {
    const today = getSeoulTodayDate();
    const nextDate = new Date(toDateOnlyUtc(today) + days * DAY_IN_MS);

    return {
        year: nextDate.getUTCFullYear(),
        month: nextDate.getUTCMonth() + 1,
        day: nextDate.getUTCDate(),
    };
}

export function getDaysFromSeoulToday(date: { year: number; month: number; day: number }) {
    return Math.round((toDateOnlyUtc(date) - toDateOnlyUtc(getSeoulTodayDate())) / DAY_IN_MS);
}

export function getSeoulDaysAgoFromIso(isoDate: string) {
    return -getDaysFromSeoulToday(getSeoulDateParts(new Date(isoDate)));
}

export function formatRelativeDateFromDaysAgo(daysAgo: number) {
    if (daysAgo <= 0) return '오늘';
    if (daysAgo === 1) return '어제';
    return `${daysAgo}일 전`;
}

export function formatRelativeDateFromIso(isoDate: string) {
    return formatRelativeDateFromDaysAgo(getSeoulDaysAgoFromIso(isoDate));
}

export function getDaysFromDdayText(deadline: string) {
    const dayValue = Number(deadline.replace(/[^0-9]/g, '')) || 0;

    return deadline.includes('D+') ? -dayValue : dayValue;
}

export function formatDdayFromDaysLeft(daysLeft: number) {
    const targetDate = addDaysFromSeoulToday(daysLeft);
    const recalculatedDaysLeft = getDaysFromSeoulToday(targetDate);

    if (recalculatedDaysLeft === 0) {
        return 'D-Day';
    }

    return recalculatedDaysLeft > 0 ? `D-${recalculatedDaysLeft}` : `D+${Math.abs(recalculatedDaysLeft)}`;
}
