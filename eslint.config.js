import tseslint from 'typescript-eslint'

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    ignores: ['src/sw.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/sw.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.sw.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  { ignores: ['dist/**'] }
)
