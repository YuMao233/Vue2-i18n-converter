import { platform } from 'os'
import path from 'path'

export function hasChinese(str = '') {
  if (str.includes('$t(')) return false
  return /[\u4E00-\u9FA5]+/g.test(str)
}

export function hasVueText(text = '') {
  if (text.includes('{{') && text.includes('}}')) return true
  return false
}

// 递归解析所有 Vue 表达式并生成数组
// ABC昵称{{ userInfo.A }}你好啊！{{ userInfo.B }}卧槽
// TO
// ["ABC昵称","{{ userInfo.A }}","你好啊！","{{ userInfo.B }}",卧槽]
export function htmlTextVueExpressParse(text = '') {
  const result: string[] = []
  function inner(point: number): number {
    if (point > text.length - 1) return 0
    const left = text.indexOf('{{', point)
    const right = text.indexOf('}}', left)
    if (right != -1 && left != -1) {
      result.push(text.slice(point, left))
      const vueExpress = text.slice(left, right + 2)
      if (hasChinese(vueExpress)) throw new Error('The expression cannot contain Chinese characters')
      result.push(vueExpress)
      return inner(right + 2)
    }
    result.push(text.slice(point, text.length))
    return 0
  }
  inner(0)
  return result
}

export function hasVueAttr(attrName = '') {
  const keywords = ['v-', '@', ':']
  for (const iterator of keywords) {
    if (attrName.indexOf(iterator) === 0) {
      return true
    }
  }
  return false
}

export function fillNumber(index = 0) {
  if (index < 10) return `00${index}`
  if (index < 100) return `0${index}`
  if (index < 1000) return `${index}`
  return String(index)
}

export function setObjectAttr(root: any, attrPath: string[], key: string, value: string) {
  let current = root
  for (let index = 0; index < attrPath.length; index++) {
    const element = attrPath[index]
    if (!current[element]) {
      current[element] = {}
    }
    current = current[element]
  }
  current[key] = value
}

export function getObjectAttr(root: ObjectMap, attrPath: string[]): JsonMap | null {
  let current = root
  for (let index = 0; index < attrPath.length; index++) {
    const element = attrPath[index]
    if (!current[element]) return null
    current = current[element]
  }
  return current
}

// 公共文本处理
export function includeCommonLang(commonLang: JsonMap, text: string) {
  const prefix = 'CommonText'
  // 重复内容直接返回
  for (const key in commonLang) {
    const cText = commonLang[key]
    if (cText === text) return `${prefix}.${key}`
  }
  // 获取最大序号
  const maxId = findMax$tNumberByLangFile(
    {
      [prefix]: commonLang,
    },
    prefix,
  )
  const fullNumber = fillNumber(maxId + 1)
  commonLang[fullNumber] = text
  return `${prefix}.${fullNumber}`
}

export function isExistsTextForLang(prefix: string, map: JsonMap, text: string): string {
  for (const key in map) {
    const element = map[key]
    if (element === text) {
      return `${prefix}.${key}`
    }
  }
  return ''
}

export function includeLangMap(filePrefix: string, index: number, text: string, commonLang: JsonMap, outputLanguageConfig: JsonMap) {
  let isBreak = false
  let tFnKey = `${filePrefix}.${fillNumber(index)}`
  if (text.length <= 4) {
    tFnKey = includeCommonLang(commonLang, text)
    isBreak = true
  } else if (isExistsTextForLang(filePrefix, outputLanguageConfig, text) !== '') {
    tFnKey = isExistsTextForLang(filePrefix, outputLanguageConfig, text)
    isBreak = true
  } else {
    outputLanguageConfig[fillNumber(index)] = text
  }
  return {
    tFnKey,
    isBreak,
  }
}

// 寻找文件中最大的编码序号，并同时忽略 CommonText 内容
// $t 不能换行
export function findMax$tNumber(code = '') {
  const lines = code.split('\n')
  let max = 0
  lines.forEach((line) => {
    function inner(start = 0) {
      const sp = line.indexOf('$t(', start)
      const commonTextP = line.indexOf('CommonText', start)
      const ep = line.indexOf(')', sp)
      if (sp > 0 && ep > 0 && (commonTextP == -1 || commonTextP > ep)) {
        let keyExpress = line.slice(sp + 3, ep)
        const keyExpressArr = keyExpress.replace(/\'/gim, '').split('')
        let n = ''
        let find = false
        for (const ch of keyExpressArr) {
          if (!isNaN(Number(ch))) {
            find = true
            n += String(ch)
          } else if (find) {
            break
          }
        }
        if (Number(n) > max) max = Number(n)
        inner(ep + 1)
      }
    }
    inner()
  })
  return max
}

// 寻找文件中最大的编码序号，并同时忽略 CommonText 内容
// $t 不能换行
export function findMax$tNumberByLangFile(language: ObjectMap, prefix: string) {
  let max = 0
  const keyList = getObjectAttr(language, prefix.split('.'))
  for (const key in keyList) {
    if (!isNaN(Number(key)) && Number(key) > max) {
      max = Number(key)
    }
  }
  return max
}

// 取路径最后两项作为语言后缀
// /Users/wangkun/Documents/SupportProject/weplay-admin-huafu-project/src/view/Censor/components/guardList.vue
export function buildLangPrefix(targetPath: string) {
  let prefix1 = ''
  let prefix2 = ''
  const LR = platform() === 'win32' ? '\\' : '/'
  const prefix3 = targetPath.split(LR).slice(-2)

  let tmpFlag = false
  for (const iterator of targetPath.split(LR)) {
    if (iterator === 'view') continue
    if (iterator === 'app') continue
    if (iterator === 'src') {
      tmpFlag = true
      continue
    }
    if (tmpFlag) {
      prefix1 = iterator
      break
    }
  }
  if (prefix3[0] === prefix1) prefix3.shift()
  prefix2 = prefix3.join('_').replace(path.extname(prefix3.join('')), '')

  // 语言文件最终前缀
  let filePrefix = [prefix1, prefix2].join('.')
  return filePrefix
}

export interface ReturnValue {
  index: number
  output: string
  lang: { [key: string]: any }
}

export interface JsonMap {
  [key: string]: string
}

export interface ObjectMap {
  [key: string]: any
}
