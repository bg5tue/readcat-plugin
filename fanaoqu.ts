
/**
 * 文件编码: UTF-8(如不是UTF8编码可能会导致乱码或未知错误)
 * 禁止使用import、require导入模块
 * 若使用import * from *、import()、require()导入模块, 无法通过插件校验
 * import fs from 'fs';
 * import('fs').then().ca
[x: string]: any;tch();
 * require('fs');
 */
plugin.exports = class Plugin implements BookSource {
  /**
   * 静态属性 ID  自动生成
   * 该值需符合正则表达式: [A-Za-z0-9_-]
   */
  public static readonly ID: string = 'lC41kJPk8OJag1sE0IdmN';
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
  public static readonly NAME: string = '番茄小说网（fanaoqi）';
  /**
   * 静态属性 VERSION  必填
   * 插件版本  用于显示
   */
  public static readonly VERSION: string = '1.4';
  /**
   * 静态属性 VERSION_CODE  必填
   * 插件版本代码  用于比较本地插件与静态属性PLUGIN_FILE_URL所指插件的版本号
   */
  public static readonly VERSION_CODE: number = 4;
  /**
   * 静态属性 PLUGIN_FILE_URL  必填
   * 插件http、https链接, 如: http://example.com/plugin-template.js
   */
  public static readonly PLUGIN_FILE_URL: string = 'https://github.com/bg5tue/readcat-plugin/raw/refs/heads/main/dist/fanaoqu.js';
  /**
   * 静态属性 BASE_URL  必填
   * 插件请求目标链接
   */
  public static readonly BASE_URL: string = 'https://www.fanaoqi.com';
  /**
   * 静态属性 REQUIRE  可选
   * 要求用户填写的值
   */
  public static readonly REQUIRE: Record<string, number> = {
    /**
     * 最大搜索结果页数
     * 默认1页，设置0为不限制页数（不推荐，数量过多影响体验）
     * 该站每页显示40个搜索结果
     */
    maximumSearchResultPage: 1
  };
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
    const url = `${Plugin.BASE_URL}/modules/article/search.php`;
    return await this.getSearchResults(url, searchkey, 1);
  }

  async getDetail(detailPageUrl: string): Promise<DetailEntity> {
    // 下载源码
    const { body } = await this.request.get(detailPageUrl);
    // 提取书籍信息
    let bookInfo = this.cheerio(body, { decodeEntities: false })('.panel-body:first');
    // 要返回的章节列表
    let chapters: Chapter[] = [];
    // 提取并遍历第1页章节列表
    this.cheerio(body)('dl.panel-chapterlist dd').each((index, element) => {
      const chapter = this.cheerio(element, { decodeEntities: false });
      chapters.push({
        title: chapter('a').text(),
        url: `${detailPageUrl}${chapter('a').attr('href')}`,
      });
    });
    // 提取章并遍历节列表页列表
    // 由于第1页章节列表已提取，使用:gt(0)忽略第1个，从第2个元素开始
    const chaptersList = this.cheerio(body)('select.form-control option:gt(0)');
    for (let i = 0; i < chaptersList.length; i++) {
      const url = this.cheerio(chaptersList[i])('option').attr('value');
      // await Timer.sleep(Math.random() * 100);
      const chapterList: Chapter[] = await this.getChapters(`${Plugin.BASE_URL}${url}`);
      chapters.push(...chapterList);
    }
    // 返回书籍详情
    return {
      bookname: bookInfo.find('h1.bookTitle').text().match(/(.*?)\s\//)[1],
      author: bookInfo.find('small a').text(),
      coverImageUrl: bookInfo.find('img').attr('src'),
      latestChapterTitle: bookInfo.find('p:eq(1) a').text(),
      intro: bookInfo.find('p#bookIntro').text(),
      chapterList: chapters,
    }
  }

  async getTextContent(chapter: Chapter): Promise<string[]> {
    return await this.getContent(chapter.url);
  }

  /**
   * 获取搜索结果列表
   * @param url 要提取搜索结果列表的链接
   * @param searchkey 要搜索的关键字
   * @param page 要提取的页码，可选，忽略时为undefined不提交，第1页是不需要page参数
   * @returns 返回搜索结果列表
   */
  async getSearchResults(
    url: string,
    searchkey: string,
    page: number): Promise<SearchEntity[]> {
    // 下载页面源代码
    const { body, headers } = await this.request.get(url, {
      // 要提交的参数
      params: {
        searchkey, // 搜索关键字
        page: page <= 1 ? undefined : page, // 搜索结果页码，第1页时无需传值
      },
      urlencode: 'GBK', // 指定页面编码为GBK
    });
    // 搜索结果列表
    let result: SearchEntity[] = [];
    // 遍历并提取搜索结果列表
    this.cheerio(body, { decodeEntities: false })('table tbody').find('tr:gt(0)').each((index, element) => {
      // 提取书籍信息
      const book = this.cheerio(element, { decodeEntities: false });
      // 添加到搜索结果列表
      result.push({
        bookname: book('td:eq(1) a').text(), // 书名
        author: book('td:eq(3)').text(), // 作者
        coverImageUrl: undefined, // 封面图片链接
        latestChapterTitle: book('td:eq(2) a').text(), // 最后更新章节
        detailPageUrl: book('td:eq(1) a').attr('href'), // 详情页链接
      });
    });

    /// 根据要返回的页数来决定是否要处理下一页
    // 设置值为1或空，仅需要1页结果
    if (Plugin.REQUIRE.maximumSearchResultPage == 1) {
      // 此时就可以返回结果
      return result;
    }
    // 设置值不为1的处理
    else {
      // 提取总页数
      const pageCount = Number(this.cheerio(body)('ul#pagelink li:last').text());
      // 如果当前页达到最大页码，或者已经达到设置值
      if (page >= pageCount || page >= Plugin.REQUIRE.maximumSearchResultPage) {
        // 返回搜索结果
        return result;
      }
      else {
        // 未达到条件继续处理下一页
        const nextPageResults = await this.getSearchResults(url, searchkey, page + 1);
        // 加入到搜索结果列表
        result.push(...nextPageResults);
      }
    }
    ///
    // 返回最终搜索结果
    return result;
  }

  /**
   * 获取章节列表
   * @param url 要提取章节列表的链接
   * @returns 章节列表
   */
  async getChapters(url: string): Promise<Chapter[]> {
    // 要返回的章节列表
    let chapters: Chapter[] = [];
    // 下载页面源码
    const { body } = await this.request.get(url);
    // 提取并遍历章节列表
    this.cheerio(body)('dl.panel-chapterlist dd').each((index, element) => {
      const chapter = this.cheerio(element, { decodeEntities: false });
      // 截取当前页url
      const urlPrefix = url.match(/(.*)\//)[1];
      chapters.push({
        title: chapter('a').text(),
        url: `${urlPrefix}/${chapter('a').attr('href')}`,
      });
    });
    return chapters;
  }

  /**
   * 获取章节正文
   * @param url 要提取章节正文的链接
   * @returns 返回章节列表
   */
  async getContent(url: string): Promise<string[]> {
    const { body } = await this.request.get(url);
    let content = this.cheerio(body, { decodeEntities: false })('div#htmlContent');
    // 移除所有不需要的后代
    content.children().remove();
    // 只取文本内容
    let contentText = content.text();
    // 替换不需要的内容
    contentText = contentText.replace('番茄小说网 www.fanaoqi.com，最快更新最新章节！', '     ');
    // 替换不完整的html转义字符，如：nbsp;
    contentText = contentText.replace(/^[\sa-z;&]*/, '     ');
    // 拆分为段落数组
    let paragraphs = contentText.split(/\s{5}/);
    // 从0开始删除2个无用元素
    paragraphs.splice(0, 1);
    // 检查是否存在下一页
    const nextPage = this.cheerio(body, { decodeEntities: false })('a#linkNext');
    // 如果存在下一页
    if (nextPage.text() == "下一页") {
      // 截取当前页url
      const urlPrefix = url.match(/(.*)\//)[1];
      // 提取下一页段落
      let nextPageParagraphs = await this.getContent(`${urlPrefix}/${nextPage.attr('href')}`);
      /// 处理上下页衔接
      // 取出当前页最后一段
      let lastParagraph = paragraphs[paragraphs.length - 1];
      // 去除当前页最后一段内容中的无用字符 ... -->>
      lastParagraph = lastParagraph.replace(/[\s\.\-\>]+/, '');
      // 更新最后一段
      paragraphs[paragraphs.length - 1] = lastParagraph;
      // 取出下一页第一段
      let nextPageFirstParagraph = nextPageParagraphs[0];

      for (let i = 1; i < nextPageFirstParagraph.length; i++) {
        // 如果长度超出当前页最后一段的长度
        if (lastParagraph.length - i - 0 <= 0) {
          // 删除当前页最后一段
          paragraphs.splice(paragraphs.length - 1, 1);
          // 终止
          break;
        }
        // 如果长度超出下一页最前一段的长度
        if (nextPageFirstParagraph.length - i - 0 <= 0) {
          // 删除下一页最前一段
          nextPageParagraphs.splice(0, 1);
          // 终止
          break;
        }
        // 取出下一页前i个字
        let first = nextPageFirstParagraph.slice(0, i);
        // 取出当前页后i个字
        let last = lastParagraph.slice(i * -1); // substring(-1)表示取最后一个字符，-2最后两个……
        // 如果前后两个字符串不一致，表明内容已经不再重复
        if (first == last) {
          // 拼接中间段落
          const paragraph = lastParagraph + nextPageFirstParagraph.slice(i);
          // 修正当前页最后一段内容为新内容
          paragraphs[paragraphs.length - 1] = paragraph;
          // 删除下一页第一段
          nextPageParagraphs.splice(0, 1);
          // 终止
          break;
        }
      }
      ///
      // 把下一页段落添加到段落列表
      paragraphs.push(...nextPageParagraphs);
    }
    // 返回段落列表
    return paragraphs;
  }
}
