import { defineConfig, loadEnv } from 'vite'
import process from 'node:process';

import { fileURLToPath, URL } from 'url';
import { getEnv, regExps } from './config'
import { composePlugins } from './config/plugins'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const root = process.cwd()
  const env = getEnv(loadEnv(mode, process.cwd()))
  const { VITE_PORT, VITE_PROXY_DOMAIN, VITE_PROXY_DOMAIN_REAL, VITE_LEGACY, VITE_PUBLIC_PATH } = env
  return {
    root,
    base: "/healthspy/",     
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
             @use "@/styles/custom/customVariables.scss" as *;
             `,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
      css: {
        preprocessorOptions: {
          scss: {
            additionalData: `
               @use "@/styles/element/index.scss" as *;
               `,
            
          },
        },
      },
      extensions: ['.js', '.json', '.ts', '.vue']
    },


    plugins: composePlugins(command, VITE_LEGACY),
    

    server: {
      host: '0.0.0.0',
      port: VITE_PORT || 9528,
      https: false,
      open: false,
      proxy: {
        [VITE_PROXY_DOMAIN]: {
          target: VITE_PROXY_DOMAIN_REAL,
          ws: false,
          changeOrigin: true,
          rewrite: (path) => regExps(path, VITE_PROXY_DOMAIN)
        }
      },
      hmr: {
        overlay: false
      }
    },

    define: {
      // https://vue-i18n.intlify.dev/guide/advanced/optimization.html#quasar-cli
      // 消除 vue-i18n 警告
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false,
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_INFO__: JSON.stringify({
        version: '3.0.0'
      })
    },

    build: {
      // path: './',
      sourcemap: false,
      brotliSize: false,
      chunkSizeWarningLimit: 2500,

      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: false
        }
      },

      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              return id
                .toString()
                .split('node_modules/')[1]
                .split('/')[0]
                .toString()
            }
          },
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/')
              : []
            const fileName = facadeModuleId[facadeModuleId.length - 2] || '[name]'
            return `js/${fileName}/[name].[hash].js`
          }
        }
      }
    }
  }
})
