import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import 'jquery';
import 'highcharts';
import 'highcharts/highcharts-more';
import 'highcharts/modules/data';
import 'highcharts/modules/exporting';
import 'highcharts/modules/drilldown';
import 'highcharts/modules/series-label';
import 'highcharts/modules/export-data';
import 'highcharts/themes/grid-light';
// console.logHighchartsMore;
// loadExporting(Highcharts);
// loadDrilldown(Highcharts);
// loadHighchartsMore(Highcharts);
/**
 * `mint-chart`
 * Mint Chart Visualization
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
const MINTY_API_SERVER = "http://minty.mintviz.org";
// const MINTY_API_SERVER = "http://0.0.0.0:65522";
const HighchartsColors = Highcharts.theme.colors;
// ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066',
            // '#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'];
class MintChart extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <div id="mintChart" style="width:100%;">
      </div>
      <slot></slot>
    `;
  }
  static get properties() {
    return {
      config: {
          type: Object,
          observer: '_configChanged',
          value: {}
      },
      viz_config_id: {
          type: String,
          observer: '_idChanged',
          value: ""
      }
    };
  }
  _idChanged(newId, oldId){
    // console.log(newId);
    if (newId !== oldId && newId.length > 0) {
      this.initById(newId);
    }else{
      console.error(newId + " doesn't work.")
    }
  }
  _configChanged(newObj, oldObj) {
      if (JSON.stringify(newObj).length === 2 ) {
        return;
      }
      // console.log(newObj)
      if (JSON.stringify(newObj) !== JSON.stringify(oldObj)) {
          if (newObj.type === "combine") {
              this.initCombineChart();
          }
          if (newObj.type === "bubble") {
              this.initBubbleChart(newObj);
          }
          if (newObj.type === "pie") {
              this.initPieChart(newObj);
          }
          if (newObj.type === "pie" && newObj.name === "second") {
              this.initPieChart2(newObj);
          }
          if (newObj.type === "bar" && newObj.name === "climatology") {
              this.initBarChart(newObj);
          }
          if (newObj.type === "dot" && newObj.name === "dat") {
              this.initDotChart(newObj);
          }

      }
  }
  ready() {
      super.ready();
  }
  initById(id){
    var self = this;
    if (typeof id !== "string") {
      return;
    }
    $.getJSON(MINTY_API_SERVER + '/minty/chart/' + id, function (json) {
      if (json.type === 'bar') {
        self.createBarChart(json.data, json.title.replace(/&nbsp;/g,' '));
      }else if (json.type === 'donut') {
        // Pie == Donut
        self.createPieChart(json.data, json.title.replace(/&nbsp;/g,' '));
      }else if (json.type === 'dot') {
        self.createDotChart(json.data, json.title.replace(/&nbsp;/g,' '));
        // self.createDotChart(json.grain_data, json.precip_data);
      }
    });
  }
  createBarChart(data, title){
    var self = this;
    var lines = data.split('\n');
    var dat = {};
    var xName = ''
    var yName = ''

    $.each(lines, function(lineNo, lineContent){
        if(lineNo > 0 && lineContent.length > 0)
            {
                var lineList=lineContent.split(',')
                dat[parseInt(lineList[1])]=parseFloat(lineList[2]);
                // console.log(lineNo, lineContent)
            }
        else
            {
                xName=lineContent.split(',')[1]
                yName=lineContent.split(',')[2]
            }
        });

    var years = [];
    var values = [];

    Object.keys(dat).sort().forEach(function(key) {
        years.push(key)
        values.push(dat[key])
    });


    Highcharts.chart(self.$.mintChart, {
        chart: {
            type: 'column'
        },
        title: {
            text: title
        },
        xAxis: {
            categories: years,
            crosshair: false
        },
        yAxis: {
            min: 0,
            title: {
                text: yName
            }
        },
       tooltip: {
            headerFormat: '<b>{series.name}:</b> {point.x}<br/>',
            pointFormat: '<b>Precipitation:</b> {point.y}<br/>'
        },
        plotOptions: {
            column: {
                pointPadding: 0.1,
                borderWidth: 0
            }
        },
        series: [{
            name: xName,
            data: values

        }]
    });
  }
  initBarChart(obj){
    var self = this;
    $.get('http://jonsnow.usc.edu:8081/mintmap/csv/climatology.csv', function(data) {
      self.createBarChart(data, 'Yearly spatially aggregated precipitation forecast');
    });
  }
  createDotChart(grain_data, title){
    var self = this;
    var lines = grain_data.split('\n');
    var years = [];
    var sX = {}, sY = {};
    var wX = {}, wY = {};
    var sTag = "", wTag = "";
    var sYears = [], wYears = [];
    var grainName = "", xName = "", yName = "";
        
    $.each(lines, function(lineNo, lineContent){
        if(lineNo > 0 && lineContent.length > 0)
        {  
            var lineList = lineContent.split(',');
            var x = parseFloat(lineList[4]);
            var y = parseFloat(lineList[3]);
            var tag = lineList[2]
            var time = lineList[1]
            var year = parseInt(time.split('-')[0]);
            var month = parseInt(time.split('-')[1]);

            if(month >= 10 || month < 4) {
                wX[year] = x;
                wY[year] = y;
                wTag = tag
                wYears.push(year);
                grainName=lineList[0].split('_')[1];
            }
            else if(month >= 4 && month < 10){
                sX[year] = x;
                sY[year] = y;
                sTag = tag
                sYears.push(year);
            }
        }
        else if(lineNo == 0) 
        {
            var lineList=lineContent.split(',');
            xName = lineList[4];
            yName = lineList[3];
        }
    });

    var years = wYears.filter(function(v){ return sYears.indexOf(v) > -1 })
    years = years.sort()

    var wValue = [];
    var sValue = [];
    var avgValue = [];

    for(var i=0; i<years.length; i++)
    {
        var year = years[i]
        sValue.push([sX[year], sY[year]]);
        wValue.push([wX[year], wY[year]]);
        avgValue.push([(sX[year] + wX[year]) / 2, (sY[year] + wY[year]) / 2])
    }

    Highcharts.chart(self.$.mintChart, {
        chart: {        
            type: 'scatter',
            zoomType: 'xy',
        },
        title: {
            text: title + grainName.toUpperCase()
        },
        xAxis: {
            title: {
                enabled: true,
                text: xName
            },
            startOnTick: true,
            endOnTick: true,
            showLastLabel: true
        },
        yAxis: {
            title: {
                text: yName
            }
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'bottom',
            x: -20,
            y: -50,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
            borderWidth: 1
        },
        plotOptions: {
            scatter: {
                marker: {
                    enabled:true,
                    symbol:'circle',
                    radius: 3,
                    states: {
                        hover: {
                            enabled: true,
                            lineColor: 'rgb(100,100,100)'
                        }
                    }
                },
                states: {
                    hover: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                tooltip: {
                    headerFormat: `<b>${xName}:</b> {point.x}<br/>`,
                    pointFormat: `<b>${yName}:</b> {point.y}<br/>`
                }
            }
        },
        series: [{
            name: wTag,
            color: 'red',
            data: wValue

        },{
            name: sTag,
            color: 'green',
            data: sValue
        },{
            name: 'Average',
            color: 'blue',
            data: avgValue
        }]
    });
  }
  initDotChart(obj){
    var self = this;
    // $.get('http://jonsnow.usc.edu:8081/mintmap/csv/SS_corn/season.dat', function(grain_data) {
    //     $.get('http://jonsnow.usc.edu:8081/mintmap/csv/SS_corn/weather.dat', function(precip_data) {
    //       self.createDotChart(grain_data, 'MODELED&nbsp;GRAIN&nbsp;YIELD&nbsp;AND&nbsp;PRECIPITATION&nbsp;FOR&nbsp;');
    //     });
    // });
  }
  initPieChart2(obj){
      var self = this;
      Highcharts.ajax({
          url: "http://jonsnow.usc.edu:8081/mintmap/csv/crop.csv",
          dataType: 'text',
          success: function(csv) {
              self.createPieChart(csv, 'Crop Production');
          },
          error: function (e, t) {
              console.error(e, t);
          }
      });
  }
  createPieChart(csv,title){
    var self = this;
    var colors = HighchartsColors,
        categories = [],
        data = [],
        crops = [],
        yield_kg = [],
        resourceUse = [],
        landArea = [],
        i,
        j,
        drillDataLen,
        brightness;
    var pieOptions = {
        chart: {
            type: 'pie'
        },
        title: {
            text: title
        },
        subtitle: {
            text: ''
        },
        yAxis: {
            title: {
                text: ''
            }
        },
        plotOptions: {
            pie: {
                shadow: false,
                center: ['50%', '50%']
            }
        },
        tooltip: {
            // valueSuffix: '%'
        },
        series: [{
            name: 'Yield (kg/ha) Base',
            data: crops,
            size: '60%',
            dataLabels: {
                formatter: function () {
                    return this.y > 5 ? this.point.name : null;
                },
                color: '#ffffff',
                distance: -30
            }
        }, 
        {
            name: 'Yield (kg/ha) +5%',
            data: landArea,
            size: '70%',
            innerSize: '50%',
            dataLabels: false
            // {
            //     formatter: function () {
            //         // display only if larger than 1
            //         return this.y > 1 ? '<b>' + this.point.name + ':</b> ' +
            //             this.y + '' : null;
            //     }
            // },
        },
        {
            name: 'Yield (kg/ha) -5%',
            data: yield_kg,
            size: '90%',
            innerSize: '70%',
            dataLabels: false,
            dataLabels: {
                formatter: function () {
                    // display only if larger than 1
                    return this.y > 1 ? '<b>' + this.point.name + ':</b> ' +
                        this.y + '' : null;
                }
            },
            id: 'resources'
        }],
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 400
                },
                chartOptions: {
                    series: [{
                        id: 'resources',
                        dataLabels: {
                            enabled: false
                        }
                    }]
                }
            }]
        }
    }
    let csvTitles = [];
    var lines = csv.split('\n');
    lines.forEach(function(line, lineNo) {
        line = line.replace(/\"/g,"");
        var items = line.split(',');
        // header line containes categories
        if (lineNo == 0) {
            items.forEach(function(item, itemNo) {
                csvTitles.push(item);
            });
        }else {
            let year_region = items[0] + "." + items[1];
            var ele = {y:0, landarea: 0, yield:0, color:colors[lineNo-1],drilldown:{name:"",categories:[],data:[]}};
            items.forEach(function(item, itemNo) {
                if (csvTitles[itemNo] === 'crop') {
                    categories.push(year_region + "." + item);
                    ele.drilldown.name = year_region + "." + item;
                }else if(!(csvTitles[itemNo] in {'year':0,'region':1,'crop':2,'yield (kg/ha) Base':3,'yield (kg/ha) +5%':4})){
                    ele.drilldown.categories.push(csvTitles[itemNo])
                    ele.drilldown.data.push(parseFloat(item));
                }else if(csvTitles[itemNo] === 'yield (kg/ha) Base'){
                    ele.y = parseFloat(item);
                }else if(csvTitles[itemNo] === 'yield (kg/ha) +5%'){
                    ele.landarea = parseFloat(item);
                }
                // else if(csvTitles[itemNo] === 'yield (kg/ha) -5%'){
                //     ele.yield = parseFloat(item);
                // }
            });
            data.push(ele);
        }
    });
    var dataLen = data.length;
    // Build the data arrays
    for (i = 0; i < dataLen; i += 1) {
        // add production data for each crop type
        crops.push({
            name: categories[i],
            y: data[i].y,
            color: data[i].color
        });
        landArea.push({
            name: categories[i],
            y: data[i].landarea,
            color: data[i].color
        });
        // yield_kg.push({
        //     name: categories[i],
        //     y: data[i].yield,
        //     color: data[i].color
        // });
        // add resource use data
        drillDataLen = data[i].drilldown.data.length;
        for (j = 0; j < drillDataLen; j += 1) {
            brightness = 0.2 - (j / drillDataLen) / 5;
            resourceUse.push({
                name: data[i].drilldown.name,
                y: data[i].drilldown.data[j],
                color: Highcharts.Color(data[i].color).brighten(brightness).get()
            });
        }
    }
    // Create the chart
    pieOptions.series[0].data = crops;
    pieOptions.series[1].data = landArea;
    // pieOptions.series[2].data = yield_kg;
    pieOptions.series[2].data = resourceUse;
    Highcharts.chart(self.$.mintChart, pieOptions);
  }
  initPieChart(obj){
      var self = this;
      var colors = HighchartsColors,
          categories = [
              "Sorghum",
              "Cassava",
              "Maize"
          ],
          data = [
              {
                  "y": 715.95,
                  "color": colors[2],
                  "drilldown": {
                      "name": "Sorghum",
                      "categories": [
                          "Fertilizer Use",
                          "Land Use"
                      ],
                      "data": [
                          34.55,
                          455.61
                      ]
                  }
              },
              {
                  "y": 131.18,
                  "color": colors[1],
                  "drilldown": {
                      "name": "Cassava",
                      "categories": [
                        "Fertilizer Use",
                        "Land Use"
                      ],
                      "data": [
                          2.74,
                          89.14
                      ]
                  }
              },
              {
                  "y": 101.68,
                  "color": colors[0],
                  "drilldown": {
                      "name": "Maize",
                      "categories": [
                        "Fertilizer Use",
                        "Land Use"
                      ],
                      "data": [
                          8.31,
                          80.53
                      ]
                  }
              },
          ],
          crops = [],
          resourceUse = [],
          i,
          j,
          dataLen = data.length,
          drillDataLen,
          brightness;
      // Build the data arrays
      for (i = 0; i < dataLen; i += 1) {
      // add production data for each crop type
          crops.push({
              name: categories[i],
              y: data[i].y,
              color: data[i].color
          });
          // add resource use data
          drillDataLen = data[i].drilldown.data.length;
          for (j = 0; j < drillDataLen; j += 1) {
              brightness = 0.2 - (j / drillDataLen) / 5;
              resourceUse.push({
                  name: data[i].drilldown.categories[j],
                  y: data[i].drilldown.data[j],
                  color: Highcharts.Color(data[i].color).brighten(brightness).get()
              });
          }
      }
      // Create the chart
      Highcharts.chart(self.$.mintChart, {
          chart: {
              type: 'pie'
          },
          title: {
              text: 'Crop Production'
          },
          subtitle: {
              text: 'Data shown is from <a href="http://workflow.isi.edu/MINT/results/20180709/precip_5_percent_inc/">http://workflow.isi.edu/MINT/results/20180709/precip_5_percent_inc/</a>'
          },
          yAxis: {
              title: {
                  text: 'Crop Production'
              }
          },
          plotOptions: {
              pie: {
                  shadow: false,
                  center: ['50%', '50%']
              }
          },
          tooltip: {
              // valueSuffix: '%'
          },
          series: [{
              name: 'Crop Production',
              data: crops,
              size: '60%',
              dataLabels: {
                  formatter: function () {
                      return this.y > 5 ? this.point.name : null;
                  },
                  color: '#ffffff',
                  distance: -30
              }
          }, {
              name: 'Resource Use',
              data: resourceUse,
              size: '80%',
              innerSize: '60%',
              dataLabels: {
                  formatter: function () {
                      // display only if larger than 1
                      return this.y > 1 ? '<b>' + this.point.name + ':</b> ' +
                          this.y + '' : null;
                  }
              },
              id: 'resources'
          }],
          responsive: {
              rules: [{
                  condition: {
                      maxWidth: 400
                  },
                  chartOptions: {
                      series: [{
                          id: 'resources',
                          dataLabels: {
                              enabled: false
                          }
                      }]
                  }
              }]
          }
      });
  }
  initBubbleChart(obj) {
      let self = this;
      $.getJSON(obj.data).done(function(json) {
          Highcharts.chart(self.$.mintChart, {
              chart: {
                  type: 'bubble',
                  plotBorderWidth: 1,
                  zoomType: 'xy'
              },

              legend: {
                  enabled: true
              },

              title: {
                  text: obj.name
              },

              xAxis: {
                  gridLineWidth: 1,
                  title: {
                      text: json.x.name
                  },
                  labels: {
                      format: '{value} ' + json.x.unit
                  },
                  plotLines: []
              },

              yAxis: {
                  startOnTick: false,
                  endOnTick: false,
                  title: {
                      text: json.y.name
                  },
                  labels: {
                      format: '{value} ' + json.y.unit
                  },
                  maxPadding: 0.2,
                  plotLines: []
              },

              tooltip: {
                  useHTML: true,
                  headerFormat: '<table>',
                  pointFormat: '<tr><th colspan="2"><h3>{series.name}</h3></th></tr>' +
                      '<tr><th>' + json.x.name + ':</th><td>{point.x} '+json.x.unit+'</td></tr>' +
                      '<tr><th>' + json.y.name + ':</th><td>{point.y} '+json.y.unit+'</td></tr>' +
                      '<tr><th>' + json.z.name + ':</th><td>{point.z} '+json.z.unit+'</td></tr>',
                  footerFormat: '</table>',
                  followPointer: true
              },

              plotOptions: {
                  series: {
                      dataLabels: {
                          enabled: true,
                          format: '{point.z}'
                      }
                  }
              },

              series: json.series

          });
      });
  }
  initHighChartForCombination(){
      let combine = `<div id="Chart1" style="width: 100%;height: 190px; margin-left: auto; margin-right: auto"></div><div id="Chart2" style="width: 100%;height: 190px; margin-left: auto; margin-right: auto"></div><div id="Chart3" style="width: 100%;height: 190px; margin-left: auto; margin-right: auto"></div><div id="Chart4" style="width: 100%;height: 190px; margin-left: auto; margin-right: auto"></div>`;
      $(this.$.mintChart).html(combine);                
      $(this.$.mintChart).find('>div').bind('mousemove touchmove touchstart', function(e) {
          var chart,
              point,
              index, // Indexes data so that the arrays all have the same positions starting at 0, which
              i, // fixed the problem with the data being misaligned even though the crosshairs were synced.
              event;
              // console.log($(this).highcharts());
          chart = $(this).highcharts();
          event = chart.pointer.normalize(e.originalEvent);

          //Find events within the charts
          point = chart.series[0].searchPoint(event, true);
          if (point) {
              index = point.index;
              for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                  let chart_i = Highcharts.charts[i];
                  if (!!chart_i) {
                    point = chart_i.series[0].points[index]
                    if (point) {
                        point.highlight(e);
                    }
                  }
              }
          }
      });
      Highcharts.Pointer.prototype.reset = function() {
        return undefined;
      };
      Highcharts.Point.prototype.highlight = function(event) {
        event = this.series.chart.pointer.normalize(event);
        this.onMouseOver(); // Show the hover marker
        // this.series.chart.tooltip.refresh(this); // Show the tooltip
        this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair
      };
      function syncExtremes(e) {
        var thisChart = this.chart;
        if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
          Highcharts.each(Highcharts.charts, function(chart) {
            if (chart !== thisChart) {
              if (chart.xAxis[0].setExtremes) { // It is null while updating
                chart.xAxis[0].setExtremes(e.min, e.max, true, true, {
                    trigger: 'syncExtremes'
                  }
                );
              }
            }
          });
        }
      }
  }
  initCombineChart() {
      this.initHighChartForCombination();
      let self = this;
         //
      // PUMP chart
      //
      
      $.getJSON("http://jonsnow.usc.edu:8081/mintmap/csv/MINT_Sorghum_Production_Baseline.json").done(function(rawData) {
          var data = []
          $.each(rawData, function(index, item) {
              data.push([Date.UTC(item[0], item[1], item[2]), item[3]])
          })
          $.getJSON("http://jonsnow.usc.edu:8081/mintmap/csv/CYCLES_Sorghum_AgBiomass_Precip10PercIncr.json").done(function(rawData) {
              var data1 = []
              $.each(rawData, function(index, item) {
                  data1.push([Date.UTC(item[0], item[1], item[2]), item[3]])
              })
              Highcharts.chart(self.$.mintChart.querySelector('#Chart1'), {
                  chart: {
                      zoomType: 'x'
                  },
                  title: {
                      text: 'Crop Production'
                  },
                  subtitle: {
                      text: 'MINT Workflow Output, CYCLES Model Output'
                  },
                  xAxis: {
                      type: 'datetime',
                      crosshair: true,
                      showFirstLabel: true,
                      showLastLabel: true,
                      tickPosition: 'inside',
                      labels: {
                          style: {
                              fontSize: '12px'
                          }
                      },
                  },
                  yAxis: {
                      title: {
                          text: 'Mkg',
                          style: {
                              fontSize: '11px'
                          },
                      },
                      min: 0,
                      max: 800,
                      tickInterval: 400 // helps force y-axis scaling to better fit data when the automatic styling doesn't fit right
                  },
                  tooltip: {
                      positioner: function() {
                          return {
                              x: this.chart.chartWidth - this.label.width - 10, // right aligned
                              y: 5
                          };
                          relativeTo: 'Chart1'
                      },
                      shared: true,
                      valueDecimals: 1,
                  },
                  credits: {
                      enabled: false
                  },
                  legend: {
                      enabled: false
                  },
                  series: [{
                      name: 'MINT Sorghum Production',
                      data: data,
                      lineWidth: 1,
                      color: '#18770b' // green
                  }, {
                      name: 'CYCLES Sorghum Agr Biomass',
                      data: data1,
                      lineWidth: 1,
                      color: '#18770b' // green
                  }],
              });
          })
      })

      $.getJSON("http://jonsnow.usc.edu:8081/mintmap/csv/CLIMIS_WPFsorghum-white-malwa3.5kg_CentralEquatoria.json").done(function(rawData) {
          var data = []
          $.each(rawData, function(index, item) {
              data.push([Date.UTC(item[0], item[1], item[2]), item[3]])
          })
          $.getJSON("http://jonsnow.usc.edu:8081/mintmap/csv/CLIMIS_WPFmaize-malwa3.5kg_CentralEquatoria.json").done(function(rawData) {
              var data1 = []
              $.each(rawData, function(index, item) {
                  data1.push([Date.UTC(item[0], item[1], item[2]), item[3]])
              })
              $.getJSON("http://jonsnow.usc.edu:8081/mintmap/csv/CLIMIS_DriedCassava-malwa3.5kg_CentralEquatoria.json").done(function(rawData) {
                  var data2 = []
                  $.each(rawData, function(index, item) {
                      data2.push([Date.UTC(item[0], item[1], item[2]), item[3]])
                  })
                  Highcharts.chart(self.$.mintChart.querySelector('#Chart2'), {
                      chart: {
                          // type: 'column',
                          zoomType: 'x'
                      },
                      title: {
                          text: 'Crop Price'
                      },
                      subtitle: {
                          text: 'CLIMIS Database'
                      },
                      xAxis: {
                          type: 'datetime',
                          crosshair: true,
                          showFirstLabel: true,
                          showLastLabel: true,
                          tickPosition: 'inside',
                          labels: {
                              style: {
                                  fontSize: '12px'
                              }
                          },
                      },
                      yAxis: {
                          title: {
                              text: 'Malawa 3.5kg',
                              style: {
                                  fontSize: '11px'
                              },
                          }
                      },
                      tooltip: {
                          positioner: function() {
                              return {
                                  x: this.chart.chartWidth - this.label.width - 10, // right aligned
                                  y: 5
                              };
                              relativeTo: 'Chart2'
                          },
                          shared: true,
                          valueDecimals: 1
                      },
                      credits: {
                          enabled: false
                      },
                      legend: {
                          enabled: false
                      },
                      series: [{
                          name: 'White Sorghum',
                          data: data,
                          lineWidth: 1,
                          color: '#a84800', // brown
                          fillOpacity: 0.4
                      }, {
                          name: 'Maize',
                          data: data1,
                          lineWidth: 1,
                          color: '#efcf00', // gold
                          fillOpacity: 0.4
                      }, {
                          name: 'Cassava',
                          data: data2,
                          lineWidth: 1,
                          color: '#a8124e', // fuschia
                          fillOpacity: 0.4
                      }],
                  });
              })
          })
      })

      $.getJSON("http://jonsnow.usc.edu:8081/mintmap/csv/CYCLES_Sorghum_Precip_Baseline_mm.json").done(function(rawData) {
          var data = []
          $.each(rawData, function(index, item) {
              data.push([Date.UTC(item[0], item[1], item[2]), item[3]])
          })
          Highcharts.chart(self.$.mintChart.querySelector('#Chart3'), {
              title: {
                  text: 'Precipitation'
              },
              subtitle: {
                  text: 'CYCLES Model Output'
              },
              chart: {
                  type: 'column',
                  zoomType: 'x'
              },
              xAxis: {
                  type: 'datetime',
                  title: {
                      text: 'Date',
                      style: {
                          fontSize: '12px'
                      },
                  },
                  crosshair: true,
                  showFirstLabel: true,
                  showLastLabel: true,
                  tickPosition: 'inside',

                  labels: {
                      style: {
                          fontSize: '12px'
                      }
                  },
              },
              yAxis: {
                  title: {
                      text: 'mm',
                      style: {
                          fontSize: '12px'
                      },
                  },
              },
              credits: {
                  enabled: false
              },
              legend: {
                  enabled: false
              },
              tooltip: {
                  positioner: function() {
                      return {
                          x: this.chart.chartWidth - this.label.width - 10, // right aligned
                          y: 5
                      };
                      relativeTo: 'Chart3'
                  },
                  shared: true,
                  valueDecimals: 1
              },
              series: [{
                  name: 'Precipitation',
                  data: data,
                  lineWidth: 1,
                  color: '#0e9ba0' // teal
              }],
          });
      })

      $.getJSON("http://jonsnow.usc.edu:8081/mintmap/csv/CYCLES_Runoff_mm-day.json").done(function(rawData) {
          var data = []
          $.each(rawData, function(index, item) {
              data.push([Date.UTC(item[0], item[1], item[2]), item[3]])
          })
          Highcharts.chart(self.$.mintChart.querySelector('#Chart4'), {
              chart: {
                  type: 'column',
                  zoomType: 'x'
              },
              title: {
                  text: 'Runoff'
              },
              subtitle: {
                  text: 'CYCLES Model Output'
              },
              xAxis: {
                  type: 'datetime',
                  crosshair: true,
                  showFirstLabel: true,
                  showLastLabel: true,
                  tickPosition: 'inside',
                  labels: {
                      style: {
                          fontSize: '12px'
                      }
                  },
              },
              yAxis: {
                  title: {
                      text: 'mm/day',
                      style: {
                          fontSize: '11px'
                      },
                  },
              },
              tooltip: {
                  positioner: function() {
                      return {
                          x: this.chart.chartWidth - this.label.width - 10, // right aligned
                          y: 5
                      };
                      relativeTo: 'Chart4'
                  },
                  shared: true,
                  valueDecimals: 1
              },
              legend: {
                  enabled: false
              },
              // credits: {   // show credits on last chart, can add text like MINT Project copyright info or something of the like
              //     enabled: false
              // },
              series: [{
                  name: 'Runoff',
                  data: data,
                  lineWidth: 1,
                  color: '#0306ba' // blue
              }],
          });
      });
  }
}

window.customElements.define('mint-chart', MintChart);
