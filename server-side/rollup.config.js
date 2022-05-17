import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import config from '../addon.config.json'
import json from '@rollup/plugin-json'
import copy from 'rollup-plugin-copy'

export default config.Endpoints.map(endpoint => {
    return {
        input: endpoint,
        output: [
         {
          dir: '../publish/',
          format: 'cjs'
         }
        ],
        external: [
        ],
        plugins: [
            copy({
                targets: [
                    { src: 'template_pages/**/*', dest: '../publish/template_pages' }
                ]
            }),
            typescript({
                tsconfigOverride: {
                    compilerOptions: {
                        module: "es2015",
                        declaration: false
                    }
                }
            }),
            resolve(),
            commonjs(),
            json()
        ]
       }
    }
 );