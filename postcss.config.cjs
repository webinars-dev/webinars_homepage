const importantAdminUtilities = {
  postcssPlugin: 'important-admin-utilities',
  Rule(rule) {
    if (!rule.selector || !rule.selector.includes('.admin-ui')) return;

    let parent = rule.parent;
    let isUtilitiesOrComponentsLayer = false;
    while (parent) {
      if (parent.type === 'atrule' && parent.name === 'layer') {
        const layerName = String(parent.params || '').trim();
        if (layerName === 'utilities' || layerName === 'components') {
          isUtilitiesOrComponentsLayer = true;
          break;
        }
      }
      parent = parent.parent;
    }

    if (!isUtilitiesOrComponentsLayer) return;

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
    importantAdminUtilities,
  ],
};
