中文 Vue 项目国际化转换工具
-----
基于抽象语法树实现的中文 Vue 项目转换为国际化项目脚本。

<br />

它可以做到什么？
-----
它可以实现  `Vue` 文件中的绝大部分的中文常量：`HTML` 中文文本（含 `Vue` 表达式），`Javascript` 字符串常量等全部转换成 `$t` 函数，并且将原中文编号放置到一个语言文件（`JSON`）中。

语言文件自动编号会自动合并重复文本，并且将短文本自动放置到公共层语言区域。

![https://public-link.oss-cn-shenzhen.aliyuncs.com/i18n-converter-main.jpg](https://public-link.oss-cn-shenzhen.aliyuncs.com/i18n-converter-main.jpg)


<br />

使用方式
-----
```bash
npm install
npm start exec <语言文件路径.json> <要转换的vue文件或目录>
```

列如：

```
unitwk@unitwk-Macbook-Pro zh-cn-i18n-converter % npm start exec /Users/unitwk/Documents/App/src/lib/i18n/zh_CN.json /Users/unitwk/Documents/App/src/view/OrderCenter/Test.vue

语言文件： "/Users/wangkun/Documents/SupportProject/weplay-admin-huafu-project/src/lib/i18n/zh_CN.json"
目标目录/文件： "/Users/wangkun/Documents/SupportProject/weplay-admin-huafu-project/src/view/OrderCenter/Test.vue"

----------
正在处理 Vue 文件: /Test.vue | 开始序号： 19
语言文件前缀： OrderCenter.Test
HTML 文本转换: 已添加 -> {{ $t('CommonText.664') }}
HTML 文本转换: 已取消 -> {{ $t('CommonText.602') }}
HTML 表达式转换: 操作人：{{ scope.row.cancel_operator }} 时间：{{ formatTime(scope.row.cancel_time_sec) }} -> {{ $t('OrderCenter.Test.019', [ scope.row.cancel_operator , formatTime(scope.row.cancel_time_sec) ]) }}

```

<br />

问题反馈
-----
如果您在使用过程中遇到了一些问题，可以提交一个 PR 或 Issue 说明这个情况。

<br />

开源协议
-----
MIT license

<br />

