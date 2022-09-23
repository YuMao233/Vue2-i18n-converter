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
npm run <语言文件路径.json> <要转换的vue文件或目录>
```
