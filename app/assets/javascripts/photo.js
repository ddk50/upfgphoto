var ready;
var gId = 0;
var insetedTags = [];

ready = function() {
    
    //
    // Begin tag autocomplete logic
    //
    var engine = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        prefetch: {
            ttl: 1,
            url: "/tags.json",
            filter: function(response) {
                return response.map(function(x) { return { value: x }; });
            }
        }
    });
    
    engine.initialize();
    
    $('#bloodhound .form-control').typeahead(null, {
        name:'stations',
        source: engine.ttAdapter()
    })

    function onClickTagBtn() {
        container = $('#phototags');        
        name = $('#bloodhoundtextbox').val();

        if (name.length == 0) {
            return;
        } else {        

            for (i = 0 ; i < insetedTags.length ; i++) {
                if (insetedTags[i] == name) {
                    return;
                }
            }

            id = gId = gId + 1;

            $('<label />', { id:    'checkboxlabel'+id, 
                             class: 'checkbox-inline',
                             for:   'forcheckboxlabel'+id,
                             text:   name
                           }).appendTo(container);

            $('<input />', { type:    'checkbox', 
                             id:      'checkbox'+id, 
                             checked: true,
                             name:    'tags[]',
                             value:   name,
                           }).prependTo($('#checkboxlabel'+id));

            $('label[for="forcheckboxlabel'+id+'"]').wrapInner('<a href="tags/'+name+'" target="_blank"><a/>');
            
            insetedTags.push(name);
            $('#bloodhoundtextbox').val("");

            $('label').click(function(e){ // or $('label a').click(function(e){
                e.stopPropagation()
            })
            
        }        
    }

    $('#bloodhound :button').click(function() {        
        onClickTagBtn();
    });

    $("input[type=text]").keypress(function(ev) {
        if ((ev.which && ev.which === 13) ||
            (ev.keyCode && ev.keyCode === 13)) {
            onClickTagBtn();
            return false;
        } else {
            return true;
        }
    });
    //
    // End tag autocomplete logic
    //


    
    $.ajax({
        type: "GET",
        url: "hottags.json",
        dataType: "json",
        
        success: function(response) {
            container = $('#recentusephototags');
            response.map(function(x) { 
                id = gId = gId + 1;            
                $('<label />', { id:    'checkboxlabel'+id, 
                                 for:   'forcheckboxlabel'+id,
                                 class: 'checkbox-inline',
                                 text:   x
                               }).appendTo(container);

                $('<input />', { type:    'checkbox', 
                                 id:      'checkbox'+id, 
                                 checked: false,
                                 name:    'tags[]',
                                 value:   x
                               }).prependTo($('#checkboxlabel'+id))

                $('label[for="forcheckboxlabel'+id+'"]').wrapInner('<a href="tags/'+x+'" target="_blank"><a/>');
            });

            $('label').click(function(e){ // or $('label a').click(function(e){
                e.stopPropagation()
            })
        },

        error: function(response) {
        }
    });
}

$(document).ready(ready)
$(document).on('page:load', ready)

