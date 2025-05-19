import postcssMixins from 'postcss-mixins';
import postcssPresetEnv from 'postcss-preset-env';

export default {
  plugins: [
    postcssMixins({
      mixinsDir: 'src/styles',
    }),
    postcssPresetEnv()
  ]
};