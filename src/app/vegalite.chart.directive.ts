import {Directive, ElementRef, Input, OnInit} from '@angular/core';

let vega = require('vega');
let vega_embed = require('vega-embed');

@Directive({ selector: '[vegaLiteChart]' })
export class VegaLiteChartDirective implements OnInit {
    @Input() public id: string;
    @Input() public spec: any;
    constructor(private el: ElementRef) {}

    public ngOnInit() {
        this.el.nativeElement.id = this.id;
        vega_embed(`#${this.id}`, this.spec, {actions: false});
    }
}