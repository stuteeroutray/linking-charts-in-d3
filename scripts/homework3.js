var mapSvg;

var lineSvg;
var lineWidth;
var lineHeight;
var lineInnerHeight;
var lineInnerWidth;
var lineMargin = { top: 20, right: 60, bottom: 60, left: 100 };

var mapData;
var timeData;

var tooltip;

// This runs when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
  mapSvg = d3.select('#map');
  lineSvg = d3.select('#linechart');
  lineWidth = +lineSvg.style('width').replace('px','');
  lineHeight = +lineSvg.style('height').replace('px','');;
  lineInnerWidth = lineWidth - lineMargin.left - lineMargin.right;
  lineInnerHeight = lineHeight - lineMargin.top - lineMargin.bottom;
  tooltip = d3.select("body").append("div")
              .style("position", "absolute")
              .style("padding-left", "5px")
              .style("padding-right", "5px")
              .style("text-align", "center")
              .style("background", "#FFFFFF")
              .style("border", "1px solid")
              .style("border-radius", "8px")
              .style("pointer-events", "none")
              .style("visibility", "hidden");

  // Load both files before doing anything else
  Promise.all([d3.json('data/africa.geojson'),
               d3.csv('data/africa_gdp_per_capita.csv')])
          .then(function(values){
    
    mapData = values[0];
    timeData = values[1];
   
    drawMap();
  })

});

// Get the min/max values for a year and return as an array
// of size=2. You shouldn't need to update this function.
function getExtentsForYear(yearData) {
  var max = Number.MIN_VALUE;
  var min = Number.MAX_VALUE;
  for(var key in yearData) {
    if(key == 'Year') 
      continue;
    let val = +yearData[key];
    if(val > max)
      max = val;
    if(val < min)
      min = val;
  }
  return [min,max];
}

// Draw the map in the #map svg
function drawMap() {

  // create the map projection and geoPath
  let projection = d3.geoMercator()
                      .scale(400)
                      .center(d3.geoCentroid(mapData))
                      .translate([+mapSvg.style('width').replace('px','')/2,
                                  +mapSvg.style('height').replace('px','')/2.3]);
  let path = d3.geoPath()
               .projection(projection);

  // get the selected year based on the input box's value
  var year = document.getElementById("year-input").value;
    
  // get the GDP values for countries for the selected year
  let yearData = timeData.filter( d => d.Year == year)[0];

  // get the min/max GDP values for the selected year
  let extent = getExtentsForYear(yearData);
    
  var colorScheme =  document.getElementById("color-scale-select").value;
  
  //get the selected color scale based on the dropdown value
  var colorScale = d3.scaleSequential(d3[colorScheme])
                     .domain(extent);
  
  // draw the map on the #map svg
  let g = mapSvg.append('g');

  g.selectAll('path')
    .data(mapData.features)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('id', d => { return d.properties.name})
    .attr('class','countrymap')
    .style('fill', d => {
      let val = +yearData[d.properties.name];
      if(isNaN(val)) 
        return 'white';
      return colorScale(val);
    })
    .on('mouseover', function(d,i) {
      d3.select(this)
        .attr("stroke-width", 4)
        .style("stroke", "#00FFFF");

      tooltip.style("visibility", "visible")
              .html("<p>Country: "+d.properties.name+"<br/>GDP: "+ +yearData[d.properties.name]+"</p>");
    })
    .on('mousemove',function(d,i) {
      d3.select(this)
        .attr("stroke-width", 4)
        .style("stroke", "#00FFFF");

      tooltip.style("visibility", "visible")
              .html("<p>Country: "+d.properties.name+"<br/>GDP: "+ +yearData[d.properties.name]+"</p>")
              .style("left", (d3.event.pageX+20) + "px")
              .style("top", (d3.event.pageY-20) + "px");   
    })
    .on('mouseout', function(d,i) {
      d3.select(this)
      .attr("stroke-width", 1)
      .style("stroke", "#000000");

      tooltip.style("visibility", "hidden");
    })
    .on('click', function(d,i) {
      lineSvg.selectAll('*').remove();
      drawLineChart(d.properties.name);
    });


    //draw legend
    var margin = ({top: 0, right: 100, bottom: -420, left: 20});
    colorScale = d3.scaleSequential(d3[colorScheme]).domain([0, extent[1]]);
    axisScale = d3.scaleLinear()
                  .domain(colorScale.domain())
                  .range([margin.left, 325 - margin.right]);
    axisBottom = g => g
                  .attr("transform", `translate(0,${100 - margin.bottom})`)
                  .call(d3.axisBottom(axisScale)
                  .ticks(5)
                  .tickSize(-20))
                  .call(g => g.select(".domain")
                  .remove())
                  .call(g => g.selectAll(".tick line")
                  .style("stroke","#FFFFFF"));

    const defs = mapSvg.append("defs");
  
    const linearGradient = defs.append("linearGradient")
                                .attr("id", "linear-gradient");
  
    linearGradient.selectAll("stop")
                  .data(colorScale.ticks().map((t, i, n) => ({ offset: `${100*i/n.length}%`, color: colorScale(t) })))
                  .enter().append("stop")
                  .attr("offset", d => d.offset)
                  .attr("stop-color", d => d.color);
  
    mapSvg.append('g')
        .attr("transform", `translate(0,${100 - margin.bottom -20})`)
        .append("rect")
        .attr('transform', `translate(${margin.left}, 0)`)
        .attr("width", 325 - margin.right - margin.left)
        .attr("height", 20)
        .style("fill", "url(#linear-gradient)");
  
    mapSvg.append('g')
        .call(axisBottom);
}


