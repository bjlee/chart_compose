import {Directive, ElementRef, Input, Output, EventEmitter, OnInit} from '@angular/core';

let vega = require('vega');
let vega_lite = require('vega-lite');
let vega_embed = require('vega-embed');

@Directive({ selector: '[vegaLiteChart]' })
export class VegaLiteChartDirective implements OnInit {
    @Input() public id: string;
    @Input() public spec: any;
    @Output() public onRendered = new EventEmitter<any>();

    constructor(private el: ElementRef) {}

    public ngOnInit() {
        this.el.nativeElement.id = this.id;
        let embed = vega_embed(`#${this.id}`, this.spec, {actions: false});
        //let embed = vega_embed(`#${this.id}`, this.spec, {actions: true});
        embed.then(res => {
            this.onRendered.emit(res.view);
        });
    }
}