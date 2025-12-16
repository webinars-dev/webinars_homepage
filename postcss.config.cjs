const importantAdminUi = {
  postcssPlugin: 'important-admin-ui',
  Rule(rule) {
    if (!rule.selector || !rule.selector.includes('.admin-ui')) return;
    rule.walkDecls((decl) => {
      if (decl.important) return;
      decl.important = true;
    });
  },
};

module.exports = {
  plugins: [
    require('@tailwindcss/postcss')({
      optimize: { minify: false },
    }),
    require('autoprefixer'),
    importantAdminUi,
  ],
};
