/**
 * Angular 2 decorators and services
 */
import {
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { Http, Response} from '@angular/http';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { AppState } from './app.service';
import * as _ from 'lodash';

interface Dataset {
  name: string;
  files: string[];
}

interface Chart {
  name: string;
  id: string;
  spec: any;
  selected: boolean;
}

let vega = require('vega');
let vega_embed = require('vega-embed');
/**
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app',
  encapsulation: ViewEncapsulation.None,
  styleUrls: [
    './app.component.css'
  ],
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {
  public selectedDataset: Dataset;
  public datasets: Dataset[];
  public charts: Chart[];
  private chartId: number = 0;

  constructor(
    public appState: AppState,
    private http: Http
  ) {}

  public ngOnInit() {
    console.log('Initial App State', this.appState.state);

    this.selectedDataset = null;

    this.http.get('assets/charts/datasets.json')
      .map(res => res.json())
      .subscribe(res => this.datasets = res);
  }

  public loadDataset(event: Dataset) {
    this.charts = [];
    event.files.forEach(d => {
      this.http.get(`assets/charts/${d}`)
        .map(res => res.json())
        .subscribe(res => {
          this.charts.push({
            name: d,
            id: `chart-${this.chartId}`,
            spec: res,
            selected: false,
          });
          this.chartId++;
        });
    });
  }

  public selectChart(event: any) {
    let selectedCharts = this.charts.filter(d => d.selected);
    let specs = _.map(selectedCharts, d => d.spec);
    vega_embed("#chart_result", {
        "$schema": "https://vega.github.io/schema/vega-lite/v2.json",
        "vconcat": [
          accumulateCategoricalValues(specs),
          stackCategoricalValues(specs),
          groupCategoricalValues(specs),
          scatterplotCategoricalValues(specs),
          //densityplotCategoricalValues(specs)
        ]
      }, {
        actions: false
    });
  }
}

function accumulateCategoricalValues(specs: any[]): any {
  return {
    data: { values: _.flatMap(specs, d => d.data.values) },
    mark: "bar",
    encoding: {
      x: specs[0].encoding.x,
      y: _.assign(specs[0].encoding.y, {"aggregate": "sum"})
    }
  }
}

function stackCategoricalValues(specs: any[]): any {
  return {
    data: { 
      values: _.flatMap(specs, (d, i) => 
        _.map(d.data.values, v => 
          _.assign(v, {"$chart_idx": i})))
    },
    mark: "bar",
    encoding: {
      x: specs[0].encoding.x,
      y: _.assign(specs[0].encoding.y, {"aggregate": "sum"}),
      color: { 
        field: "$chart_idx",
        type: "nominal"
      }
    }
  }
}

function groupCategoricalValues(specs: any[]): any {
  return {
    data: { 
      values: _.flatMap(specs, (d, i) => 
        _.map(d.data.values, v => 
          _.assign(v, {"$chart_idx": i})))
    },
    mark: "bar",
    encoding: {
      column: specs[0].encoding.x,
      x: {
        field: "$chart_idx",
        type: "nominal",
        scale: {rangeStep: 12},
        axis: {title: ""}
      },
      y: _.assign(specs[0].encoding.y, {"aggregate": "sum"}),
      color: { 
        field: "$chart_idx",
        type: "nominal"
      }
    }
  }
}

function scatterplotCategoricalValues(specs: any[]): any {
  return {
    data: { 
      values: _.flatMap(specs, (d, i) => 
        _.map(d.data.values, v => 
          _.assign(v, {"$chart_idx": i})))
    },
    mark: "point",
    encoding: {
      x: specs[0].encoding.x,
      y: specs[0].encoding.y,
      color: { 
        field: "$chart_idx",
        type: "nominal"
      }
    }
  }
}

function densityplotCategoricalValues(specs: any[]): any {
  return {
    data: { 
      values: _.flatMap(specs, (d, i) => 
        _.map(d.data.values, v => 
          _.assign(v, {"$chart_idx": i})))
    },
    mark: "rect",
    encoding: {
      x: specs[0].encoding.x,
      y: _.assign(specs[0].encoding.y, {
        bin: { maxbins: 10 }
      }),
      color: { 
        aggregate: "count",
        type: "quantitative"
      }
    },
    config: {
      range: {
        heatmap: { scheme: "greenblue" }
      },
      cell: { stroke: "transparent" }
    }
  }
}

/**
 * Please review the https://github.com/AngularClass/angular2-examples/ repo for
 * more angular app examples that you may copy/paste
 * (The examples may not be updated as quickly. Please open an issue on github for us to update it)
 * For help or questions please contact us at @AngularClass on twitter
 * or our chat on Slack at https://AngularClass.com/slack-join
 */
