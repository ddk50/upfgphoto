var gId = 0;
var insetedTags = [];
var ready = function() {

    var windowWidth = $(window).width();

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

    $('input#edittagbox').tagsinput({
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

    function onClickTagBtn(phototagsid, bloodhoundtextboxid, bloodhoundid) {
        container = $(phototagsid); //phototagsjpg or phototagszip
        name = $(bloodhoundtextboxid).val(); //bloodhoundtextboxphototop

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
                           }).find("#checkbox"+id).click(function(e){
//	    	               e.preventDefault();
                               e.stopPropagation();
	    	               var that = this;    
	    	               setTimeout(function() { that.checked = !that.checked; }, 1);
                           }).end().prependTo($('#checkboxlabel'+id));

            $(phototagsid + ' label[for="forcheckboxlabel'+id+'"]').wrapInner('<a href="tags/'+name+'" target="_blank"><a/>');
            
            insetedTags.push(name);
            $(bloodhoundtextboxid).val("");

            // $(phototagsid + ' label').click(function(e){
            //     e.stopPropagation()
            // })

            // $(phototagsid + ' input').on('click', function(e){
	    // 	e.preventDefault();
	    // 	var that = this;    
	    // 	setTimeout(function() { that.checked = !that.checked; }, 1);
            // });

            // $(phototagsid + ' input').live("click", function (e) {
	    // 	e.preventDefault();
	    // 	var that = this;
	    // 	setTimeout(function() { that.checked = !that.checked; }, 1);
            // });

            // $(phototagsid).delegate('input', 'click', function(e){
	    // 	e.preventDefault();
	    // 	var that = this;
	    // 	setTimeout(function() { that.checked = !that.checked; }, 1);   
            // });
            
        }        
    }

    function bloodhoundforphototop() {
	$("#bloodhoundphototop" + ' :button').click(function() {
            var val = $("#bloodhoundphototop :input[type=text]")[1].value;
            if (val != "" ) {
                window.location = "search/index?tag=" + val;
            }
	});
	$("#bloodhoundphototop :input[type=text]").keypress(function(ev) {
            if ((ev.which && ev.which === 13) ||
		(ev.keyCode && ev.keyCode === 13)) {
                var val = $("#bloodhoundphototop :input[type=text]")[1].value;
                if (val != "") {
                    window.location = "search/index?tag=" + val;
                }
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

    bloodhoundforphototop();
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

    $.ajax({
        type: "GET",
        url: "/d3cloudtags.json",
        dataType: "json",    
        success: function(response) {
            var frequency_list = response.msg;

            var fill = d3.scale.category20b();

//            var w = window.innerWidth - 50;
            var h = 500;
            if ($("#d3cloudtagcontainer").width() == null) {
                return;
            } else {                
                var w = $("#d3cloudtagcontainer").width();
            }
//            var h = $("#d3cloudtagcontainer").height();

            var max, fontSize;

            var layout = d3.layout.cloud()
                .timeInterval(Infinity)
                .size([w, h])
                .rotate(0)
                .fontSize(function(d) {
                    return fontSize(d.value);                   
                })
                .on("end", draw);

            var svg = d3.select(".d3cloudtag").append("svg")
                .attr("width", w)
                .attr("height", h);

            var vis = svg
                .append("g")
                .attr("transform", "translate(" + [w >> 1, h >> 1] + ")");

            update();

            window.onresize = function(event) {

                // for iphone;
                if ($(window).width() != windowWidth) {
                    windowWidth = $(window).width();
                    update();
                } else {
                    return;
                }
            };
            
            function draw(data, bounds) {      

//                var w = window.innerWidth - 50;
                var h = 500;
                if ($("#d3cloudtagcontainer").width() == null) {
                    return;
                } else {                
                    var w = $("#d3cloudtagcontainer").width();
                }
//                var h = $("#d3cloudtagcontainer").height();
                

                svg.attr("width", w).attr("height", h);

                scale = bounds ? Math.min(
                    w / Math.abs(bounds[1].x - w / 2),
                    w / Math.abs(bounds[0].x - w / 2),
                    h / Math.abs(bounds[1].y - h / 2),
                    h / Math.abs(bounds[0].y - h / 2)) / 2 : 1;

                var text = vis.selectAll("text")
                    .data(data, function(d) {
                        return d.key.toLowerCase();
                    });
                
                text.transition()
                    .duration(50)
                    .attr("transform", function(d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + 0 + ")";
                    })
                    .style("font-size", function(d) {
                        return d.size + "px";
                    });
                
                text.enter().append("text")
                    .text(function (d) { return d.key })
                    .on("click", function (d, i){
//                        window.open(d.url, "_blank");
                        window.open(d.url);
                    })
                    .on("mouseover", function(d){
                        d3.select(this).style("fill", "#FFFFCC");
                    })
                    .on("mouseout", function(d) {
                        d3.select(this).style("fill", fill(d.key.toLowerCase()));
                    })
                    .attr("text-anchor", "middle")
                    .attr("transform", function(d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + 0 + ")";
                    })
                    .style("font-size", function(d) {
                        return d.size + "px";
                    })
                    .style("opacity", 1e-6)
                    .transition()
                    .duration(50)
                    .style("opacity", 1);
                
                text.style("font-family", function(d) {
                    return d.font;
                }).style("fill", function(d) {
                    return fill(d.key.toLowerCase());
                }).text(function(d) {
                    return d.key;
                });

                vis.transition().attr("transform", "translate(" + [w >> 1, h >> 1] + ")scale(" + scale + ")");
            }

            function update() {
                layout.text(function(d) {
                    return d.key;
                })
                layout.font('impact').spiral('archimedean');
                fontSize = d3.scale['sqrt']().range([10, 100]);
                fontSize.domain([1, 26]);
                layout.stop().words(frequency_list).start();
            }            
        }
    });    
    
}

$(document).ready(ready)
$(document).on('page:load', ready)

