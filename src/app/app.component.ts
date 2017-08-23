/**
 * Angular 2 decorators and services
 */
import {
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';

import { Http } from '@angular/http';
import { AppState } from './app.service';
import * as vegaliteChart from './chart/vegalite.chart';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as _ from 'lodash';

interface Dataset {
  name: string;
  files: string[];
}

interface Chart {
  name: string;
  id: string;
  spec: any;
  selected?: boolean;
  view?: any;
}

/**
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./app.component.css'],
  templateUrl: 'app.component.html'
})
export class AppComponent implements OnInit {
  public selectedDataset: Dataset;
  public datasets: Dataset[];
  public sourceCharts: Chart[];
  public resultCharts: Chart[];
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
    this.sourceCharts = [];
    this.resultCharts = [];
    event.files.forEach(d => {
      this.http.get(`assets/charts/${d}`)
        .map(res => res.json())
        .subscribe(res => {
          res.width = 180;
          res.height = 180;

          if (_.isUndefined(res.name)) {
            res.name = _(d).split(".").dropRight().join(' ');
          }
          this.sourceCharts.push({
              name: res.name,
              id: `chart-${this.chartId}`,
              spec: res,
              selected: false,
          });
          this.chartId++;
        });
    });
  }

  public selectChart(event: any) {
    let charts = _(this.sourceCharts)
                  .filter(d => d.selected)
                  .map(d => ({
                      spec: d.spec,
                      values: d.view.data('source_0'),
                  }))
                  .value();
    
    if (charts.length < 2) {
      return;
    }

    let results = [];
    if (this.selectedDataset.name === "1D + 1D = ?") {

      let data = {
          values: this.sourceCharts[0].view._runtime.data.source_0.input.value,
      };
      
      let width = 480;
      let height = 200;
      results = [{
          $schema: "https://vega.github.io/schema/vega-lite/v2.json",
          width,
          height,
          data,
          mark: "circle",
          encoding: {
            y: charts[0].spec.encoding.x,
            x: charts[1].spec.encoding.x,
            size: charts[0].spec.encoding.y
          }
        }, {
          $schema: "https://vega.github.io/schema/vega-lite/v2.json",
          width,
          height,
          data,
          mark: "rect",
          encoding: {
            y: charts[0].spec.encoding.x,
            x: charts[1].spec.encoding.x,
            color: _.assign({}, charts[0].spec.encoding.y, {"scale": { "scheme": "greenblue"}})
          }
        }];
    } else {
      results = vegaliteChart.mergeCharts(charts);
    }

    this.resultCharts = _.map(results, (d, i) => ({
        name: '',
        id: `chart-result-${i}`,
        spec: d,
    }));
  }

  public onChartRendered(chart: Chart, view: any) {
    chart.view = view;
  }
}

/**
 * Please review the https://github.com/AngularClass/angular2-examples/ repo for
 * more angular app examples that you may copy/paste
 * (The examples may not be updated as quickly. Please open an issue on github for us to update it)
 * For help or questions please contact us at @AngularClass on twitter
 * or our chat on Slack at https://AngularClass.com/slack-join
 */
