export function unwrapApiResponse(response) {
  return response && typeof response === 'object' && response.data !== undefined ? response.data : response;
}
