export function normalizeApiError(error, fallbackMessage) {
  if (error.response) {
    return {
      userMessage: error.response.data?.error || fallbackMessage,
      retryable: error.response.status >= 500,
      details: error.response.data || null,
    };
  }

  if (error.request) {
    return {
      userMessage: 'Network issue detected. Please check your connection and try again.',
      retryable: true,
      details: null,
    };
  }

  return {
    userMessage: fallbackMessage,
    retryable: false,
    details: null,
  };
}
