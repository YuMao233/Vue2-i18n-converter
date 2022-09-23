import fs from 'fs'
import * as htmlparser2 from 'htmlparser2'
import { render } from 'dom-serializer'
import { fillNumber, hasChinese, hasVueAttr, hasVueText, htmlTextVueExpressParse, includeCommonLang, includeLangMap, isExistsTextForLang, JsonMap, ReturnValue, setObjectAttr } from './common'

function htmlTextFilter(html: string) {
  html = html.replace(/\n/gim, '')
  html = html.trim()
  return html
}

export function generatorHTML(html: string, filePrefix: string, index: number, commonLang: JsonMap): ReturnValue {
  // DOM 树生成
  const dom = htmlparser2.parseDocument(html, {
    xmlMode: true,
    lowerCaseTags: false,
    lowerCaseAttributeNames: false,
  })

  const outputLanguageConfig: {
    [key: string]: any
  } = {}

  // HTML 属性转换
  function forEachAttr(node: any) {
    for (const key in node.attribs) {
      const text = node.attribs[key]
      if (!hasChinese(text)) continue
      if (hasVueAttr(key)) continue // 忽略 Vue 动态属性

      const { tFnKey, isBreak } = includeLangMap(filePrefix, index, text, commonLang, outputLanguageConfig)
      const textVueTemplate = `$t('${tFnKey}')`

      // 删除旧的 HTML 属性，新增i18n绑定
      delete node.attribs[key]
      node.attribs[`:${key}`] = textVueTemplate

      console.log('HTML 属性转换:', node.name, key, text, '->', textVueTemplate)

      if (!isBreak) index += 1
    }
  }

  // 文本常量转换
  function constDefineOutput(keyword: string) {
    if (hasVueText(keyword) || !hasChinese(keyword)) return keyword
    const { tFnKey, isBreak } = includeLangMap(filePrefix, index, keyword, commonLang, outputLanguageConfig)
    const textVueTemplate = `{{ $t('${tFnKey}') }}`
    console.log('HTML 文本转换:', keyword, '->', textVueTemplate)
    if (!isBreak) index += 1
    return textVueTemplate
  }

  // Vue 表达式文本转换
  function expressDefineOutput(keyword: string) {
    let expressArray: string[] = []
    try {
      expressArray = htmlTextVueExpressParse(keyword)
    } catch (error) {
      return keyword
    }
    const vueParams: string[] = []
    let paramsIndex = 0
    for (let index = 0; index < expressArray.length; index++) {
      const element = expressArray[index]
      if (element.includes('{{') && element.includes('}}')) {
        vueParams.push(element.slice(2, -2))
        expressArray[index] = `{${paramsIndex}}`
        paramsIndex++
      }
    }
    const $tExpress = expressArray.join('')
    const $tParams = JSON.stringify(vueParams).replace(/\"/gim, '')
    const { tFnKey, isBreak } = includeLangMap(filePrefix, index, $tExpress, commonLang, outputLanguageConfig)
    const textVueTemplate = `{{ $t('${tFnKey}', ${$tParams}) }}`
    console.log('HTML 表达式转换:', keyword, '->', textVueTemplate)
    if (!isBreak) index += 1
    return textVueTemplate
  }

  // 递归DOM树，根据其特点批量转换所有节点
  function walk(dom: any): any {
    for (const node of dom.children) {
      forEachAttr(node)
      if (node.children?.length > 0) {
        walk(node)
        continue
      }
      if (node.type === 'text') {
        const text = htmlTextFilter(node.data)
        if (!hasChinese(text)) continue

        if (!hasVueText(text)) {
          node.data = constDefineOutput(text)
        } else {
          node.data = expressDefineOutput(text)
        }
      }
    }
  }

  walk(dom)

  // DOM 树生成 HTML
  const outputHtml = render(dom, {
    encodeEntities: false,
    decodeEntities: false,
    xmlMode: false,
    selfClosingTags: false,
  })

  return {
    index,
    output: outputHtml,
    lang: outputLanguageConfig,
  }
}

// Node 类型
// Document {
//   parent: null,
//   prev: null,
//   next: null,
//   startIndex: null,
//   endIndex: null,
//   children: [
//     Element {
//       parent: [Circular *1],
//       prev: null,
//       next: [Text],
//       startIndex: null,
//       endIndex: null,
//       children: [Array],
//       name: 'template',
//       attribs: {},
//       type: 'tag'
//     },
//     Text {
//       parent: [Circular *1],
//       prev: [Element],
//       next: null,
//       startIndex: null,
//       endIndex: null,
//       data: '\n',
//       type: 'text'
//     }
//   ],
//   type: 'root'
// }
