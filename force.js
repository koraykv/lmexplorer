
(function() {
    var width = 960;
    var height = 700;
    var ttime = 200;

    var color = d3.scale.category20();
    var linkopacity = 0.8;
    var noderadius = 5;
    var charge = -100;
    var distance = 30;
    var gravity = 0.5;

    var force = d3.layout.force()
	.charge(charge)
	.linkDistance(distance)
	.size([width, height])
	.gravity(gravity);

    var rows;
    var labels={};
    var wwidth=120;
    var wheight=900;
    var tw = 15;

    var status = d3.select('#status');
    var infobox = d3.select('#info');
    var stat = {	
	report: function(info) {
	    status.style('opacity','1');
	    status.text(info);
	},
	clear: function() {
	    status.transition().style('opacity','0');
	},
	show: function(info) {
	    status.style('opacity','1');
	    status.text(info);
	    status.transition().delay(1000).style('opacity','0');
	}
    };
    var info = {	
	report: function(info) {
	    infobox.style('opacity','1');
	    infobox.text(info);
	},
	clear: function() {
	    infobox.transition().style('opacity','0');
	},
	show: function(info) {
	    infobox.style('opacity','1');
	    infobox.text(info);
	    infobox.transition().delay(1000).style('opacity','0');
	}
    };

    stat.report('Loading data...');
    info.report('You are viewing 0 words and 0 nodes.');
    d3.select('#qdiv').selectAll('input').attr('disabled',true);

    /* 
     * load data and start
     */
    d3.text("embed.csv",function(imports) {

	rows = d3.csv.parseRows(imports,function(row,i) {
	    labels[row[0]] = i;
	    return row;
	});
	d3.select('#qdiv').selectAll('input').attr('disabled',null);
	stat.clear();

	/*
	 * these are our shared variables to store the data
	 */
	var matrix = [];
	var words = [];
	var links = [];
	var nodes = [];

	var getlinks = function(words) {
	    links = [];
	    nodes = [];
	    var dic = {};
	    // create the dictionary of all words
	    // that originate from given words
	    // and create links
	    var cntr = 0;
	    var gcntr = 0;
	    words.forEach(function(w1) {
		// the first element is rows is the same as 
		rows[labels[w1]].forEach(function(w2) {
		    if (dic[w2] == null) {
			dic[w2] = cntr;
			nodes.push({name: w2, index:labels[w2], group:gcntr, idic:cntr, x:0, y:0});
			cntr++;
		    }
		    if (w1 != w2) {
			var tt = {source: dic[w1], target: dic[w2]};
			//console.log(w1,w2,labels[w1],labels[w2],dic[w1],dic[w2],tt);
			links.push(tt);
		    }
		});
		gcntr++;
	    });
	    info.report('You are viewing '+words.length+' words and '+nodes.length+' nodes.');

	};

	var plot = function() {
	    //force.
	    var draw = function(){

		force
		    .nodes(nodes)
		    .links(links)
		    .start();
		
		d3.select("#chart").selectAll('svg').remove()
		var svg = d3.select("#chart").append("svg")
		    .attr("width", width)
		    .attr("height", height);
		
		var link = svg.selectAll("line.link")
		    .data(links)
		    .enter().append("line")
		    .attr("class", "link")
		    .style("stroke-width", function(d) { return Math.sqrt(d.value); })
		    .style('opacity',linkopacity);
		
		var node = svg.selectAll("circle.node")
		    .data(nodes)
		    .enter().append("circle")
		    .attr("class", "node")
		    .attr("r", noderadius)
		    .style("fill", function(d) { return color(d.group); })
		    .call(force.drag);
		
		node.append("title")
		    .text(function(d) { return d.name; });
		
		force.on("tick", function() {
		    link.attr("x1", function(d) { return d.source.x; })
		    	.attr("y1", function(d) { return d.source.y; })
		    	.attr("x2", function(d) { return d.target.x; })
		    	.attr("y2", function(d) { return d.target.y; });
		    
		    node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });

		    stat.report('running...')
		    stat.clear()
		    //console.log(this)
		});
	    };

	    draw();

	};
	var addcolumn = function(input) {
	    var neighbors=rows[labels[input]];
	    d3.select("#wordcol").selectAll('svg').remove()

	    var box=d3.select("#wordcol").append("svg")

	    box.attr("width", wwidth)
		.attr("height", wheight)
		.attr('id',input+'_box')
		.style('display','inline');
	    var elems=box.append("g")
		.attr("transform", "translate(0,40)")
		.attr("id","textbox")
		.on('click', function(d,i) {
		    var mouse = d3.mouse(this)
		    var x = mouse[0]
		    var y = mouse[1]+10
		    var ix = Math.floor(Math.max(0,y)/tw)
		    var iy = Math.floor(Math.max(0,x)/wwidth)
		    var texts = d3.select(this).selectAll('text')
		    d3.select('#query').property('value',texts[iy][ix].textContent)
		    plotall(texts[iy][ix].textContent)
		})
		.on('mousemove',function(d,i) {
		    var mouse = d3.mouse(this)
		    var x = mouse[0]
		    var y = mouse[1]+10
		    var ix = Math.floor(Math.max(0,y)/tw)
		    var iy = Math.floor(Math.max(0,x)/wwidth)
		    var texts = d3.select(this).selectAll('text')
		    highlight(texts[iy][ix].textContent)
		})
		.selectAll("text")
		.data(neighbors)
		.enter()
	    elems.append("rect")
		.style("opacity", 0.0)
		.attr("text-anchor", "left")
		.attr('id',function(d) { return "w_"+d+"_bg"; })
		.style("fill","lightblue")
		.attr("x",0)
		.attr("y",function(d,i){return (i-1)*tw})
		.attr("rx",5)
		.attr("ry",5)
		.attr("width",wwidth-10)
		.attr("height",20);
	    elems.append("text")
		.style("opacity", function(d,i) {return (1-i/neighbors.length/1.3);})
		.attr("text-anchor", "left")
		.attr('id',function(d) { return "w_"+d; })
		.attr("transform", function(d,i) {
		    return "translate(" + [3, i*tw] + ")rotate(" + 0 + ")";
		})
		.text(function(d) { return d; })
	};
	var highlight = function(htxt) {
	    // clear previous stuff
	    d3.selectAll('#textbox').selectAll('text')
		.style('font-weight','normal');

	    d3.selectAll('#chart').selectAll('text')
		.style('font-weight','normal');

	    d3.selectAll('#textbox').selectAll('rect')
		.style('opacity',0);

	    d3.selectAll('#chart').selectAll('rect')
		.style('opacity',0);

	    if (labels[htxt] == null || htxt == null || !htxt) {
		return
	    }

	    d3.selectAll('#w_'+htxt+"_bg")
		.style('opacity',0.8);

	    d3.selectAll('#w_'+htxt+"_bg_chart")
		.style('opacity',0.8);

	    d3.selectAll('#w_'+htxt)
		.style('font-weight','bold');
	};
	/*
	 * add a new data point to the system
	 * checks if the target word is in dictionary
	 */
	var addata = function(input) {
	    if (labels[input] == null) {
		stat.show(input + " is not in dictionary")
		return;
	    }
	    words.push(input);
	    getlinks(words);
	};
	var plotall = function(input) {
	    // check if this word is already in the graph
	    var wused = false;
	    words.forEach(function(w) {
		if (w == input) {
		    wused = true;
		}
	    });
	    if (labels[input] == null) {
		stat.show(input + " is not in dictionary")
		return;
	    }
	    if (!wused) {
		// add the word as new data point
		addata(input);
		// update the chord diagram
		plot()
	    }
	    // refresh the text column
	    addcolumn(input);
	};
	/*
	 *  query box handler.
	 *  checks if the target word is already in the graph
	 */
	d3.select('#query').on("keyup", function(d,i) {
	    // only do something if user pressed enter key
	    if (d3.event.keyCode != 13){
		return;
	    }
	    var input=d3.event.srcElement.value;
	    plotall(input)
	    // highlight the text so that user can keep 
	    // typing without need to delete the current word
	    d3.event.srcElement.select();
	});

	d3.select('#showlinks').on('change', function(d) {
	    var checked = d3.event.srcElement.checked;
	    if (checked) {
		linkopacity = 0.8;
	    } else {
		linkopacity = 0.0;
	    }
	    d3.select("#chart").selectAll('line.link').style('opacity',linkopacity);
	});
	d3.select('#noderadius').on('change', function(d) {
	    noderadius = d3.event.srcElement.value;
	    d3.select('#chart').selectAll('circle.node')
		.attr('r',noderadius)
	});
	d3.select('#charge').on('change', function(d) {
	    charge = d3.event.srcElement.value;
	    force.charge(charge).start();
	});
	d3.select('#distance').on('change', function(d) {
	    distance = d3.event.srcElement.value;
	    force.linkDistance(distance).start();
	});
	d3.select('#gravity').on('change', function(d) {
	    gravity = d3.event.srcElement.value;
	    force.gravity(gravity).start();
	});

	/*
	 *  clear the page
	 */
	d3.select('#clear').on("click",function(d) {
	    d3.select('#query').property('value','')
	    d3.select("#chart").selectAll('svg')
		.transition()
		.duration(ttime)
		.style('opacity',0)
		.remove();
	    d3.select('#wordcol').selectAll('svg')
		.transition()
		.duration(ttime)
		.style('opacity',0)
		.remove();
	    words = [];
	});


    });
})();
