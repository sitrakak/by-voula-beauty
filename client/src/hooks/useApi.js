import { useCallback } from 'react';

export function useApi() {
  const request = useCallback(async (url, options = {}) => {
    const { body, headers, ...rest } = options;

    const fetchOptions = {
      credentials: 'include',
      ...rest
    };

    if (body instanceof FormData) {
      fetchOptions.body = body;
      fetchOptions.headers = headers;
    } else if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
      fetchOptions.headers = {
        'Content-Type': 'application/json',
        ...headers
      };
    } else if (headers) {
      fetchOptions.headers = headers;
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody.message || 'Une erreur est survenue';
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }, []);

  return { request };
}
