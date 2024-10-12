
/**
 * 文件编码: UTF-8(如不是UTF8编码可能会导致乱码或未知错误)
 * 禁止使用import、require导入模块
 * 若使用import * from *、import()、require()导入模块, 无法通过插件校验
 * import fs from 'fs';
 * import('fs').then().catch();
 * require('fs');
 */
plugin.exports = class Plugin implements BookStore {
  /**
   * 静态属性 ID  若使用插件开发工具生成模板则自动生成
   * 该值需符合正则表达式: [A-Za-z0-9_-]
   */
  public static readonly ID: string = 'qqZqL7896pxd9mm2OI2OQ';
  /**
   * 静态属性 TYPE  必填
   * 插件类型
   * 值类型:
   * plugin.type.BOOK_SOURCE  - 表示该插件为书源类
   * plugin.type.BOOK_STORE   - 表示该插件为书城类
   * plugin.type.TTS_ENGINE   - 表示该插件为TTS引擎类
   */
  public static readonly TYPE: number = plugin.type.BOOK_STORE;
  /**
   * 静态属性 GROUP  必填
   * 插件分组
   */
  public static readonly GROUP: string = '默认';
  /**
   * 静态属性 NAME  必填
   * 插件名称
   */
  public static readonly NAME: string = '番茄小说网';
  /**
   * 静态属性 VERSION  必填
   * 插件版本  用于显示
   */
  public static readonly VERSION: string = '1.1';
  /**
   * 静态属性 VERSION_CODE  必填
   * 插件版本代码  用于比较本地插件与静态属性PLUGIN_FILE_URL所指插件的版本号
   */
  public static readonly VERSION_CODE: number = 1;
  /**
   * 静态属性 PLUGIN_FILE_URL  必填
   * 插件http、https链接, 如: http://example.com/plugin-template.js
   */
  public static readonly PLUGIN_FILE_URL: string = 'https://raw.githubusercontent.com/bg5tue/readcat-plugin/refs/heads/main/dist/fanaoqu_bookstore.js';
  /**
   * 静态属性 BASE_URL  书源、书城类必填
   * 插件请求目标链接
   */
  public static readonly BASE_URL: string = 'https://www.fanaoqi.com';
  /**
   * 静态属性 REQUIRE  可选
   * 要求用户填写的值
   */
  public static readonly REQUIRE: Record<string, RequireItem> = {
    maxPageNumber: {
      type: 'number',
      label: '最大页数',
      default: 3,
      description: '从书源提取的排行榜页数，书源每页40，默认3页，数值越大提取速度越慢，不建议设置过大'
    }
  };
  /**
   * 书源类搜索结果过滤器  可选
   */
  public static readonly SEARCH_FILTER: SearchFilter = void 0;
  /**
   * 插件是否启用，为true表示该插件已弃用  可选
   */
  public static readonly DEPRECATED: boolean | undefined = void 0;
  private request: ReadCatRequest;
  private store: Store;
  private cheerio: CheerioModule.load;
  private nanoid: () => string;
  private uuid: (noDash?: boolean) => string;
  constructor(options: PluginConstructorOptions) {
    const { request, store, cheerio, nanoid, uuid } = options;
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
     *   return Promise<any | null> (JavaScript基本数据类型)
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

    this.uuid = uuid;
  }


  get config(): Record<string, () => Promise<BookStoreItem[]>> {
    return {
      '总排行榜': () => this.getRank('topallvisit'),
      '月排行榜': () => this.getRank('topmonthvisit'),
      '周排行榜': () => this.getRank('topweekvisit'),
      '总推荐榜': () => this.getRank('topallvote'),
      '月推荐榜': () => this.getRank('topmonthvote'),
      '周推荐榜': () => this.getRank('topweekvote'),
      '本站推荐': () => this.getRank('toptoptime'),
    }
  }

  /**
   * 提取排行榜
   * @param rank 排行榜
   * @param page 排行榜列表当前页
   * @returns 返回排行榜列表
   */
  private async getRank(rank: string, page = 1): Promise<BookStoreItem[]> {
    const url = `${Plugin.BASE_URL}/${rank}/${page}.html`;
    const { body } = await this.request.get(url);
    const result: BookStoreItem[] = [];
    this.cheerio(body, { decodeEntities: false })('table.table>tbody').children('tr:gt(0)').each(async (index, element) => {
      const el = this.cheerio(element);
      // console.log(el('td:eq(3)').text())
      result.push({
        bookname: el('td:eq(1)>a').text(),
        author: el('td:eq(3)').text(),
        coverImageUrl: undefined,// await this.getCover(el('td:eq(1)>a').attr('href')),
        intro: undefined,
      });
    });
    // 小于设置的限制页数，提取下一页
    if (page <= Plugin.REQUIRE.maxPageNumber.value) {
      result.push(...await this.getRank(rank, page += 1));
    }
    return result;
  }

  /**
   * 提取书籍封面
   * @param detailUrl 完整的书籍详情页URL
   * @returns 返回封面URL
   */
  private async getCover(detailUrl: string): Promise<string> {
    const { body } = await this.request.get(detailUrl);
    const url = this.cheerio(body, { decodeEntities: false })('img.img-thumbnail:first()').attr('src');
    console.log('cover url:', url)
    return url;
  }
}
