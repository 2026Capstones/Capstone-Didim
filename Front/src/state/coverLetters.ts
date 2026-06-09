import { coverLetters } from '../mocks/career';
import type { CoverLetterDocument } from '../types/career';

const COVER_LETTERS_STORAGE_KEY = 'didim:cover-letters';

function readStoredCoverLetters(): CoverLetterDocument[] | null {
    try {
        const rawValue = window.localStorage.getItem(COVER_LETTERS_STORAGE_KEY);

        if (!rawValue) {
            return null;
        }

        return JSON.parse(rawValue) as CoverLetterDocument[];
    } catch {
        return null;
    }
}

function writeStoredCoverLetters(items: CoverLetterDocument[]) {
    window.localStorage.setItem(COVER_LETTERS_STORAGE_KEY, JSON.stringify(items));
}

export function getStoredCoverLetters() {
    return readStoredCoverLetters() || coverLetters;
}

export function getStoredCoverLetterById(id: string) {
    return getStoredCoverLetters().find((item) => item.id === id);
}

export function updateStoredCoverLetterTitle(id: string, title: string) {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
        return getStoredCoverLetterById(id);
    }

    const updatedItems = getStoredCoverLetters().map((item) => {
        if (item.id !== id) {
            return item;
        }

        return {
            ...item,
            title: trimmedTitle,
            updatedAt: '오늘 수정',
            updatedAtIso: new Date().toISOString(),
            updatedAtDaysAgo: 0,
        };
    });

    writeStoredCoverLetters(updatedItems);
    return updatedItems.find((item) => item.id === id);
}

export function updateStoredCoverLetterContent(id: string, content: string, fallbackDocument?: CoverLetterDocument) {
    let foundItem = false;
    const timestampFields = {
        updatedAt: '오늘 수정',
        updatedAtIso: new Date().toISOString(),
        updatedAtDaysAgo: 0,
    };
    const updatedItems = getStoredCoverLetters().map((item) => {
        if (item.id !== id) {
            return item;
        }

        foundItem = true;
        return {
            ...item,
            content,
            questions: [],
            ...timestampFields,
        };
    });

    if (!foundItem) {
        updatedItems.unshift({
            ...(fallbackDocument || coverLetters[0]),
            id,
            content,
            questions: [],
            title: fallbackDocument?.title || '새 자소서 초안',
            ...timestampFields,
        });
    }

    writeStoredCoverLetters(updatedItems);
    return updatedItems.find((item) => item.id === id);
}
