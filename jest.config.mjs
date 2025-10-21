// jest.config.mjs
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Proporciona la ruta a tu aplicación Next.js para cargar next.config.js y .env en tu entorno de prueba
  dir: './',
});

// Agrega cualquier configuración personalizada de Jest que desees aquí
/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // (Crearemos este archivo a continuación)
  testEnvironment: 'jest-environment-jsdom',
  preset: 'ts-jest', // Para usar TypeScript
  moduleNameMapper: {
    // Manejar alias de ruta si los configuras en tsconfig.json (ejemplo)
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/store/(.*)$': '<rootDir>/src/store/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/types/(.*)$': '<rootDir>/src/types/$1',
    // Agrega otros alias que uses
  },
  // Ignorar transformaciones para node_modules excepto para módulos específicos si es necesario
  // transformIgnorePatterns: ['/node_modules/(?!some-es-module).+\\.js$'],
};

// createJestConfig se exporta de esta manera para asegurar que next/jest pueda cargar la configuración de Next.js
export default createJestConfig(customJestConfig);
