import { create } from 'zustand';
import { storage } from '@/lib/utils';

const useTestStore = create((set, get) => ({
  activeTest:     null,
  answers:        {},        // { [questionId]: selectedAnswer }
  codingAnswers:  {},        // { [questionId]: { code, language } }
  timeRemaining:  null,
  tabSwitchCount: 0,
  testStatus:     'idle',   // idle | active | submitted | expired

  setActiveTest: (test) =>
    set({ activeTest: test, testStatus: 'active', timeRemaining: null }),

  setAnswer: (questionId, answer) => {
    const answers = { ...get().answers, [questionId]: answer };
    set({ answers });
    storage.set(`test-answers-${get().activeTest?._id}`, answers);
  },

  setCodingAnswer: (questionId, code, language) => {
    const codingAnswers = { ...get().codingAnswers, [questionId]: { code, language } };
    set({ codingAnswers });
    storage.set(`test-coding-${get().activeTest?._id}`, codingAnswers);
  },

  incrementTabSwitch: () => {
    const count = get().tabSwitchCount + 1;
    set({ tabSwitchCount: count });
  },

  setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),

  loadSavedAnswers: (testId) => {
    const answers       = storage.get(`test-answers-${testId}`) || {};
    const codingAnswers = storage.get(`test-coding-${testId}`) || {};
    set({ answers, codingAnswers });
  },

  clearTest: () => {
    const testId = get().activeTest?._id;
    if (testId) {
      storage.remove(`test-answers-${testId}`);
      storage.remove(`test-coding-${testId}`);
    }
    set({
      activeTest:     null,
      answers:        {},
      codingAnswers:  {},
      timeRemaining:  null,
      tabSwitchCount: 0,
      testStatus:     'idle',
    });
  },
}));

export default useTestStore;
