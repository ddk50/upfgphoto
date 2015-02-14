var ready = function () {

    // $('#myprofile').affix({
    //     offset: {
    //         top: 10,
    //     }
    // });
    
    // var params = getParameter();
    // if (params["start"] && params["end"]) {
    //     $("#start").val = params["start"];
    //     $("#end").val   = params["end"];
    // }

    $("#searchbydatebtn").click(function() {
	var start = $("#start").val();
	var end   = $("#end").val();

	if (!(start && end)) {
	    return;
	}

	var params = getParameter();
	var withoutParamurl = window.location.href.split('?')[0];
	var newparamstr = "?";

	params["start"] = start;
	params["end"]   = end;
	
	var first = 1;
	for (var i in params) {
	    if (first) {
		newparamstr += i + "=" + params[i];
		first = 0;
	    } else {
		newparamstr += "&" + i + "=" + params[i];
	    }
	}
	if (first) {
	    newparamstr = "";
	}
	window.location = withoutParamurl + newparamstr;
    });

    $("#deleteall").click(function() {
        var photoids= new Array();
        
        $("[name='photo_id[]']:checked").each(function() {
            photoids.push(this.value);
        });

        $.ajax({
            type: "POST",
            url: "/photo/delete/multiple",
            data: {
                "items_ids" : photoids
            },
            dataType: "json",

            success: function(response) {
                window.location = response.redirect;
                enable_btn("#deleteall", "一括削除");
                location.reload();
            },
            
            error: function(response) {
                window.location = response.redirect;
                enable_btn("#deleteall", "一括削除");
                location.reload();
            }
        });

        disable_btn("#deleteall", "please wait...")
    });

    $("#downloadall").click(function() {        
//        $("#downloadall").attr('value', 'please wait...').attr('disabled', true);
//        $("#downloadall").closest('form').submit();
//        location.reload();
        var photoids= new Array();
        
        $("[name='photo_id[]']:checked").each(function() {
            photoids.push(this.value);
        });
        
        $.ajax({
            type: "GET",
            url: "/photo/download/multiple",
            data: {
                "items_ids" : photoids
            },
            dataType: "json",

            success: function(response) {
                if (response.result == "success") {
                    window.location = response.redirect;
                    enable_btn("#downloadall", "ダウンロード");
                } else if (response.result == "error") {                    
                    enable_btn("#downloadall", "ダウンロード");
                    alert(response.msg);
                }

            },
            
            error: function(response) {
                enable_btn("#downloadall", "ダウンロード");
                alert("通信エラー" + response.msg);
            }
        });

        disable_btn("#downloadall", "please wait...")
    });   
}

function disable_btn(id, msg)
{
    $(id).attr('value', msg).attr('disabled', true);
    $(id).closest('form').submit();
}

function enable_btn(id, msg)
{
    $(id).attr('value', msg).attr('disabled', false);
    $(id).closest('form').submit();
}

function getParameter()
{
    var arg  = {}
    var pair = location.search.substring(1).split('&');
    for(i = 0 ; pair[i] ; i++) {
	var kv = pair[i].split('=');
	arg[kv[0]] = kv[1];
    }
    return arg;
}

$(document).ready(ready);
$(document).on('page:load', ready);
