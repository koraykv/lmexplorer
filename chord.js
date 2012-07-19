
(function(){

    var ttime = 200;

    var outerRadius = 700 / 2;
    var innerRadius = outerRadius - 80;

    var fill = d3.scale.category20();

    var chord = d3.layout.chord()
	.padding(.04)
	.sortSubgroups(d3.descending)
	.sortChords(d3.descending);

    var arc = d3.svg.arc()
	.innerRadius(innerRadius)
	.outerRadius(innerRadius + 10);

    var rows;
    var labels={};
    var words={};

    var wwidth=120;
    var wheight=900;
    var tw = 15;

    var status = d3.select('#status');
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
    stat.report('Loading data...');
    d3.select('#qdiv').selectAll('input').attr('disabled',true);
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
	var dic = {}
	var words = [];

	/*
	 * return an n-length array of zeros
	 */
	var zeros = function(n) {
	    var arr = [];
	    for (var i=0; i<n; i++) {
		arr.push(0);
	    }
	    return arr;
	};
	
	/*
	 * given an array of words return the adjancency
	 * matrix from number of common words
	 */
	var getmatrix = function(words) {
	    // create the dictionary of all words
	    // that originate from given words
	    var cntr = 0;
	    dic = {}
	    words.forEach(function(w) {
		rows[labels[w]].forEach(function(w) {
		    if (dic[w] == null) dic[w]= cntr++;
		});
	    });

	    // we have dictionary now, let's create counter matrix;
	    var cmat = [];
	    for (var w in dic) {
		cmat[dic[w]] = zeros(words.length);
	    }

	    // let's fill in the counter matrix
	    cntr = 0;
	    words.forEach(function(w) {
		rows[labels[w]].forEach(function(w) {
		    cmat[dic[w]][cntr] = 1;
		});
		cntr++;
	    });

	    // finally let's create the adjacency matrix
	    var mat = [];
	    var n = words.length;
	    for (var i=0; i<n; i++) {
		mat[i] = zeros(n);
	    }
	    cmat.forEach(function(cntr) {
		for (var i=0; i<cntr.length; i++) {
		    for (var j=i; j<cntr.length; j++) {
			mat[i][j] = mat[i][j] + cntr[i]*cntr[j]
			mat[j][i] = mat[i][j]
		    }
		}
	    });
	    return mat;
	}
	
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
	    matrix = getmatrix(words);
	}

	/*
	 * actually plots the chord diagram
	 * manages the svg area to clear previous ones..
	 */
	var plot = function(clear) {

	    /*
	     * this is the heavy lifter for chord diagram
	     */
	    var draw = function() {
		var svg = d3.select("#chart").append("svg")
		    .attr("width", outerRadius * 2)
		    .attr("height", outerRadius * 2)
		    .append("g")
		    .attr("transform", "translate(" + outerRadius + "," + outerRadius + ")")
		    .style('opacity',0);

		chord.matrix(matrix);

		/** Returns an event handler for fading a given chord group. */
		var fade = function(opacity) {
		    return function(g, i) {
			svg.selectAll("path.chord")
			    .filter(function(d) {
				return d.source.index != i && d.target.index != i;
			    })
			    .transition()
			    .style("opacity", opacity);
			highlight(d3.select(svg.selectAll('text')[0][i]).text())
		    };
		};

		var g = svg.selectAll("g.group")
		    .data(chord.groups)
		    .enter().append("g")
		    .attr("class", "group")
		    .on("mouseover", fade(.1))
		    .on("mouseout", fade(1));


		g.append("path")
		    .style("fill", function(d) { return fill(d.index); })
		    .style("stroke", function(d) { return fill(d.index); })
		    .attr("d", arc);
		
		g.append("rect")
		    .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
		    .attr('id',function(d) { return "w_"+ words[d.index]+"_bg_chart"; })
		    .attr("transform", function(d) {
			return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
			    + "translate(" + (innerRadius + 26) + ")"
			    + (d.angle > Math.PI ? "rotate(180)" : "");
		    })
		    .attr('height',tw)
		    .attr('x',0)
		    .attr('y',-tw/2)
		    .attr('rx',5)
		    .attr('ry',5)
		    .style("fill","lightblue")
		    .style("opacity", 0.0);

		g.append("text")
		    .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
			.attr("dy", ".35em")
		    .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
		    .attr('id',function(d) { return "w_"+ words[d.index]; })
		    .attr("transform", function(d) {
			return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
			    + "translate(" + (innerRadius + 26) + ")"
			    + (d.angle > Math.PI ? "rotate(180)" : "");
		    })
		    .text(function(d) { 
			var text = words[d.index];
			return  text
		    })
		    .on('click',function(d) {
			plotall(words[d.index])
		    })
		    .each(function(d) {
			var text = words[d.index];
			var rw = this.getBBox().width;
			d3.select('#chart').selectAll('#w_'+text+'_bg_chart')
			    .attr('width',rw+10)
			    .attr('x',function(d) {return d.angle >= Math.PI ? -rw-5 :-5 ; });
		    });

		svg.selectAll("path.chord")
		    .data(chord.chords)
		    .enter().append("path")
		    .attr("class", "chord")
		    .style("stroke", function(d) { return d3.rgb(fill(d.source.index)).darker(); })
		    .style("fill", function(d) { return fill(d.source.index); })
		    .attr("d", d3.svg.chord().radius(innerRadius));

		svg.transition().duration(ttime).style('opacity',1)
	    }

	    var drawings = d3.select("#chart").selectAll('svg')
	    if (clear == true && drawings[0].length > 0) {
		drawings
		    .transition()
		    .each("end",draw)
			.duration(ttime)
		    .style('opacity',0)
		    .remove()
	    }else {
		draw()
	    }
	}
	var addcolumn = function(input) {
	    var neighbors=rows[labels[input]];
	    d3.select("#wordcol").selectAll('svg').remove()

	    var box=d3.select("#wordcol").append("svg")

	    box.attr("width", wwidth)
		.attr("height", wheight)
		.attr('id',input+'_box')
		.style('display','inline');
	    var elems=box.append("g")
		.attr("transform", "translate(5,40)")
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
		plot(true)
	    }
	    // refresh the text column
	    addcolumn(input);
	}


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

