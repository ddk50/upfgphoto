var gId = 0;
var insetedTags = [];
var already_loaded_tags = false;

var load = function() {
    already_loaded_tags = true;
}

var ready = function() {

    var windowWidth = $(window).width();

    var dropzonecounter = 0;
    
    Dropzone.autoDiscover = false;
    $("#dduploadzone").dropzone({
        acceptedFiles: "image/*,capture=camera,.jpg,.jpeg,.zip",
        uploadMultiple: false,
        maxFilesize: 1024,
        maxThumbnailFilesize: 1024,
        acceptedFiles: '.jpg,.jpeg,.zip',
        headers: {"X-CSRF-Token" : $('meta[name="csrf-token"]').attr('content')},

	sending: function(file, xhr, formData) {
	    formData.append("tags", $("#postformforgalleryModal").find(".edittagbox.form-control").val());
	},
    
        success: function(file, response) {
            if (response.result === 'success') {
                file.previewElement.classList.add("dz-success");
            } else {
            }
        },

        complete: function(file) {
            if (this.getUploadingFiles().length === 0 &&
                this.getQueuedFiles().length === 0) {
                location.reload(true);
            }
        }
    });

    function edittag($this) {
        var selVal = $this.val().split(",");
        var id = $this.attr("data-photoid");
	if (id != null) {
            $.ajax({
		url: '/edittags.json',
		type: 'POST',
		dataType: 'json',
		data: {
                    'photoid': id,
                    'tags': selVal
		},
		success: function(response) {
                    if (response.status == 'error') {
			alert('書き換えエラー ' + response.msg);
                    }
		},
		error: function(response) {
                    alert('通信エラー');
		}
            });
	}
    }

    function editdescription($this) {
        var selVal = $this.val();
        var id = $this.attr("data-photoid");
        $.ajax({
            url: '/editdescription.json',
            type: 'POST',
            dataType: 'json',
            data: {
                'photoid': id,
                'photodescription': selVal
            },
            success: function(response) {
                if (response.status == 'error') {
                    alert('書き換えエラー ' + response.msg);
                }
            },
            error: function(response) {
                alert('通信エラー');
            }
        });        
    }

    function editcaption($this) {
        var selVal = $this.val();
        var id = $this.attr("data-photoid");
        $.ajax({
            url: '/editcaption.json',
            type: 'POST',
            dataType: 'json',
            data: {
                'photoid': id,
                'photocaption': selVal
            },
            success: function(response) {
                if (response.status == 'error') {
                    alert('書き換えエラー ' + response.msg);
                }
            },
            error: function(response) {
                alert('通信エラー');
            }
        });        
    }

    $(".movephoto").on('click', function(event){
	
	var boardid  = $(this).attr("data-boardid");
	var boardcap = $(this).attr("data-boardcaption");
        var photoids = new Array();
	
        event.preventDefault();
        event.stopPropagation();

        $("[name='photo_id[]']:checked").each(function() {
            photoids.push(this.value);
        });

	ret = confirm("本当に" + photoids.length + "個の写真を " + boardcap + " に移動しますか？");
	
	if (!ret) {
	    return;
	}

        $.ajax({
            url: '/albums/movephoto',
            type: 'POST',
            dataType: 'json',
            data: {
                'boardid': boardid,
                'items_ids': photoids
            },
            success: function(response) {
                if (response.status == 'error') {
                    alert('移動する際にエラーが発生しました ' + response.msg);
                } else {
		    window.location = response.redirect;
                    location.reload();
		}
            },
            error: function(response) {
                alert('通信エラー');
            }
        });        

	
	return false;
    });

    $(".photodescription").change(function(event) {
        editdescription($(this));
    });

    $(".photocaption").change(function(event) {
        editcaption($(this));
    });

    $(".edittagbox").on('itemAdded', function(event) {
        if (already_loaded_tags) {
            edittag($(this));
        }
     });

     $(".edittagbox").on('itemRemoved', function(event) {
         if (already_loaded_tags) {
             edittag($(this));
         }
     });

    /* smooth scrolling for scroll to top */
    $('.scroll-top').click(function(){
        $('body,html').animate({scrollTop:0},1000);
    })

    // $('#bloodhoundtextboxzip').qtip({ // Grab some elements to apply the tooltip to
    //     position: {
    //         my: 'bottom center',
    //         at: 'top center',
    //         target: $('#bloodhoundtextboxzip')
    //     },
    //     show: {
    //         event: 'focus'
    //     },
    //     hide: {
    //        event: 'blur'
    //     },
    //     content: {
    //         text: 'Enterキーを押すか, 「タグを追加」ボタンを押して確定してください'
    //     },
    //     style: {
    //         classes: 'tipsStyle'
    //     }
    // });

    $('#photos img').on('click', function(){
        var src = $(this).attr('data-original2');
        var img = '<img src="' + src + '" class="img-responsive"/>';
        $('#photoModal').modal();
        $('#photoModal').on('shown.bs.modal', function(){
            $('#photoModal .modal-body').html(img);
        });
        $('#photoModal').on('hidden.bs.modal', function(){
            $('#photoModal .modal-body').html('');
        });
    });    
    
    //
    // Begin tag autocomplete logic
    //
    var engine = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        limit: 20,
        prefetch: {            
            ttl: 1,
            url: "/tags.json",
            filter: function(response) {
                return response.map(function(x) { return { value: x }; });
            }
        }
    });
        
    engine.initialize();

    $('.edittagbox').tagsinput({
        typeaheadjs: {
            name: 'engine',
            displayKey: 'value',
            valueKey: 'value',
            source: engine.ttAdapter(),
            freeInput: true
        }
    });   
    
    $('#bloodhoundphototop .form-control').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    }, {
        name:'bloodhoundphototop',
        source: engine.ttAdapter()
    })

    $('#bloodhoundzip .form-control').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    }, {
        name:'bloodhoundzip',
        source: engine.ttAdapter()
    })

    $("#bloodhoundsearchbar").typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    }, {
        name: 'bloodhoundsearchbar',
        source: engine.ttAdapter()
    })

    function bloodhoundforphototop() {
	$("#bloodhoundphototop" + ' :button').click(function() {
            var val = $("#bloodhoundphototop :input[type=text]")[1].value;
            if (val != "" ) {
                window.location = "/search/index?tag=" + val;
            }
	});
	$("#bloodhoundphototop :input[type=text]").keypress(function(ev) {
            if ((ev.which && ev.which === 13) ||
		(ev.keyCode && ev.keyCode === 13)) {
                var val = $("#bloodhoundphototop :input[type=text]")[1].value;
                if (val != "") {
                    window.location = "/search/index?tag=" + val;
                }
		return false;
            } else {
		return true;
            }
	});
    }

    bloodhoundforphototop();
    
}

$(document).ready(ready);
$(window).load(load);

