import path from 'path'
import fs from 'fs-extra'
import { buildLangPrefix, findMax$tNumber, findMax$tNumberByLangFile, JsonMap, setObjectAttr } from './common'
import { generatorHTML } from './html-generator'
import { generateJavascript } from './javascript-generator'
import _ from 'lodash'

const targetFileList: string[] = []

// 主方法
function main(targetDir: string, langPath: string) {
  // 语言包
  let topLanguageJson = JSON.parse(fs.readFileSync(langPath, 'utf-8'))
  const commonLang = topLanguageJson.CommonText || {}

  // Vue 专属解析器
  function parseVueFile(code: string) {
    const tplStart = code.indexOf('<template>')
    const tplEnd = code.lastIndexOf('</template>') + 11
    let template = code.slice(tplStart, tplEnd)

    const jsStart = code.indexOf('<script>')
    const jsEnd = code.lastIndexOf('</script>') + 9
    const script = code.slice(jsStart, jsEnd)

    code = code.replace(template, '')
    code = code.replace(script, '')

    return {
      template: tplStart === -1 ? '' : template.slice(10, -11),
      script: script.slice(8, -9),
      other: code,
    }
  }

  let globalLangMap: JsonMap = {}

  // 根据目录和文件来生成不同的文件列表
  let files: string[] = []
  if (fs.statSync(targetDir).isDirectory()) {
    files = fs.readdirSync(targetDir)
  } else {
    const filename = targetDir.replace(path.dirname(targetDir), '')
    targetDir = path.dirname(targetDir)
    files = [filename]
  }

  for (const filename of files) {
    if (targetFileList.length > 0) {
      let f = false
      targetFileList.forEach((v) => {
        if (v === filename) f = true
      })
      if (!f) {
        console.log('过滤文件：', filename)
        continue
      }
    }
    const filePath = path.join(targetDir, filename)
    if (fs.statSync(path.join(filePath)).isDirectory()) continue
    const fileData = fs.readFileSync(filePath, 'utf-8')

    // 语言文件前缀生成
    const langPrefix = buildLangPrefix(filePath)
    const startIndex = findMax$tNumberByLangFile(topLanguageJson, langPrefix) + 1

    let outputCode = ''
    // Vue File
    if (path.extname(filename) === '.vue') {
      const { script, template, other: otherCode } = parseVueFile(fileData)
      console.log('\n----------\n正在处理 Vue 文件:', filename, '| 开始序号：', startIndex)
      const { code, lang } = startGenerator(langPrefix, template, script, otherCode, 'vue', startIndex, commonLang)
      globalLangMap = _.merge(globalLangMap, lang)
      outputCode = code
    }

    // JS File
    if (path.extname(filename) === '.js') {
      console.log('\n----------\n正在处理 Javascript 文件:', filename, '| 开始序号：', startIndex)
      const { code, lang } = startGenerator(langPrefix, '', fileData, '', 'js', startIndex, commonLang)
      globalLangMap = _.merge(globalLangMap, lang)
      outputCode = code
    }

    if (outputCode) fs.writeFileSync(filePath, outputCode, 'utf-8')
  }

  // 将语言文件的最终产物合并到现有语言文件
  topLanguageJson = _.merge(topLanguageJson, globalLangMap)
  // 覆盖原文件
  fs.writeFileSync(languageFilePath, JSON.stringify(topLanguageJson, null, 2), 'utf-8')
}

// 针对单个文件的生成器
function startGenerator(filePrefix: string, html: string, javascript: string, otherCode: string, fileType = 'vue', startIndex = 1, commonLang: JsonMap) {
  console.log('语言文件前缀：', filePrefix)

  const { index, output: outHtml, lang: htmlLang } = generatorHTML(html, filePrefix, startIndex, commonLang)
  const { output: outJs, lang: jsLang } = generateJavascript(javascript, filePrefix, index, commonLang)

  // 合并HTML，JS代码片段的语言文件
  const jsonLangMap: JsonMap = {}
  let mergeLangMap: JsonMap = {}
  mergeLangMap = _.merge(htmlLang, jsLang)

  // 按照语言文件前缀生成最终产物
  for (const key in mergeLangMap) {
    setObjectAttr(jsonLangMap, filePrefix.split('.'), key, mergeLangMap[key])
  }

  // Vue文件代码模板
  if (fileType === 'vue') {
    const newVueFileCode = `<template>
${outHtml}
</template>

<script>
${outJs}
</script>

${otherCode}
`
    return {
      commonLang,
      code: newVueFileCode,
      lang: jsonLangMap,
    }
  } else {
    // 其他类型文件代码模板
    return {
      commonLang,
      code: outJs,
      lang: jsonLangMap,
    }
  }
}

let targetDir = ''
let languageFilePath = ''
for (const i in process.argv) {
  const keyword = process.argv
  if (keyword[i] == 'exec') {
    languageFilePath = keyword[Number(i) + 1]
    targetDir = keyword[Number(i) + 2]
  }
}

if (targetDir && languageFilePath && path.isAbsolute(targetDir.trim()) && path.isAbsolute(languageFilePath.trim())) {
  if (!fs.existsSync(targetDir) || !fs.existsSync(languageFilePath)) {
    console.log('参数指定的文件不存在')
    process.exit(-1)
  }
  console.log('语言文件：', `"${languageFilePath.trim()}"`)
  console.log('目标目录/文件：', `"${targetDir.trim()}"`)
  // console.log('请检查是否参数正确，脚本将在3秒后执行...')
  main(targetDir, languageFilePath)
  process.exit(0)
} else {
  console.log('参数错误！！！')
  process.exit(-1)
}
