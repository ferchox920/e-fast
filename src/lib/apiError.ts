export function apiErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return 'No pudimos completar la solicitud. Intenta nuevamente.';
  }
  switch (error.status) {
    case 401:
      return 'Tu sesión expiró o las credenciales no son válidas. Ingresa nuevamente.';
    case 403:
      return 'No tienes permiso para realizar esta acción.';
    case 404:
      return 'No encontramos el recurso solicitado.';
    case 409:
      return 'Los datos cambiaron mientras realizabas la operación. Actualiza e intenta nuevamente.';
    case 422:
      return 'Revisa los datos ingresados e intenta nuevamente.';
    case 429:
      return 'Hay demasiadas solicitudes. Espera un momento e intenta nuevamente.';
    case 503:
    case 'FETCH_ERROR':
    case 'TIMEOUT_ERROR':
      return 'El servicio no está disponible en este momento. Intenta más tarde.';
    default:
      return typeof error.status === 'number' && error.status >= 500
        ? 'Ocurrió un problema en el servidor. Intenta más tarde.'
        : 'No pudimos completar la solicitud. Intenta nuevamente.';
  }
}
