var ready = function () {

    $('.masonry-container').masonry({
        // options
        itemSelector: '.masonry-item',
        columnWidth: 50
    });

    $('.tree-toggler').click(function () {
        $(this).parent().children('ul.tree').toggle(300);
	if ($(this).hasClass('glyphicon-plus')) {
	    $(this).removeClass('glyphicon-plus');
	    $(this).addClass('glyphicon-minus');
	} else if ($(this).hasClass('glyphicon-minus')) {
	    $(this).removeClass('glyphicon-minus');
	    $(this).addClass('glyphicon-plus');
	}
    });

    function editcaption($this) {
        var selVal = $this.val();
        var id = $this.attr("data-boardid");
        $.ajax({
            url: window.location.href,
            type: 'POST',
            dataType: 'json',
            data: {
                'id': id,
                'caption': selVal
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

    $(".boardcaptioneditbox").change(function(event) {
        editcaption($(this));
    });
    
    
    var dropzonecounter = 0;    
    Dropzone.autoDiscover = false;
    $(".boardddupload").dropzone({
        acceptedFiles: "image/*,capture=camera,.jpg,.jpeg,.zip",
        uploadMultiple: false,
        maxFilesize: 1024,
        maxThumbnailFilesize: 1024,
        headers: {
	    "X-CSRF-Token" : $('meta[name="csrf-token"]').attr('content')
	},
//        url: "/ddupload.json",

	sending: function(file, xhr, formData) {
	    formData.append("tags", $("#postformforboardModal").find(".edittagbox.form-control").val());
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
}

$(document).ready(ready);
$(document).on('page:load', ready);

