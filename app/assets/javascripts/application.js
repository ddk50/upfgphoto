// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require bootstrap.min
//= require bootstrap-datepicker
//= require bootstrap-tagsinput.min
//= require bootstrap-select.min
//= require typeahead.bundle
//= require jquery.lazyload.min
//= require pinterest-grid-plugin
//= require jquery.qtip.min
//= require dropzone
//= require_tree .

var ready = function () {

    $('#photothumbnail').pinterest_grid({
        no_columns: 4,
        padding_x: 10,
        padding_y: 10,
        margin_bottom: 200,
        single_column_breakpoint: 700,
	target_container: '#main'
    });

    $("img.img-lazy-responsive").lazyload({
        effect: "fadeIn",
        failure_limit: 999,
	threshold: 400
    });

    $("#main").scroll(function(){
	$("img.img-lazy-responsive").show().lazyload();
    });    

    $('[data-toggle=offcanvas]').click(function() {
	$(this).toggleClass('visible-xs text-center');
	$(this).find('i').toggleClass('glyphicon-chevron-right glyphicon-chevron-left');
	$('.row-offcanvas').toggleClass('active');
	$('#lg-menu').toggleClass('hidden-xs').toggleClass('visible-xs');
	$('#xs-menu').toggleClass('visible-xs').toggleClass('hidden-xs');
	$('#btnShow').toggle();
    });

//     var interval = setInterval(function(){
// 	$("img.img-lazy-responsive").lazyload();
// //	clearInterval(interval);
//     },500);

    // $('#date-pickere-container .input-daterange').datepicker({
    //     format: 'yyyy-mm-dd'
    // });

    $('.input-daterange').datepicker({
        format: 'yyyy-mm-dd'
    });

    $('.datepicker').datepicker({
	format: 'yyyy-mm-dd'
    })

    $('i.glyphicon-thumbs-up, i.glyphicon-thumbs-down').click(function(){
        
        var id = this.id
        var $this = $(this);
        var likeurl = $this.data('likeurl');

	$.ajax({
            type: "POST",
            url: likeurl,
            dataType: "json",
            success: function(response) {
                if (response.status == "success") {
                    c = $this.data('count');
                    if (!c) c = 0;
                    c++;
                    $this.data('count', c);
                    $('#'+id+'-bs3').html(c);

                    alert("Likeしました");
                } else if (response.status == "error") {
                    alert(response.msg);
                }
            },
            error: function(response) {
                alert("通信エラー" + reponse);
            }
        });
    });
    
    $(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
        event.preventDefault();
        $(this).ekkoLightbox();
    });

    $('.photocheckAll').on('change', function() {
        $('.' + this.id).prop('checked', this.checked);
    });

    $('.boardcheckAll').on('change', function() {
        $('.' + this.id).prop('checked', this.checked);
    });
}

$(document).ready(ready);
$(document).on('page:load', ready);

