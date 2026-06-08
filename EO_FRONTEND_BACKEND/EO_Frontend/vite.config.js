import react from '@vitejs/plugin-react'
import path from 'path'
// https://vite.dev/config/
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [react({
      include: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx']
    }),

      // AssignFixedIdsPlugin(env),
    ],
    envPrefix: "EO_",
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: [
            'import',
            'color-functions',
            'global-builtin',
            'function-units',
            'if-function'
          ]
        }
      }
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.js$/,
      exclude: []
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        }
      }
    },
    server: {
      historyApiFallback: true,
      fs: { strict: false },
      port: 3000,
      open: false,
      strictPort: true,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
        'edition-unpleased-confiding.ngrok-free.dev',
        '.ngrok-free.dev',
        '.ngrok-free.app'
      ],
      hmr: {
        host: 'edition-unpleased-confiding.ngrok-free.dev',
        protocol: 'wss',
        clientPort: 443
      }
    },
    build: {
      rollupOptions: {
        input: './index.html'
      },
      sourcemap: false,
      assetsInlineLimit: 500_000,
      modulePreload: false,
      target: "esnext",
      minify: false,
      cssCodeSplit: false,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'src': path.resolve(__dirname, './src'),
        components: path.resolve(__dirname, './src/components'),
        assets: path.resolve(__dirname, './src/assets'),
        atoms: path.resolve(__dirname, './src/atoms'),
        config: path.resolve(__dirname, './src/config'),
        layout: path.resolve(__dirname, './src/layout'),
        libs: path.resolve(__dirname, './src/libs'),
        logger: path.resolve(__dirname, './src/logger'),
        models: path.resolve(__dirname, './src/models'),
        pages: path.resolve(__dirname, './src/pages'),
        routes: path.resolve(__dirname, './src/routes'),
        services: path.resolve(__dirname, './src/services'),
        utills: path.resolve(__dirname, './src/utills'),

      }
    },
    test: {
      include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      exclude: ['node_modules', 'dist', '**/setupTests.js', '**/env.js'],
      environment: 'jsdom',
      restoreMocks: true,
      globals: true,
      setupFiles: './src/setupTests.js',
      testTimeout: 10000,
      hookTimeout: 10000,
      teardownTimeout: 10000,
      threads: false,
      // poolOptions: {
      //   forks: {
      //     singleFork: false,
      //     minForks: 1,
      //     maxForks: 4,
      //     timeout: 60000
      //   }
      // },
      maxWorkers: 4,
      reporters: ['default', ['vitest-sonar-reporter', { outputFile: './test-report.xml' }]],
      outputFile: "./test-report.xml",
      maxConcurrency: 1,
      root: ".",
      coverage: {
        enabled: true,
        provider: 'v8',// or 'istanbul
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: "./coverage",
        clean: true,
        thresholds: {
          global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
          }
        },
        include: ['src/**/*.{js,jsx,ts,tsx}'],
        exclude: ['src/**/*.test.{js,jsx,ts,tsx}', 'src/**/*.spec.{js,jsx,ts,tsx}', 'node_modules/**', '**/setupTests.js']

      },
      alias: {
        '@': path.resolve(__dirname, './src'),
        'src': path.resolve(__dirname, './src'),
        components: path.resolve(__dirname, './src/components'),
        assets: path.resolve(__dirname, './src/assets'),
        atoms: path.resolve(__dirname, './src/atoms'),
        config: path.resolve(__dirname, './src/config'),
        layout: path.resolve(__dirname, './src/layout'),
        libs: path.resolve(__dirname, './src/libs'),
        logger: path.resolve(__dirname, './src/logger'),
        models: path.resolve(__dirname, './src/models'),
        pages: path.resolve(__dirname, './src/pages'),
        routes: path.resolve(__dirname, './src/routes'),
        services: path.resolve(__dirname, './src/services'),
        utills: path.resolve(__dirname, './src/utills'),

      }
    },
    envDir: './',
    base: "/eo_ui",
  }
})

