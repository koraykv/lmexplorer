
(function() {
    var width=120
    var height=900
    var tw = 15
    var labels={};
    var rows;
    var status = d3.select('#status')
    status.text('Loading data...')
    var w = d3.text('embed.csv', function(str){
	rows = d3.csv.parseRows(str,function(row,i) {
	    labels[row[0]] = i;
	    return row;
	});
	status.text('')
    });
    d3.select('#query').on("keyup", function(d,i) {
	if (d3.event.keyCode != 13){
	    return;
	}
	var input=d3.event.srcElement.value;
	addcolumn(input);
    });
    var addcolumn = function(input) {
	if (labels[input] == null) {
	    status.style('opacity','1')
	    status.text(input + " is not in dictionary")
	    status.transition().delay(1000).style('opacity','0')
	    return;
	}
	var neighbors=rows[labels[input]];
	var box=d3.select("#row").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    .attr('id',input+'_box')
	    .style('display','inline');
	var closebox = box.append("g")
	    .attr("transform","translate(5,20)")
	    .on('click',function(d,i) {
		var box = d3.select(this.parentNode)
		console.log(box)
		box.selectAll('text').transition().attr('transform',function(){
		    return "translate(0,0)rotate(0)";
		}).remove()
		box.selectAll('rect').transition().attr('width',0)
		box.transition().remove()
	    });
	closebox.append("rect")
	    .style("opacity",0.8)
	    .style("fill","#ddd")
	    .attr("x",0)
	    .attr("y",-tw)
	    .attr("rx",5)
	    .attr("ry",5)
	    .attr("width",width-10)
	    .attr("height",20);
	closebox.append('text')
	    .attr('x',30)
	    .attr('y',0)
	    .attr('text-anchor','left')
	    .text('close');
	var elems=box.append("g")
	    .attr("transform", "translate(5,40)")
	    .attr("id","textbox")
	    .on('click', function(d,i) {
		var mouse = d3.mouse(this)
		var x = mouse[0]
		var y = mouse[1]+10
		var ix = Math.floor(Math.max(0,y)/tw)
		var iy = Math.floor(Math.max(0,x)/width)
		var texts = d3.select(this).selectAll('text')
		d3.select('#query').property('value',texts[iy][ix].textContent)
		addcolumn(texts[iy][ix].textContent)
	    })
	    .on('mousemove',function(d,i) {
		var mouse = d3.mouse(this)
		var x = mouse[0]
		var y = mouse[1]+10
		var ix = Math.floor(Math.max(0,y)/tw)
		var iy = Math.floor(Math.max(0,x)/width)
		var texts = d3.select(this).selectAll('text')
		d3.select('#highlighttext').property('value',texts[iy][ix].textContent)
		highlight(texts[iy][ix].textContent)
	    })
	    .selectAll("text")
	    .data(neighbors)
	    .enter()
	elems.append("rect")
	    .style("opacity", 0.0)
	    .attr("text-anchor", "left")
	    .attr('id',function(d) { return d+"_bg"; })
	    .transition()
	    .style("fill","lightblue")
	    .attr("x",0)
	    .attr("y",function(d,i){return (i-1)*tw})
	    .attr("rx",5)
	    .attr("ry",5)
	    .attr("width",width-10)
	    .attr("height",20);
	elems.append("text")
	    .style("opacity", function(d,i) {return (1-i/neighbors.length/1.3);})
	    .attr("text-anchor", "left")
	    .attr('id',function(d) { return d; })
	    .transition()
	    .attr("transform", function(d,i) {
		return "translate(" + [3, i*tw] + ")rotate(" + 0 + ")";
	    })
	    .text(function(d) { return d; })
    };
    var highlight = function(htxt) {
	// clear previous stuff
	d3.selectAll('#textbox').selectAll('text')
	    .style('font-weight','normal');
	d3.selectAll('#textbox').selectAll('rect')
	    .style('opacity',0);
	if (labels[htxt] == null || htxt == null || !htxt) {
	    return
	}
	d3.selectAll('#'+htxt+"_bg")
	    .style('opacity',0.8);
	d3.selectAll('#'+htxt)
	    .style('font-weight','bold')
    };
    d3.select('#highlighttext').on('keyup',function(d) {
	var htxt = d3.event.srcElement.value;
	highlight(htxt);
    });
    d3.select('#clear').on("click",function(d) {
	d3.select('#query').property('value','')
	d3.select('#highlighttext').property('value','')
	d3.selectAll('svg')
	    .transition().remove()
	    .selectAll('text').transition().attr('transform',function(){
		return "translate(0,0)rotate(0)";
	    }).remove()
    });
})();
