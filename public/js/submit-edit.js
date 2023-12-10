function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

const courseId = document.getElementById('courseId').value;
// Select all input elements and textareas in the form
document.querySelectorAll('form input, form textarea, form input[type="file"]')
  .forEach(input => {
    // Store the initial value of the input
    input.dataset.initialValue = input.value;

    input.addEventListener('input', debounce(function () {
      // Check if the input value has changed
      if (this.value !== this.dataset.initialValue) {
        // Create a new FormData object
        const formData = new FormData();
        formData.append('courseId', courseId);
        // Append the changed field to the FormData
        formData.append(this.name, this.value);

        // Submit the form with only the changed field
        // todo save indicator
        fetch(this.form.action, {
          method: this.form.method,
          body: formData
        })
          .then((res) => {
            // todo disable save indicator
            if (res.ok) {
              return res.json();
            }
            return Promise.reject(res); // 2. reject instead of throw
          })
          .then(body => {
              // overwrite initial value with stored one
              input.dataset.initialValue = input.value;
              // update DOM element value
              // todo handle MD editor changes
              // todo handle file uploads
              const keys = Object.keys(body);
              const values = Object.values(body);

              for (let i = 0; i < keys.length; i++) {
                let elements = document.getElementsByName(keys[i]);
                if (elements.length > 0) {
                  elements[0].value = values[i];
                }
              }
            }
          )
          .catch((e) => console.log('viga:', e));
      }
    }, 500)); // 500ms debounce
  });

