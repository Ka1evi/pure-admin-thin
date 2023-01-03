import { cdn } from './cdn'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'
import { viteBuildInfo } from './info'
import svgLoader from 'vite-svg-loader'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { viteMockServe } from 'vite-plugin-mock'
import { configCompressPlugin } from './compress'
import AutoImport from 'unplugin-auto-import/vite'
// import ElementPlus from "unplugin-element-plus/vite";
import { visualizer } from 'rollup-plugin-visualizer'
import removeConsole from 'vite-plugin-remove-console'
import themePreprocessorPlugin from '@pureadmin/theme'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import DefineOptions from 'unplugin-vue-define-options/vite'
import { genScssMultipleScopeVars } from '../src/layout/theme'

export function getPluginsList(
  command: string,
  VITE_CDN: boolean,
  VITE_COMPRESSION: ViteCompression
) {
  const prodMock = true
  const lifecycle = process.env.npm_lifecycle_event
  return [
    vue(),
    // https://github.com/intlify/bundle-tools/tree/main/packages/vite-plugin-vue-i18n
    VueI18nPlugin({
      runtimeOnly: true,
      compositionOnly: true,
      include: [resolve('locales/**')]
    }),
    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      // targets to transform
      include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/, /\.md$/],

      // global imports to register
      imports: [
        // presets
        'vue',
        'vue-i18n',
        'vue-router',
        'pinia',
        // custom
        {
          axios: [
            // default imports
            ['default', 'axios'] // import { default as axios } from 'axios',
          ],
          'vue/macros': [
            // named imports
            '$ref', // import { $ref } from 'vue/macros',
            '$computed' // import { $computed } from 'vue/macros',
          ]
        }
      ],

      // Generate corresponding .eslintrc-auto-import.json file.
      // eslint globals Docs - https://eslint.org/docs/user-guide/configuring/language-options#specifying-globals
      eslintrc: {
        enabled: false, // Default `false`
        filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
        globalsPropValue: true // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
      },

      // Filepath to generate corresponding .d.ts file.
      // Defaults to './auto-imports.d.ts' when `typescript` is installed locally.
      // Set `false` to disable.
      dts: './auto-imports.d.ts'
    }),
    // jsx、tsx语法支持
    vueJsx(),
    VITE_CDN ? cdn : null,
    configCompressPlugin(VITE_COMPRESSION),
    DefineOptions(),
    // 线上环境删除console
    removeConsole({ external: ['src/assets/iconfont/iconfont.js'] }),
    viteBuildInfo(),
    // 自定义主题
    themePreprocessorPlugin({
      scss: {
        multipleScopeVars: genScssMultipleScopeVars(),
        extract: true
      }
    }),
    // svg组件化支持
    svgLoader(),
    // ElementPlus({}),
    // mock支持
    viteMockServe({
      mockPath: 'mock',
      localEnabled: command === 'serve',
      prodEnabled: command !== 'serve' && prodMock,
      injectCode: `
          import { setupProdMockServer } from './mockProdServer';
          setupProdMockServer();
        `,
      logger: false
    }),
    // 打包分析
    lifecycle === 'report'
      ? visualizer({ open: true, brotliSize: true, filename: 'report.html' })
      : null
  ]
}
