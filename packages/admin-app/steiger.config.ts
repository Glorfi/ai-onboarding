import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      'fsd/forbidden-imports': 'off',
      'fsd/no-cross-imports': 'error',
      'fsd/no-higher-level-imports': 'error',
    },
  },
  {
    //Disabled as non-relevant, since the app is small and some slices can indeed have only one reference.
    files: ['./src/**'],
    rules: {
      'fsd/insignificant-slice': 'off',
      'fsd/no-higher-level-imports': 'error',
    },
  },
  {
    //Disabled as we need ReduxStore types to effectively handle redux hooks.
    files: ['./src/shared/lib/redux-hooks.ts'],
    rules: {
      'fsd/no-public-api-sidestep': 'off',
      'fsd/forbidden-imports': 'off',
      'fsd/no-higher-level-imports': 'off',
    },
  },
  {
    // Allow cross-imports between widgets, for example
    files: ['src/entities/**'],
    rules: {
      'fsd/no-cross-imports': 'off',
    },
  },
  {
    //Disabled as we need some types to effectively handle websocket
    files: ['./src/shared/websocket/types.ts'],
    rules: {
      'fsd/no-public-api-sidestep': 'off',
      'fsd/forbidden-imports': 'off',
    },
  },
]);
