/**
 * Created by PyCharm.
 * User: hepochen
 * Date: 12-2-13
 * Time: 下午9:17
 * To change this template use File | Settings | File Templates.
 */



function ubbTohHml(str){
    str = str.replace(/\[img\]([^\[]*)\[\/img\]/ig,'<img src="$1"/>');
    str = str.replace(/\[url=([^\]]+)\]([^\[]+)\[\/url\]/ig, '<a href="$1">'+'$2'+'</a>');
    str = str.replace(/\[url\]([^\[]+)\[\/url\]/ig, '<a href="$1">'+'$1'+'</a>');
    return str;
}

function getValue(entry, key){
    var value = '';
    if (key.indexOf(":") != -1){
        var key2 = key.split(':')[1];
        var es = entry.getElementsByTagName(key2);
        for (var i=0; i<es.length; i++){
            var item = es[i];
            if (item.nodeName == key){
                if (item.childNodes.length){
                    value = item.childNodes[0].nodeValue;
                }
                else{
                    value = ''
                }
                break;
            }
        }
    }
    else if(key=='wp_tags'){
        var tags=[];
        es = entry.getElementsByTagName('category');
        for (i=0; i<es.length; i++){
            var e = es[i];
            if (e.attributes && e.attributes.domain && e.attributes.domain.nodeValue == 'post_tag'){
                tags.push(e.childNodes[0].nodeValue);
            }
        }
        if (tags.length) value = tags;
    }

    else{
        es = entry.getElementsByTagName(key);
        for (i=0; i<es.length; i++){
            e = es[i];
            if (e.childNodes.length){
                if (key=='category' && e.attributes && e.attributes.domain ){ //for wordpress
                    if (e.attributes.domain.nodeValue == 'category'){
                        value = e.childNodes[0].nodeValue;
                        break
                    }
                }
                else{
                    value = e.childNodes[0].nodeValue;
                }
            }
        }
    }

    if (typeof(value)=='string'){
        value = value.replace(/\[CDATA\[([\s\S]*?)\]\]/gmi,'$1').trim();
        value = value.replace(/<!--([\s\S]*?)-->/gmi,'$1').trim();
        value = value.replace(/&nbsp;/gi, '');
        value = ubbTohHml(value);
    }

    return value
}


var BSP = new Class({
    Implements: [Options, Events],

    initialize: function(raw_content){
        this.dom = new Element('div', {'html': raw_content});
        var parser=new DOMParser();
        var doc = parser.parseFromString(raw_content, "text/xml");

        this.entries = doc.getElementsByTagName('item');//for wordpress

        this.properties = {
            title:'title',
            url: 'link',
            created:'wp:post_date',
            content:'content:encoded',
            category:'category',
            tags: 'wp_tags', //特别定义的
            type:'wp:post_type',
            status:'wp:status',
            password:'wp:post_password'
        };


        if (this.entries.length ==0) {
            this.entries = doc.getElementsByTagName('Log');//for blogbus
            this.properties ={
                title:'Title',
                created:'LogDate',
                content:'Content',
                tags:'Tags',
                status:'Status',
                password:'AccessPassword'
            };
        }

        if (this.entries.length ==0){
            alert('这个备份文档格式错误，目前支持Wordpress、BlogCN、BlogBus')
        }

    },


    format_entry: function(entry){
        var formatted_e={};
        var properties = this.properties;
        var ks = Object.keys(properties);
        ks.each(function(key){
            var value = getValue(entry, properties[key]);
            if (key == 'content'){
                value = toMarkdown(value);
                value = value.replace(/<\/?[^<]+?>/gi, '');
                value = value.replace(/(?:[^\n])\n([^\n])/gi, '\n\n$1'); //单\n的转\n\n
            }
            else if(key == 'url'){
                if (value.indexOf('?') == -1){ // not contain ? in url
                    value = new Element('a',{'href':value}).pathname;
                }
                else{ //ignore
                    value = '';
                }
            }
            formatted_e[key] = value;
        });
        if (formatted_e.content && formatted_e.type=='post'){//for wordpress
            formatted_e.category = formatted_e.category.replace(/(未分类)|(Uncategorized)/gi,'');
            if (formatted_e.status.test('draft')){
                formatted_e.status = 'draft'
            }
            else if (formatted_e.status.test('private') || formatted_e.password){
                formatted_e.status = 'private'
            }
            else{
                formatted_e.status = 'public'
            }
            return formatted_e;
        }
        else if (formatted_e.content && !formatted_e.type){//for blogbus
            formatted_e.timezone = 'Etc/GMT-8';
            if (formatted_e.status.test('0') || formatted_e.password){
                formatted_e.status = 'private'
            }
            else{
                formatted_e.status = 'public'
            }
            return formatted_e;
        }
    },

    format_entries:function(){
        var blog = this;
        var entries_formatted = [];
        for (var i=0; i<this.entries.length; i++){
            var entry=this.entries[i];
            var formatted_e = blog.format_entry(entry);
            if(formatted_e){
                entries_formatted.push(formatted_e);
            }
        }
        return entries_formatted;
    }
});






