/**
 * Jest setup — native module mocks for unit tests.
 */

/* eslint-env jest */

import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => {
    const store = new Map();
    return {
      getString: (key) => store.get(key),
      getBoolean: (key) => store.get(key),
      getNumber: (key) => store.get(key),
      set: (key, value) => {
        store.set(key, value);
      },
      remove: (key) => {
        store.delete(key);
      },
      contains: (key) => store.has(key),
      clearAll: () => {
        store.clear();
      },
    };
  },
}));

jest.mock('react-native-nitro-modules', () => ({}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    hide: jest.fn(),
  },
}));
