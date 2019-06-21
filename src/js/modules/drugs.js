import { Toolbelt } from '../modules/toolbelt'
import template from '../../templates/template.html'
import * as d3 from "d3"
import * as topojson from "topojson"

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

export class Drugs {

	constructor(data, mapdata) {

        var self = this
        
        this.geojson = topojson.feature(mapdata, mapdata.objects.countries)

        this.width = document.getElementById("map_container").offsetWidth

        this.height = this.width * 0.6

        this.info = document.getElementById("info");

        this.toolbelt = new Toolbelt()

        this.wrangle(data)

	}

    wrangle(data) {

        var database = data

        for (var i = 0; i < database.length; i++) {

            database[i]["node-coordinates"] = database[i]["node-coordinates"].split(", ");

            database[i]["node-coordinates"] = database[i]["node-coordinates"].map( (item) => JSON.parse(item))

            database[i]["node-text"] = database[i]["node-text"].split(",")

        }

        this.database = database

        this.map()

        this.resize()

    }

    resize() {

        var self = this

        window.addEventListener("resize", function() {

            clearTimeout(document.body.data)

            document.body.data = setTimeout( function() { 

                console.log("Resized")

                self.width = document.getElementById("map_container").offsetWidth

                self.height = self.width * 0.6

                self.map()

            }, 200);

        });

        window.addEventListener("orientationchange", function() {
            
            console.log("orientationchange")
            
        }, false);


    }

    map() {

        var self = this

        d3.select("#app svg").remove()

        self.projection = d3.geoMercator()
            .center([0, 5])
            .scale(self.width / 2 / 2)
            .rotate([-180,0])
            .translate([self.width / 2, self.height / 2]);

        this.svg = d3.select("#app").append("svg")
            .attr("width", self.width)
            .attr("height", self.height);

        var path = d3.geoPath()
            .projection(self.projection);

        var g = this.svg.append("g");

        g.selectAll("path")
            .data(self.geojson.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "lightgrey")

        g.append("rect")
            .attr("width", self.width)
            .attr("height", self.height)
            .attr("opacity",0)
            .on("click", reset)       

        for (var i = 0; i < self.database.length; i++) {

            this.narco(self.database[i], i)

        }

        function reset(d,i) {
            d3.selectAll('.circle').style("opacity", 0.3)

            d3.selectAll('.labels').style("display", "none")

            d3.selectAll('.iconic').style("display", "none")

            d3.selectAll('.path').attr("opacity", 0.3).attr("stroke-dasharray", 0).attr("stroke-width", 1)
        }


    }

    narco(data, index) {

        var self = this

        var g = this.svg.append("g").attr("class", `group_${index}`)

        var lineFunction = d3.line()
                            .x(function(d) { return self.projection([d[1], d[0]])[0]; })
                            .y(function(d) { return self.projection([d[1], d[0]])[1]; })
                            .curve(d3.curveCardinal);

        var drugrun = g.append("path")
                        .attr("class", `path path_${index}`)
                        .attr("d", lineFunction(data["node-coordinates"]))
                        .attr("stroke-width", 1)
                        .attr("stroke", "#197caa")
                        .attr("fill", "none")
                        .attr("opacity", 0.3)
                  
        g.selectAll("circle")
            .data(data["node-coordinates"])
            .enter()
            .append("circle")
            .attr("class", `circle circle_${index}`)
            .attr("cx", (d) => self.projection([d[1], d[0]])[0])
            .attr("cy", (d) => self.projection([d[1], d[0]])[1])
            .attr("r", 5)
            .attr("data-id", index)
            .style("fill", (d,i) => {
                return (i===data["node-coordinates"].length - 1) ? "#d61d00" : "#197caa" ;
            })
            .style("opacity", 0.3)
            .on("mouseover", busted)
            .on("click", busted)

        g.selectAll("image")
            .data(data["node-coordinates"])
            .enter()
            .append("image")
            .attr("class", `iconic icon_${index}`)
            .attr("xlink:href", (d,i) => {
                return (i===0) ? "<%= path %>/assets/boat.svg" : (i===data["node-coordinates"].length - 1) ? "<%= path %>/assets/bust.svg" : ""
            })
            .attr("x", (d) => self.projection([d[1], d[0]])[0] -15)
            .attr("y", (d) => self.projection([d[1], d[0]])[1] -15)
            .attr("width", 30)
            .attr("height", 30)
            .style("display", "none")

        g.selectAll("text")
            .data(data["node-coordinates"])
            .enter()
            .append("text")
            .attr("x", (d,i) => {
                var pos = (i % 2) ? 15 : -15 ;
                return self.projection([d[1], d[0]])[0] + pos
            })
            .attr("y", (d,i) => {
                var pos = (i % 2) ? 15 : -15 ;
                return self.projection([d[1], d[0]])[1] + pos
            })
            .attr("text-anchor", (d, i) => {
                return (i % 2) ? "start" : "end"
            })
            .attr("class", `labels label_${index}`)
            .text( (d,i) => {
                return (data["node-text"][i]) ? data["node-text"][i].trim() : ""
            })
            .style("display", "none")


        function busted(d, i) {

            var target = d3.select(this).attr("data-id")

            d3.selectAll('.circle').style("opacity", 0.3)

            d3.selectAll('.labels').style("display", "none")

            d3.selectAll('.iconic').style("display", "none")

            d3.selectAll('.path').attr("opacity", 0.3).attr("stroke-dasharray", 0).attr("stroke-width", 1)

            d3.selectAll(`.circle_${target}`).each(function(d, i) {
                var opacity = (i===0) ? 0 : (i===data["node-coordinates"].length - 1) ? 0 : 1 ;
                d3.select(this).style("opacity", opacity)
            })

            d3.selectAll(`.path_${target}`).attr("opacity", 1).attr("stroke-dasharray", 2).attr("stroke-width", 3)

            d3.selectAll(`.icon_${target}`).style("display", "block")

            d3.selectAll(`.label_${target}`).style("display", "block")

            d3.select(`.group_${target}`).moveToFront()

            var html = (self.database[target]) ? self.toolbelt.mustache(template, self.database[target]) : "" ;

            self.info.innerHTML = html

        }


    }

}
