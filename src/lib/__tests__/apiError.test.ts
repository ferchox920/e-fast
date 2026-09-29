import { apiErrorMessage } from '../apiError';

describe('errores HTTP del recorrido comercial', () => {
  test.each([401, 403, 404, 409, 422, 429, 503])(
    'presenta un mensaje legible para %i',
    (status) => {
      const message = apiErrorMessage({
        status,
        data: { detail: [{ msg: 'raw backend detail' }] },
      });
      expect(message).not.toContain('raw backend detail');
      expect(message.length).toBeGreaterThan(20);
    },
  );
  it('explica la indisponibilidad de red', () => {
    expect(apiErrorMessage({ status: 'FETCH_ERROR' })).toMatch(/no está disponible/);
  });
});
