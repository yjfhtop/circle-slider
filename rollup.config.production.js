import rollupConfig, { LibName, resolveFile } from './rollup.config'
import pkg from './package.json'
// 代码压缩
import { terser } from 'rollup-plugin-terser'
// 提示打包出后的文件大小
import filesize from 'rollup-plugin-filesize'
// 打包时的进度条
import progress from 'rollup-plugin-progress'

const rollupProConfig = {
    ...rollupConfig,
}

rollupProConfig.output = [
    rollupProConfig.output,
    {
        file: pkg.main,
        format: 'esm',
        // 是否map文件
        sourcemap: rollupProConfig.output.sourcemap,
        // 文件头部
        banner: rollupProConfig.output.banner,
    },
]

rollupProConfig.plugins = [
    ...rollupConfig.plugins,
    terser(),
    filesize(),
    progress(),
]

export default rollupProConfig
