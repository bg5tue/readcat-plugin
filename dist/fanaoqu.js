plugin.exports=class a{static ID="lC41kJPk8OJag1sE0IdmN";static TYPE=plugin.type.BOOK_SOURCE;static GROUP="默认";static NAME="番茄小说网（fanaoqi）";static VERSION="1.3";static VERSION_CODE=3;static PLUGIN_FILE_URL="https://gitee.com/bg5tue/readcat-plugin/raw/master/fanaoqu.com.ts.js";static BASE_URL="https://www.fanaoqi.com";static REQUIRE={maximumSearchResultPage:1};request;store;cheerio;nanoid;constructor(t){var{request:t,store:e,cheerio:a,nanoid:i}=t;this.request=t,this.store=e,this.cheerio=a,this.nanoid=i}async search(t){var e=a.BASE_URL+"/modules/article/search.php";return this.getSearchResults(e,t,1)}async getDetail(i){var t=(await this.request.get(i))["body"],e=this.cheerio(t,{decodeEntities:!1})(".panel-body:first");let r=[];this.cheerio(t)("dl.panel-chapterlist dd").each((t,e)=>{e=this.cheerio(e,{decodeEntities:!1});r.push({title:e("a").text(),url:""+i+e("a").attr("href")})});var s=this.cheerio(t)("select.form-control option:gt(0)");for(let t=0;t<s.length;t++){var h=this.cheerio(s[t])("option").attr("value"),h=await this.getChapters(""+a.BASE_URL+h);r.push(...h)}return{bookname:e.find("h1.bookTitle").text().match(/(.*?)\s\//)[1],author:e.find("small a").text(),coverImageUrl:e.find("img").attr("src"),latestChapterTitle:e.find("p:eq(1) a").text(),intro:e.find("p#bookIntro").text(),chapterList:r}}async getTextContent(t){return this.getContent(t.url)}async getSearchResults(t,e,i){var r=(await this.request.get(t,{params:{searchkey:e,page:i<=1?void 0:i},urlencode:"GBK"}))["body"];let s=[];return this.cheerio(r,{decodeEntities:!1})("table tbody").find("tr:gt(0)").each((t,e)=>{e=this.cheerio(e,{decodeEntities:!1});s.push({bookname:e("td:eq(1) a").text(),author:e("td:eq(3)").text(),coverImageUrl:void 0,latestChapterTitle:e("td:eq(2) a").text(),detailPageUrl:e("td:eq(1) a").attr("href")})}),1==a.REQUIRE.maximumSearchResultPage||Number(this.cheerio(r)("ul#pagelink li:last").text())<=i||i>=a.REQUIRE.maximumSearchResultPage||(r=await this.getSearchResults(t,e,i+1),s.push(...r)),s}async getChapters(i){let r=[];var t=(await this.request.get(i))["body"];return this.cheerio(t)("dl.panel-chapterlist dd").each((t,e)=>{var e=this.cheerio(e,{decodeEntities:!1}),a=i.match(/(.*)\//)[1];r.push({title:e("a").text(),url:a+"/"+e("a").attr("href")})}),r}async getContent(t){var a=(await this.request.get(t))["body"],i=this.cheerio(a,{decodeEntities:!1})("div#htmlContent");i.children().remove();let e=i.text();var r=(e=(e=e.replace("番茄小说网 www.fanaoqi.com，最快更新最新章节！","     ")).replace(/^[\sa-z;&]*/,"     ")).split(/\s{5}/),i=(r.splice(0,1),this.cheerio(a,{decodeEntities:!1})("a#linkNext"));if("下一页"==i.text()){var a=t.match(/(.*)\//)[1],s=await this.getContent(a+"/"+i.attr("href"));let e=r[r.length-1];e=e.replace(/[\s\.\-\>]+/,""),r[r.length-1]=e;var h=s[0];for(let t=1;t<h.length;t++){if(e.length-t<=0){r.splice(r.length-1,1);break}if(h.length-t<=0){s.splice(0,1);break}if(h.slice(0,t)==e.slice(-1*t)){var c=e+h.slice(t);r[r.length-1]=c,s.splice(0,1);break}}r.push(...s)}return r}};