// jest.config.mjs
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Proporciona la ruta a tu aplicación Next.js para cargar next.config.js y .env en tu entorno de prueba
  dir: './',
});

// Agrega cualquier configuración personalizada de Jest que desees aquí
/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^until-async$': '<rootDir>/src/test-utils/msw/untilAsync.ts',
  },
  transformIgnorePatterns: ['node_modules/(?!(msw|@mswjs/interceptors)/)'],
  // Ignorar transformaciones para node_modules excepto para módulos específicos si es necesario
  // transformIgnorePatterns: ['/node_modules/(?!some-es-module).+\\.js$'],
};

// createJestConfig se exporta de esta manera para asegurar que next/jest pueda cargar la configuración de Next.js
export default createJestConfig(customJestConfig);
