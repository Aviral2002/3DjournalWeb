const STORAGE_KEY = 'journal_entries';

export const saveJournalEntries = (entries) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Error saving journal entries:', error);
    return false;
  }
};

export const loadJournalEntries = () => {
  try {
    const entries = localStorage.getItem(STORAGE_KEY);
    return entries ? JSON.parse(entries) : [];
  } catch (error) {
    console.error('Error loading journal entries:', error);
    return [];
  }
};
