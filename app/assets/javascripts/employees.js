var ready;
ready = function () {

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
                window.location = response.redirect;
                enable_btn("#downloadall", "ダウンロード");

            },
            
            error: function(response) {
                window.location = response.redirect;
                enable_btn("#downloadall", "ダウンロード");
                location.reload();
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

$(document).ready(ready)
$(document).on('page:load', ready)


