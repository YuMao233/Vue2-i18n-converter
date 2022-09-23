import fs from 'fs'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import * as t from '@babel/types'
import { fillNumber, hasChinese, includeCommonLang, includeLangMap, JsonMap, ReturnValue, setObjectAttr } from './common'

export function generateJavascript(configJsData: string, filePrefix: string, startIndex: number, commonLang: JsonMap): ReturnValue {
  // 解析成 AST
  const ast = parse(`${configJsData}`, {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    plugins: ['jsx', 'flow'],
  })

  let index = startIndex
  const outputLanguageConfig: {
    [key: string]: any
  } = {}

  // 遍历 AST
  traverse(ast, {
    enter(path) {
      // 扫描所有 Javascript 常量，并进行转换
      if (path.isStringLiteral()) {
        const value = path.node.value
        if (path.parent.type === 'ImportDeclaration') return
        if (!value || value.length === 0 || !isNaN(Number(value))) return
        if (!hasChinese(value)) return

        // 生成对应的 $t 函数参数，并将语言分配到 Language Map 中
        const { tFnKey, isBreak } = includeLangMap(filePrefix, index, value, commonLang, outputLanguageConfig)
        console.log('JavaScript 常量替换:', path.node.value, '->', `$t("${tFnKey}")`, ' Parent:', path.parent.type)

        // 创建一个 CallExpress 类型节点代替常量，即 $t()
        const i18nExpression = t.callExpression(
          {
            type: 'Identifier',
            name: 'window.$t',
          },
          [
            {
              type: 'StringLiteral',
              value: tFnKey,
            },
          ],
        )
        path.replaceWith(i18nExpression)

        if (!isBreak) index += 1
      }
    },
  })

  // 输出修改后的代码
  const result = generate(ast, { jsescOption: { minimal: true } }, '').code

  return {
    index,
    output: result,
    lang: outputLanguageConfig,
  }
}
