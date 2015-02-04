var gId = 0;
var insetedTags = [];
var ready = function() {
    
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

    $('input#edittagbox').tagsinput({
        typeaheadjs: {
            name: 'engine',
            displayKey: 'value',
            valueKey: 'value',
            source: engine.ttAdapter(),
            freeInput: true
        }
    });
    
    $("button#submittag").click(function() {
        var selVal = $('input#edittagbox').val().split(",");
        var id = $('#largeimageview').attr("alt");
        $.ajax({
            url: '/edittags.json',
            type: 'POST',
            data: {
                'photoid': id,
                'tags': selVal
            },

            success: function(response) {
                alert("タグ書き換えに成功しました");
            },
            
            error: function(response) {
                alert("タグ書き換えに失敗しました");
            }

        });
    });
    
    $('#bloodhoundjpg .form-control').typeahead(null, {
        name:'bloodhoundjpg',
        source: engine.ttAdapter()
    })

    $('#bloodhoundzip .form-control').typeahead(null, {
        name:'bloodhoundzip',
        source: engine.ttAdapter()
    })

    function onClickTagBtn(phototagsid, bloodhoundtextboxid, bloodhoundid) {
        container = $(phototagsid); //phototagsjpg or phototagszip
        name = $(bloodhoundtextboxid).val(); //bloodhoundtextboxjpg

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

            $(phototagsid + ' label[for="forcheckboxlabel'+id+'"]').wrapInner('<a href="tags/'+name+'" target="_blank"><a/>');
            
            insetedTags.push(name);
            $(bloodhoundtextboxid).val("");

            // $(phototagsid + ' label').click(function(e){
            //     e.stopPropagation()
            // })

            $(phototagsid + ' input').click(function(e){
	    	e.preventDefault();
	    	var that = this;    
	    	setTimeout(function() { that.checked = !that.checked; }, 1);
            });
            
        }        
    }

    function bloodhoundforjpg() {
	$("#bloodhoundjpg" + ' :button').click(function() {
            onClickTagBtn('#phototagsjpg', '#bloodhoundtextboxjpg', '#bloodhoundjpg');
	});
	$("#bloodhoundjpg :input[type=text]").keypress(function(ev) {
            if ((ev.which && ev.which === 13) ||
		(ev.keyCode && ev.keyCode === 13)) {
		onClickTagBtn('#phototagsjpg', '#bloodhoundtextboxjpg', '#bloodhoundjpg');
		return false;
            } else {
		return true;
            }
	});
    }

    function bloodhoundforzip() {
	$("#bloodhoundzip" + ' :button').click(function() {
            onClickTagBtn('#phototagszip', '#bloodhoundtextboxzip', '#bloodhoundzip');
	});
	$("#bloodhoundzip :input[type=text]").keypress(function(ev) {
            if ((ev.which && ev.which === 13) ||
		(ev.keyCode && ev.keyCode === 13)) {
		onClickTagBtn('#phototagszip', '#bloodhoundtextboxzip', '#bloodhoundzip');
		return false;
            } else {
		return true;
            }
	});
    }

    bloodhoundforjpg();
    bloodhoundforzip();
    //
    // End tag autocomplete logic
    //


    function gethottag(recentusephototagsid) {
	$.ajax({
            type: "GET",
            url: "/hottags.json",
            dataType: "json",            
            success: function(response) {
		container = $(recentusephototagsid);
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

                    $(recentusephototagsid + ' label[for="forcheckboxlabel'+id+'"]').wrapInner('<a href="tags/'+x+'" target="_blank"><a/>');
		});

//		$(recentusephototagsid + ' input').click(function(e){
//                    e.stopPropagation()
//		})

//		$('label').click(function(e){
//                    e.stopPropagation()
//		})

//		$(recentusephototagsid).find('input').bind('click', function(e) {
//		    e.stopPropagation();
//		});

		$(recentusephototagsid + ' input').click(function(e){
		    e.preventDefault();
		    var that = this;    
		    setTimeout(function() { that.checked = !that.checked; }, 1);
		});

            },
            error: function(response) {
            }
	});
    }

    gethottag('#recentusephototagsjpg');
    gethottag('#recentusephototagszip');    
}

$(document).ready(ready)
$(document).on('page:load', ready)

