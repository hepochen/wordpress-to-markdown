/**
 * Created with PyCharm.
 * User: hepochen
 * Date: 12-12-24
 * Time: 下午12:18
 * To change this template use File | Settings | File Templates.
 */

var zip_content;
var entries = [];


function zip_entries(entries){
    zip_content = 'no';  // reset it first

    var zip = new JSZip();

    entries.each(function(entry){
        var filename = entry.title + '.md';

        var content = 'Title: ' + entry.title + '\n\n';
        content += 'Date: ' + entry.created + '\n\n';
        if (entry.status!='public') content += 'Status: ' + entry.status + '\n\n';
        if (entry.url) content += 'URL: ' + entry.url + '\n\n';
        if (entry.tags && entry.tags.length) content += 'Tags: ' + entry.tags.join(' , ') + '\n\n';

        content += entry.content;

        if (entry.category) {
            var folder = zip.folder(entry.category);
            folder.file(filename, content);
        }
        else{
            zip.file(filename, content);
        }
    });

    zip_content = zip.generate();
}

function download_zip(){
    if (zip_content && zip_content!='no' && entries.length){
        $('file-input').value = '';
        entries = [];
        var zip_content_cached = zip_content;
        zip_content = null;  // clear it now
        location.href = "data:application/zip;base64," + zip_content_cached;
    }
    else if (entries.length && zip_content=='no'){
        alert('waiting...')
    }
    else if(!zip_content){
        alert('select a xml file to upload')
    }
}


var opts = {
    accept: false,
    readAsMap: {
        'text/xml' : 'Text'
    },
    readAsDefault: 'Text',
    on: {
        load: function(e, file) {
            // Native ProgressEvent
            content = e.target.result;
            content = content.replace(/<wp:comment>[\s\S]*?<\/wp:comment>/gi, '');
            bsp = new BSP(content);

            entries = bsp.format_entries();

            zip_entries(entries);

        }
    }
};


