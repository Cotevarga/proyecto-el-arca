const controlSelector = 'input:not([type="hidden"]), textarea, select';

function enhanceForm(form) {
  form.classList.add('needs-validation');

  form.querySelectorAll(controlSelector).forEach((control) => {
    if (control.type === 'checkbox' || control.type === 'radio') {
      control.classList.add('form-check-input');
    } else {
      control.classList.add(control.tagName === 'SELECT' ? 'form-select' : 'form-control');
    }
  });

  form.querySelectorAll('label').forEach((label) => label.classList.add('form-label'));
  form.querySelectorAll('button[type="submit"], input[type="submit"]').forEach((button) => {
    button.classList.add('btn', 'btn-danger');
  });

  const markValidated = () => form.classList.add('was-validated');
  form.addEventListener('submit', markValidated);
  form.addEventListener('invalid', markValidated, true);

  return () => {
    form.removeEventListener('submit', markValidated);
    form.removeEventListener('invalid', markValidated, true);
  };
}

export function enhanceForms(root) {
  const cleanups = [...root.querySelectorAll('form')].map(enhanceForm);
  return () => cleanups.forEach((cleanup) => cleanup());
}
