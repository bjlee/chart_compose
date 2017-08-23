import * as _ from 'lodash';

type ISpec = any;

let $schema: string = "https://vega.github.io/schema/vega-lite/v2.json";

// ToDo:
// other encodings (ex) size, color, shape, opacity, detail, ...)
function aggregateCharts(width, height, data, mark, x, y, aggregate): ISpec {
    return {
        $schema,
        width,
        height,
        data,
        mark,
        encoding: {
            x,
            y: _.assign({}, y, {aggregate})
        }
    };
}

function boxplot(width, height, data, x, y): ISpec {
    return {
        $schema,
        width,
        height,
        data,
        layer: [
            {
                mark: "rule",
                encoding: {
                    x,
                    y: _.assign({}, y, {aggregate: "min"}),
                    y2: _.assign({}, y, {aggregate: "max"}),
                }
            },
            {
                mark: "tick",
                encoding: {
                    x,
                    y: _.assign({}, y, {aggregate: "min"}),
                    size: {value: 5}
              }
            },
            {
                mark: "tick",
                encoding: {
                    x,
                    y: _.assign({}, y, {aggregate: "max"}),
                    size: {value: 5}
              }
            },
            {
                mark: "point",
                encoding: {
                    x,
                    y: _.assign({}, y, {aggregate: "mean"}),
                    size: {value: 2}
              }
            }
        ]
    };
}
 
function stackedChart(width, height, data, mark, x, y): ISpec {
    return {
        $schema,
        width,
        height,
        data,
        mark,
        encoding: {
            x,
            y: _.assign({}, y, {aggregate: "sum"}),
            color: { 
                field: "$chart_idx",
                type: "nominal"
            }
        }
    };
}

function groupedBarChart(data, x, y): ISpec {
    return {
        $schema,
        data,
        mark: "bar",
        encoding: {
            column: x,
            x: {
                field: "$chart_idx",
                type: "nominal",
                axis: { title: "" },
                scale: { rangeStep: 10 }
            },
            y: y,
            color: { 
                field: "$chart_idx",
                type: "nominal"
            }
        }
    };
}

function multiSeriesLineChart(width, height, data, x, y): ISpec {
    return {
        $schema,
        width,
        height,
        data,
        mark: "line",
        encoding: {
            x,
            y: y,
            color: { 
                field: "$chart_idx",
                type: "nominal"
            }
        }
    };
}

function streamGraph(width, height, data, x, y): ISpec {
    return {
        $schema,
        width,
        height,
        data,
        mark: "area",
        encoding: {
            x,
            y: _.assign({}, y, {
                aggregate: "sum",
                axis: null,
                stack: "center"
            }),
            color: { 
                field: "$chart_idx",
                type: "nominal"
            }
        }
    };
}

function scatterPlot(width, height, data, x, y): ISpec {
    return {
        $schema,
        width,
        height,
        data,
        mark: "point",
        encoding: {
            x: x,
            y: y,
            color: { 
                field: "$chart_idx",
                type: "nominal"
            }
        }
    };
}

function densityPlot(width, height, data, x, y): ISpec {
    return {
        $schema,
        width,
        height,
        data,
        mark: "rect",
        encoding: {
            x: x.type === "nominal" || x.type === "ordinal" ? x : _.assign({}, x, {bin: {maxbins: 5}}),
            y: _.assign({}, y, {bin: {maxbins: 5}}),
            color: { 
                aggregate: "count",
                type: "quantitative",
                scale: { scheme: "greenblue"}
            }
        },
        config: {
            cell: { stroke: "transparent" }
        }
    };
}
  
export function mergeCharts(charts: {spec: ISpec, values: any[]}[]): ISpec[] {
    if (_.isEmpty(charts)) {
        return [];
    }
    // Match Schemas
    console.log(charts);

    // extract common or unique encodings
    // let encodings = _.map(specs, d => d.encoding);
    // let keys = _(encodings).flatMap(d => _.keys(d)).uniq().value();
    // let commonKeys = _(encodings).map(d => _.keys(d)).intersection().value();

    let data = {
        values: _.flatMap(charts, (d, i) => 
                    _.map(d.values, v => 
                        _.assign({}, v, {"$chart_idx": d.spec.name})))
    };
    
    let width = 180;
    let height = 180;
    let x = charts[0].spec.encoding.x;
    let y = charts[0].spec.encoding.y;
    let mark = charts[0].spec.mark;
    let marks = _(charts).map(d => d.spec.mark).uniq().value();
    // aggregation sum
    // aggregation sum
    // switch (mark):
    // bar:
    //      stacked bar chart, grouped bar chart
    // line:
    //      overlay line chart, stacked area chart, steamgraph
    // point || circle || square:
    let ret = [];
    if (marks.length > 1) {
        ret = _.map(marks, d => aggregateCharts(width, height, data, d, x, y, "sum"));
        ret.push(scatterPlot(width, height, data, x, y));
        ret.push(densityPlot(width, height, data, x, y));
    } else {
        switch (x.type) {
            case "nominal":
            case "ordinal":
            case "temporal":
            switch(y.type) {
                case "nominal":
                case "ordinal":
                case "temporal":
                break;

                case "quantitative":
                ret.push(aggregateCharts(width, height, data, mark, x, y, "sum"));
                ret.push(aggregateCharts(width, height, data, mark, x, y, "mean"));
                ret.push(boxplot(width, height, data, x, y));

                switch(mark) {
                    case "bar":
                    ret.push(stackedChart(width, height, data, mark, x, y));
                    ret.push(groupedBarChart(data, x, y));
                    break;

                    case "line":
                    ret.push(multiSeriesLineChart(width, height, data, x, y));
                    ret.push(stackedChart(width, height, data, "area", x, y));
                    ret.push(streamGraph(width, height, data, x, y));
                    break;

                    case "area":
                    ret.push(stackedChart(width, height, data, mark, x, y));
                    ret.push(streamGraph(width, height, data, x, y));
                    break;
                }

                ret.push(scatterPlot(width, height, data, x, y));
                ret.push(densityPlot(width, height, data, x, y));
                break;
            }
            break;

            case "quantitative":
            switch(y.type) {
                case "nominal":
                case "ordinal":
                case "temporal":
                break;

                case "quantitative":
                ret.push(scatterPlot(width, height, data, x, y));
                ret.push(densityPlot(width, height, data, x, y));
                break;
            }
            break;
        }
    }

    return ret;
}

  // todo: bin steps