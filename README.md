## 中文 Vue 项目国际化转换工具

基于抽象语法树实现的中文 Vue 项目转换为国际化项目脚本。

它的工作原理是使用 Babel 的 Javascript 语法解析和第三方依赖库的 HTML DOM 数解析，所以这个工具在绝大部分场景下都不会破坏代码完整性，不会改变代码逻辑，但会改变代码格式（比如花括号自动换行）。

<br />

## 它可以做什么？

它可以实现 `Vue` 文件中的绝大部分的中文常量：`HTML` 中文文本（含 `Vue` 表达式），`Javascript` 字符串常量等全部转换成 `$t` 函数，并且将原中文编号放置到一个语言文件（`JSON`）中。

语言文件自动编号会自动合并重复文本，并且将短文本自动放置到公共层语言区域。

注意：此工具只支持 JS+Vue2+HTML 模板+任意 CSS 工具的技术组合，不适用于 JSX，Pug 等技术组合。

**Vue2 源代码**

```html
<template>
  <el-table :data="changeResult" border style="width: 100%">
    <el-table-column prop="A" label="列1" width="110">
      <span>这是测试文本: {{ name }}</span>
    </el-table-column>
    <el-table-column prop="B" label="列2" width="140"></el-table-column>
    <el-table-column prop="C" label="列3" width="140"></el-table-column>
    <el-table-column prop="D" label="列4" width="140"></el-table-column>
  </el-table>
</template>

<script>
  export default {
    data() {
      return {
        name: '你好世界 Hello',
      }
    },
    methods: {
      change() {
        return '文件' + name
      },
    },
  }
</script>
```

**命令**

```bash
npm start exec ./zh_cn.json /Users/unitwk/my-project/hello.vue

```

**转换成**

```html
<template>
  <el-table :data="changeResult" border style="width: 100%">
    <el-table-column prop="A" width="110" :label="$t('T_101qe69')">
      <span>{{ $t('T_1vj8uq3', [name]) }}</span>
    </el-table-column>
    <el-table-column prop="B" width="140" :label="$t('T_3ch8qbj')"></el-table-column>
    <el-table-column prop="C" width="140" :label="$t('T_2n16mf5')"></el-table-column>
    <el-table-column prop="D" width="140" :label="$t('T_o7fj26')"></el-table-column>
  </el-table>
</template>

<script>
  export default {
    data() {
      return {
        name: window.$t('T_3419iub'),
      }
    },
    methods: {
      change() {
        return window.$t('T_3acu75o') + name
      },
    },
  }
</script>
```

**输出 zh_cn.json**

```json
{
  "T_101qe69": "列1",
  "T_1vj8uq3": "这是测试文本: {0}",
  "T_3ch8qbj": "列2",
  "T_2n16mf5": "列3",
  "T_o7fj26": "列4",
  "T_3419iub": "你好世界 Hello",
  "T_3acu75o": "文件"
}
```

**支持增量更新，不会删除 json 语言包的内容**

<br />

## 转换成随机码后会影响后续阅读代码吗？

不会，你可以安装 VSCode 插件：

![image](https://github.com/unitwk/Vue2-i18n-converter/assets/18360009/87ffd124-17f0-43b1-9443-60345de9f724)

效果如下：
![image](https://github.com/unitwk/Vue2-i18n-converter/assets/18360009/5bf01a22-209e-448c-8fbe-64e85b5af82a)



<br />


## 使用方式

```bash
git clone https://github.com/unitwk/Vue2-i18n-converter.git
npm install
npm start exec <语言文件路径.json> <要转换的vue文件或目录>
```

```javascript
npm start exec ./b.json /Users/my-project/src/components/hello.vue

> zh-cn-i18n-converter@1.0.0 start
> ts-node index.ts "exec" "./b.json" "/Users/my-project/src/components/hello.vue"

语言文件： "/Users/wangkun/Documents/OtherWork/zh-cn-i18n-converter/b.json"
目标目录/文件： "/Users/my-project/src/components/hello.vue"

----------
正在处理 Vue 文件: /hello.vue | 开始序号： 1

HTML 属性转换: el-table-column label 列1 -> $t('T_101qe69')
HTML 表达式转换: 这是测试文本: {{ name }} -> {{ $t('T_1vj8uq3', [ name ]) }}
HTML 属性转换: el-table-column label 列2 -> $t('T_3ch8qbj')
HTML 属性转换: el-table-column label 列3 -> $t('T_2n16mf5')
HTML 属性转换: el-table-column label 列4 -> $t('T_o7fj26')
JavaScript 常量替换: 你好世界 Hello -> $t("T_3419iub")  Parent: ObjectProperty
JavaScript 常量替换: 文件 -> $t("T_3acu75o")  Parent: BinaryExpression

```

<br />



## 问题反馈

如果您在使用过程中遇到了一些问题，可以提交一个 PR 或 Issue 说明这个情况。

<br />

## 注意事项

转换后务必检查代码差异！字符串文本中包含至少一个中文汉字才会触发转换规则

**脚本无法处理的代码**

为避免因为脚本转换出现问题，以下几种情况代码不会被转换成国际化格式：

```html
<span>实名认证：{{real_name_info.id_num ? 1 : 2 }}认证</span>
<!-- Vue表达式内不含中文，可以 -->
<span>实名认证：{{ real_name_info.id_num ? '已' : '未' }}认证</span>
<!-- Vue表达式内含中文，不可以 -->
```

```javascript
const tmp1 = '你好' + name // 文本常量，可以
const tmp2 = `你好，${name}` // 模板文本，不可以
```

```javascript
//  所有 JSX 语法均无法解析
return (
  <div>
    <el-button onClick={() => this.lookNest(row)} type="primary" size="small">
      你好世界
    </el-button>
  </div>
)
```

## 开源协议

MIT license

<br />
