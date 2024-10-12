
/**
 * 文件编码: UTF-8(如不是UTF8编码可能会导致乱码或未知错误)
 * 禁止使用import、require导入模块
 * 若使用import * from *、import()、require()导入模块, 无法通过插件校验
 * import fs from 'fs';
 * import('fs').then().catch();
 * require('fs');
 */
plugin.exports = class Plugin implements BookSource {
  /**
   * 静态属性 ID  自动生成
   * 该值需符合正则表达式: [A-Za-z0-9_-]
   */
  public static readonly ID: string = 'vdjkzEKhqhDcXyu7EaC3t';
  /**
   * 静态属性 TYPE  必填
   * 插件类型
   * 值类型:
   * plugin.type.BOOK_SOURCE  - 表示该插件为书源类
   * plugin.type.BOOK_STORE   - 表示该插件为书城类
   */
  public static readonly TYPE: number = plugin.type.BOOK_SOURCE;
  /**
   * 静态属性 GROUP  必填
   * 插件分组
   */
  public static readonly GROUP: string = '默认';
  /**
   * 静态属性 NAME  必填
   * 插件名称
   */
  public static readonly NAME: string = '23书吧';
  /**
   * 静态属性 VERSION  必填
   * 插件版本  用于显示
   */
  public static readonly VERSION: string = '1.3';
  /**
   * 静态属性 VERSION_CODE  必填
   * 插件版本代码  用于比较本地插件与静态属性PLUGIN_FILE_URL所指插件的版本号
   */
  public static readonly VERSION_CODE: number = 3;
  /**
   * 静态属性 PLUGIN_FILE_URL  必填
   * 插件http、https链接, 如: http://example.com/plugin-template.js
   */
  public static readonly PLUGIN_FILE_URL: string = 'https://raw.githubusercontent.com/bg5tue/readcat-plugin/refs/heads/main/dist/23shu8.js';
  /**
   * 静态属性 BASE_URL  必填
   * 插件请求目标链接
   */
  public static readonly BASE_URL: string = 'https://23shu8.net';
  /**
   * 静态属性 REQUIRE  可选
   * 要求用户填写的值
   */
  public static readonly REQUIRE: Record<string, string> = {};
  private request: ReadCatRequest;
  private store: Store;
  private cheerio: CheerioModule.load;
  private nanoid: () => string;
  constructor(options: PluginConstructorOptions) {
    const { request, store, cheerio, nanoid } = options;
    /**
     * request
     *   function get(url, config)
     *     url: string    请求链接
     *     config(可选): {
     *                     params(可选): { [key: string]: number | string | boolean } | URLSearchParams,    请求参数
     *                     headers(可选): { [key: string]: string },    请求头
     *                     proxy(可选): boolean    是否开启代理,
     *                     charset(可选): string    字符集, 默认为自动获取, 当出现乱码时请指定字符集
     *                     urlencode(可选): string   URL编码, 默认UTF8
     *                     maxRedirects(可选): number  最大重定向数, 为0时则禁止重定向
     *                     responseType(可选): 'arraybuffer' | 'text' | 'json'  响应体类型, 默认text
     *                     signal(可选): AbortSignal  中止信号
     *                   }
     *   return: Promise<{ body, code, headers }>
     *   function post(url, config)
     *     url: string    请求链接
     *     config(可选): {
     *                     params(可选): { [key: string]: number | string | boolean }, | URLSearchParams,    请求参数
     *                     headers(可选): { [key: string]: string },    请求头
     *                     proxy(可选): boolean    是否开启代理
     *                     charset(可选): string    字符集, 默认为自动获取, 当出现乱码时请指定字符集
     *                     urlencode(可选): string   URL编码, 默认UTF8
     *                     maxRedirects(可选): number  最大重定向数, 为0时则禁止重定向
     *                     responseType(可选): 'arraybuffer' | 'text' | 'json'  响应体类型, 默认text
     *                     signal(可选): AbortSignal  中止信号
     *                   }
     *   return: Promise<{ body, code, headers }>
     * 
     *   body: 响应体
     *   code: 响应码
     *   headers: 响应头
     */
    this.request = request;
    /**
     * 每个插件都自带仓库（最大存储4MB）, 您可向该仓库设置、获取、删除值
     * store
     *   function setStoreValue(key, value)
     *               key: string,
     *               value: any (JavaScript基本数据类型), 该值经过v8.serialize处理
     *   return Promise<void>
     *   function getStoreValue(key)
     *               key: string
     *   return Promise<any> (JavaScript基本数据类型)
     *   function removeStoreValue(key)
     *               key: string
     *   return Promise<void>
     */
    this.store = store;
    /**
     * function cheerio(html: string)
     * 该值是模块cheerio中的load方法, 用法 const $ = cheerio(HTMLString)
     * 文档: https://cheerio.nodejs.cn/docs/basics/loading#load
     */
    this.cheerio = cheerio;
    /**
     * function nanoid
     * 获取21位随机字符串
     */
    this.nanoid = nanoid;
  }

  async search(searchkey: string): Promise<SearchEntity[]> {
    // 拼接URL
    const searchUrl = `${Plugin.BASE_URL}/s_${encodeURI(searchkey)}`;
    // 抓取搜索结果页
    const { body, } = await this.request.get(searchUrl, {
      headers: {
        // 需要请求头带有 referer
        'referer': `${Plugin.BASE_URL}/s_%E5%A4%A7%E5%94%90%E5%AD%BD%E5%AD%90`
      }
    });
    const html = this.cheerio(body, { decodeEntities: false });
    // 要返回的搜索结果列表
    const result: SearchEntity[] = [];
    // 提取搜索结果同时遍历列表
    const list = html('div.lists').find('ul').each((index, element) => {
      // 搜索结果项
      let item = this.cheerio(element);
      // 搜索搜索结果项
      let bookname = item('li.tag2>a');
      // 添加到要返回的搜索结果列表
      result.push({
        bookname: bookname.text(), //书名
        author: item('li.tag4>a').text(), // 作者
        coverImageUrl: undefined, // 封面图，该站点搜索结果中不显示封面图
        detailPageUrl: `${Plugin.BASE_URL}${bookname.attr('href')}`, // 详情页URL
        latestChapterTitle: item('li.tag3>a').text() // 最后更新章节的标题
      });
    });
    // 返回搜索结果列表
    return result;
  }

  async getDetail(detailPageUrl: string): Promise<DetailEntity> {
    // 抓取详情页
    const { body } = await this.request.get(detailPageUrl, {
      charset: 'GBK', // 指定页面编码为 GBK
    });
    // 详情
    const html = this.cheerio(body, { decodeEntities: false });
    // 章节列表
    const chapterList: Chapter[] = [];
    // 提取并遍历章节列表
    html('ul.catalogs').find('li').not('.fj').each((index, element) => {
      // 章节项
      const item = this.cheerio(element)('a');
      // 添加到章节列表
      chapterList.push({
        title: item.attr('title'), // 章节标题
        url: `${Plugin.BASE_URL}${item.attr('href')}`, // 章节URL
      });
    });

    // 返回详情
    return {
      bookname: html('h1').text(), // 书名
      author: html('div.catalog>div.infos>span:first>a').text(), // 作者
      coverImageUrl: html('div.catalog>img.cover').attr('src'), // 封面图
      latestChapterTitle: html('div.catalog>div.infos>span:eq(1)>a').text(), // 最后更新章节的标题
      intro: html('div.catalog>p').text(), // 简介
      chapterList, // 章节列表
    }
  }

  async getTextContent(chapter: Chapter): Promise<string[]> {
    // 抓取章节页
    const { body } = await this.request.get(chapter.url, {
      // 指定页面为GBK编码
      charset: 'GBK',
    });
    // 章节
    const html = this.cheerio(body, { decodeEntities: false });
    // 提取章节正文
    const content = html('div#content').text();
    // 将正文按段落拆分为数组
    const result: string[] = content.split('　　');
    // 返回在每个前加两个全角空格的段落列表
    return result.map(x => '　　' + x);
  }
}
