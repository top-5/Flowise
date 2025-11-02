import { defineConfig } from 'vitest/config'
import path from 'path'
import swc from 'unplugin-swc'

export default defineConfig({
    plugins: [
        swc.vite({
            jsc: {
                parser: {
                    syntax: 'typescript',
                    decorators: true
                },
                transform: {
                    legacyDecorator: true,
                    decoratorMetadata: true
                },
                target: 'es2020'
            }
        })
    ],
    test: {
        globals: true,
        environment: 'node',
        testTimeout: 360000, // 6 minutes for long setups
        include: ['test/index.test.ts'],
        exclude: ['node_modules', 'dist'],
        setupFiles: ['./vitest.setup.ts']
    },
    resolve: {
        alias: {
            '~': path.resolve(__dirname, './src')
        }
    }
})
