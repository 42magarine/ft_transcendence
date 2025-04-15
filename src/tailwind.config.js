module.exports = {
    content: [
      './index.html',
      './frontend/**/*.{js,ts,jsx,tsx,html}',
      './components/**/*.{js,ts,jsx,tsx,html}',
      './views/**/*.{js,ts,jsx,tsx,html}',
      './utils/**/*.{js,ts,jsx,tsx,html}',
    ],
    safelist: [
      'btn',
      'btn-primary',
      'btn-secondary',
      'btn-danger',
      'btn-disabled',
      'btn-theme-home',
      'btn-theme-pong',
      'btn-theme-tictactoe',
      'btn-theme-user',
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  };
  