// Draw the line chart in the #linechart svg for
// the country argument (e.g., `Algeria').
function drawLineChart(country) {
  if(!country)
    return;
    
  // append the svg object to the body of the page
  var svg = lineSvg.append("svg")
                  .attr("width", lineInnerWidth + lineMargin.left + lineMargin.right)
                  .attr("height", lineInnerHeight + lineMargin.top + lineMargin.bottom)
                  .append("g")
                  .attr("transform", "translate(" + lineMargin.left + "," + lineMargin.top + ")");

  var xdata = timeData.map(function(d) { return +d.Year });
  var ydata = timeData.map(function(d) { return +d[country] });
  var xy = []; 
  for(var i = 0; i < xdata.length; i++ ) {
    xy.push({x: new Date(xdata[i],0,1), y: ydata[i]});
  }

  // Add X axis
  var x = d3.scaleTime()
            .domain([new Date(1960, 0, 1), new Date(2011, 0, 1)])
            .range([0,lineInnerWidth]);
  
  svg.append("g")
      .attr("transform", "translate(0," + lineInnerHeight + ")")
      .call(d3.axisBottom(x)
      .ticks(d3.timeYear.every(5)))
      .call(g => g.selectAll(".tick line")
        .style("stroke","#A9A9A9"))
      .call(g => g.selectAll(".tick text")
        .style("stroke","#A9A9A9"))
      .call(g => g.selectAll(".tick:nth-child(2n-1) text")
        .style("visibility", "hidden"));
  
  // Add Y axis
  var y = d3.scaleLinear()
            .domain([0, d3.max(ydata)])
            .range([lineInnerHeight,0]);
  
  svg.append("g")
    .call(d3.axisRight(y)
        .tickSize(lineInnerWidth))
    .call(g => g.select(".domain")
        .remove())
    .call(g => g.selectAll(".tick:not(:first-of-type) line")
        .attr("stroke-dasharray", "5,10"))
    .call(g => g.selectAll(".tick line")
        .style("stroke","#A9A9A9"))
    .call(g => g.selectAll(".tick text")
        .style("stroke","#A9A9A9")
        .attr("x", -30)
        .attr("dy", 0));
  
  // Add the line
  svg.append("path")
      .datum(xy)
      .attr("fill", "none")
      .attr("stroke", "#000000")
      .attr("stroke-width", 2)
      .attr("d", d3.line()
                  .x(function(d) { return x(d.x)}) 
                  .y(function(d) { return y(d.y)}));
  
  // Add labels
  svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - lineMargin.left + 50)
        .attr("x",0 - (lineInnerHeight / 2))
        .style("text-anchor", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-size", "18px")
        .attr("font-weight", "700")
        .attr("fill", "#A9A9A9")
        .text("GDP for "+country+" (based on current USD)");  

    svg.append("text")             
      .attr("transform", "translate(" + (lineInnerWidth/2) + " ," + (lineInnerHeight + lineMargin.top + 10) + ")")
      .style("text-anchor", "middle")
      .attr("font-family", "sans-serif")
      .attr("font-size", "18px")
      .attr("font-weight", "700")
      .attr("fill", "#A9A9A9")
      .text("Year");

    // To find the closest X index of the mouse:
    var bisect = d3.bisector(function(d) { return d.x; }).left;

    // Circle that travels along the curve of chart
    var focus = svg.append('g')
                    .append('circle')
                    .style("fill", "none")
                    .attr("stroke", "black")
                    .attr('r', 10)
                    .style("opacity", 0);

    // Rectangle to recover mouse position
    svg.append('rect')
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('width', lineInnerWidth)
        .attr('height', lineInnerHeight)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseout', mouseout);

    function mouseover() {
        focus.style("opacity", 1)
        tooltip.style("visibility","visible")
    }

    function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]);
        var i = bisect(xy, x0, 1);
        selectedData = xy[i]
        focus.attr("cx", x(selectedData.x))
              .attr("cy", y(selectedData.y))
        tooltip.html("<p>Year: "+selectedData.x.getFullYear()+"<br/>GDP: "+selectedData.y+"</p>")
              .style("left", (d3.event.pageX+20) + "px")
              .style("top", (d3.event.pageY-20) + "px");
    }

    function mouseout() {
        focus.style("opacity", 0)
        tooltip.style("visibility","hidden")
    }
}
  