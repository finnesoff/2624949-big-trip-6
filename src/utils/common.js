export const escapeHTML = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
export const isEscKey = (evt) => evt.key === 'Escape' || evt.key === 'Esc';
