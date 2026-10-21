import { describe, expect, it } from 'vitest';
import { enhanceForms } from '../utils/forms.js';

describe('contribution form validation', () => {
  it('applies Bootstrap controls and exposes invalid feedback state', () => {
    document.body.innerHTML = `
      <form>
        <label for="name">Name</label>
        <input id="name" name="name" required>
        <button type="submit">Send</button>
      </form>
    `;
    const form = document.querySelector('form');
    const [input] = form.querySelectorAll('input');
    const cleanup = enhanceForms(document);

    expect(form.classList.contains('needs-validation')).toBe(true);
    expect(input.classList.contains('form-control')).toBe(true);
    expect(form.querySelector('label').classList.contains('form-label')).toBe(true);
    expect(form.querySelector('button').classList.contains('btn-danger')).toBe(true);

    input.dispatchEvent(new Event('invalid', { bubbles: false }));
    expect(form.classList.contains('was-validated')).toBe(true);

    cleanup();
    document.body.replaceChildren();
  });

  it('keeps browser-required validation active', () => {
    document.body.innerHTML = '<form><input required></form>';
    const form = document.querySelector('form');
    enhanceForms(document);
    expect(form.checkValidity()).toBe(false);
    document.body.replaceChildren();
  });
});
