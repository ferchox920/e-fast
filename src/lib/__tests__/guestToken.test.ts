import { getOrCreateGuestToken, retireGuestToken } from '../guestToken';

test('un carrito convertido retira su token y la siguiente compra obtiene otro', () => {
  localStorage.clear();
  const token = getOrCreateGuestToken();
  expect(token).toBeTruthy();
  expect(getOrCreateGuestToken()).toBe(token);
  retireGuestToken();
  expect(getOrCreateGuestToken()).not.toBe(token);
  localStorage.clear();
});
