/* Print Alert */
function printAlert(type,message1,message2){message2=(message2===undefined)?"":message2;return '<div class="alert alert-'+type+' alert-dismissible fade show" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> </button><strong>'+message1+'</strong> '+message2+'</div>'; }

/* Serialize Form Data */
function serializeFormData(form) {
    var obj = {};
    var elements = form.querySelectorAll("input, select, textarea");
    var len = elements.length;
    for(var i = 0; i < len; ++i) {
        var element = elements[i];
        var name = element.name;
        var value = element.value;
        if(name) {
            obj[name] = value;
        }
    }
    return JSON.stringify(obj);
}

/* Disable button by id */
function disableClickButton(elementid,disabled,buttontext){disabled=(disabled===undefined)?true:disabled;buttontext=(buttontext===undefined)?"":buttontext;btn=document.getElementById(elementid),btn.disabled=disabled,''!=buttontext&&(btn.innerHTML=buttontext)}