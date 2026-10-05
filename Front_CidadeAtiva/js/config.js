
function resolveApiBaseUrl() {
  const queryApi = new URLSearchParams(window.location.search).get('api');
  if (queryApi) return queryApi.replace(/\/$/, '');

  const fallback = 'https://back-cidadeativa.onrender.com';
  return fallback;
}

window.APP_CONFIG = {
  API_BASE_URL: resolveApiBaseUrl(),
};
