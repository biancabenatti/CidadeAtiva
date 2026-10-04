
function resolveApiBaseUrl() {
  const queryApi = new URLSearchParams(window.location.search).get('api');
  if (queryApi) return queryApi.replace(/\/$/, '');

  const fallback = 'http://127.0.0.1:5000';
  return fallback;
}

window.APP_CONFIG = {
  API_BASE_URL: resolveApiBaseUrl(),
};
