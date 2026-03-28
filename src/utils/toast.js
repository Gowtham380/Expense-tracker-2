/**
 * showToast — lightweight, dependency-free toast via CustomEvent.
 * Works from anywhere: context, component, or plain JS utility.
 *
 * @param {string} message  - Text to display
 * @param {'success'|'error'|'warning'|'info'} type - Visual style
 * @param {number} duration - Auto-dismiss delay in ms (default 3500)
 */
export function showToast(message, type = 'info', duration = 3500) {
  window.dispatchEvent(
    new CustomEvent('show-toast', {
      detail: { message, type, duration, id: Date.now() },
    })
  );
}
