import LGraph, { LGraphStatus } from "./LGraph"
import LGraphCanvas from "./LGraphCanvas"

export type EditorOptions = {
    skipLiveMode?: boolean;
    skipMaximize?: boolean;
    miniwindow?: boolean;
}

export interface EditorPanel extends HTMLDivElement {

}

export interface EditorMiniWindowPanel extends HTMLDivElement {
    graphCanvas: LGraphCanvas;
}

export default class Editor {
    containerId: string;
    options: EditorOptions;
    graph: LGraph;
    root: EditorPanel;
    tools: HTMLDivElement;
    content: HTMLDivElement;
    footer: HTMLDivElement;
    canvas: HTMLCanvasElement;
    graphCanvas: LGraphCanvas;
    graphCanvas2: LGraphCanvas;
    miniwindow_graphCanvas: LGraphCanvas;
    miniwindow: any;

    constructor(containerId: string, options: EditorOptions = {}) {
        //fill container
        var html = `
<div class='header'>
	<div class='tools tools-left'></div>
	<div class='tools tools-right'></div>
</div>
<div class='content'>
	<div class='editor-area'>
		<canvas class='graphCanvas' width='1000' height='500' tabindex=10></canvas>
	</div>
</div>
<div class='footer'>
	<div class='tools tools-left'></div>
	<div class='tools tools-right'></div>
</div>
`

        var root = document.createElement("div") as EditorPanel;
        this.root = root;
        root.className = "litegraph litegraph-editor";
        root.innerHTML = html;

        this.tools = root.querySelector(".tools") as HTMLDivElement;
        this.content = root.querySelector(".content") as HTMLDivElement;
        this.footer = root.querySelector(".footer") as HTMLDivElement;

        this.canvas = root.querySelector(".graphCanvas") as HTMLCanvasElement;

        //create graph
        this.graph = new LGraph();
        this.graphCanvas = new LGraphCanvas(this.canvas, this.graph);
        this.graphCanvas.background_image = "imgs/grid.png";
        this.graph.onAfterExecute = function() {
            this.graphCanvas.draw(true);
        };

        this.graphCanvas.onDropItem = this.onDropItem.bind(this);

        //add stuff
        //this.addToolsButton("loadsession_button","Load","imgs/icon-load.png", this.onLoadButton.bind(this), ".tools-left" );
        //this.addToolsButton("savesession_button","Save","imgs/icon-save.png", this.onSaveButton.bind(this), ".tools-left" );
        this.addLoadCounter();
        this.addToolsButton(
            "playnode_button",
            "Play",
            "imgs/icon-play.png",
            this.onPlayButton.bind(this),
            ".tools-right"
        );
        this.addToolsButton(
            "playstepnode_button",
            "Step",
            "imgs/icon-playstep.png",
            this.onPlayStepButton.bind(this),
            ".tools-right"
        );

        if (!options.skipLiveMode) {
            this.addToolsButton(
                "livemode_button",
                "Live",
                "imgs/icon-record.png",
                this.onLiveButton.bind(this),
                ".tools-right"
            );
        }
        if (!options.skipMaximize) {
            this.addToolsButton(
                "maximize_button",
                "",
                "imgs/icon-maximize.png",
                this.onFullscreenButton.bind(this),
                ".tools-right"
            );
        }
        if (options.miniwindow) {
            this.addMiniWindow(300, 200);
        }

        this.containerId = containerId;

        //append to DOM
        var parent = document.getElementById(this.containerId);
        if (parent) {
            parent.appendChild(root);
        }

        this.graphCanvas.resize();
        //graphCanvas.draw(true,true);
    }

    addLoadCounter() {
        var meter = document.createElement("div");
        meter.className = "headerpanel loadmeter toolbar-widget";

        var html =
            `
<div class='cpuload'>
  <strong>CPU</strong>
  <div class='bgload'>
    <div class='fgload'></div>
  </div>
</div>
<div class='gpuload'>
  <strong>GFX</strong>
  <div class='bgload'>
    <div class='fgload'></div>
  </div>
</div>
`;

        meter.innerHTML = html;
        this.root.querySelector(".header .tools-left").appendChild(meter);
        var self = this;

        setInterval(function() {
            meter.querySelector<HTMLDivElement>(".cpuload .fgload").style.width =
                2 * self.graph.execution_time * 90 + "px";
            if (self.graph.status == LGraphStatus.STATUS_RUNNING) {
                meter.querySelector<HTMLDivElement>(".gpuload .fgload").style.width =
                    self.graphCanvas.render_time * 10 * 90 + "px";
            } else {
                meter.querySelector<HTMLDivElement>(".gpuload .fgload").style.width = 4 + "px";
            }
        }, 200);
    };

    addToolsButton(id: string, name: string, icon_url: string, callback, container: string) {
        if (!container) {
            container = ".tools";
        }

        var button = this.createButton(name, icon_url, callback);
        button.id = id;
        this.root.querySelector(container).appendChild(button);
    };

    createButton(name: string, icon_url: string, callback) {
        var button = document.createElement("button");
        if (icon_url) {
            button.innerHTML = "<img src='" + icon_url + "'/> ";
        }
        button.classList.add("btn");
        button.innerHTML += name;
        if (callback)
            button.addEventListener("click", callback);
        return button;
    };

    onLoadButton() {
        var panel = this.graphCanvas.createPanel("Load session", { closable: true });
        //TO DO

        this.root.appendChild(panel);
    };

    onSaveButton() { };

    onPlayButton() {
        var graph = this.graph;
        var button = this.root.querySelector("#playnode_button");

        if (graph.status == LGraphStatus.STATUS_STOPPED) {
            button.innerHTML = "<img src='imgs/icon-stop.png'/> Stop";
            graph.start();
        } else {
            button.innerHTML = "<img src='imgs/icon-play.png'/> Play";
            graph.stop();
        }
    };

    onPlayStepButton() {
        var graph = this.graph;
        graph.runStep(1);
        this.graphCanvas.draw(true, true);
    };

    onLiveButton() {
        var is_live_mode = !this.graphCanvas.live_mode;
        this.graphCanvas.switchLiveMode(true);
        this.graphCanvas.draw();
        var url = this.graphCanvas.live_mode
            ? "imgs/gauss_bg_medium.jpg"
            : "imgs/gauss_bg.jpg";
        var button = this.root.querySelector("#livemode_button");
        button.innerHTML = !is_live_mode
            ? "<img src='imgs/icon-record.png'/> Live"
            : "<img src='imgs/icon-gear.png'/> Edit";
    };

    onDropItem(e: DragEvent) {
        var that = this;
        for (var i = 0; i < e.dataTransfer.files.length; ++i) {
            var file = e.dataTransfer.files[i];
            var ext = LGraphCanvas.getFileExtension(file.name);
            var reader = new FileReader();
            if (ext == "json") {
                reader.onload = function(_event: Event) {
                    var data = JSON.parse(reader.result as string);
                    that.graph.configure(data);
                };
                reader.readAsText(file);
            }
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        else {
            throw "Fullscreen not supported";
        }

        var self = this;
        setTimeout(function() {
            self.graphCanvas.resize();
        }, 100);
    };

    onFullscreenButton() {
        this.toggleFullscreen();
    };

    addMiniWindow(w: number, h: number) {
        if (this.miniwindow) {
            console.warn("Miniwindow already created.");
            this.miniwindow.close();
        }

        this.miniwindow = document.createElement("div") as EditorMiniWindowPanel;
        this.miniwindow.className = "litegraph miniwindow";
        this.miniwindow.innerHTML =
            "<canvas class='graphCanvas' width='" +
            w +
            "' height='" +
            h +
            "' tabindex=10></canvas>";
        var canvas = this.miniwindow.querySelector("canvas");
        var that = this;

        var graphCanvas = new LGraphCanvas(canvas, this.graph);
        graphCanvas.show_info = false;
        graphCanvas.background_image = "imgs/grid.png";
        graphCanvas.scale = 0.25;
        graphCanvas.allow_dragnodes = false;
        graphCanvas.allow_interaction = false;
        graphCanvas.render_shadows = false;
        graphCanvas.maxZoom = 0.25;
        this.miniwindow.graphCanvas = graphCanvas;
        graphCanvas.onClear = function() {
            graphCanvas.scale = 0.25;
            graphCanvas.allow_dragnodes = false;
            graphCanvas.allow_interaction = false;
        };
        graphCanvas.onRenderBackground = function(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
            ctx.strokeStyle = "#567";
            var tl = that.graphCanvas.convertOffsetToCanvas([0, 0]);
            var br = that.graphCanvas.convertOffsetToCanvas([
                that.graphCanvas.canvas.width,
                that.graphCanvas.canvas.height
            ]);
            tl = this.convertCanvasToOffset(tl);
            br = this.convertCanvasToOffset(br);
            ctx.lineWidth = 1;
            ctx.strokeRect(
                Math.floor(tl[0]) + 0.5,
                Math.floor(tl[1]) + 0.5,
                Math.floor(br[0] - tl[0]),
                Math.floor(br[1] - tl[1])
            );
        };

        this.miniwindow.style.position = "absolute";
        this.miniwindow.style.top = "4px";
        this.miniwindow.style.right = "4px";

        this.miniwindow.close = () => {
            graphCanvas.setGraph(null);
            this.miniwindow.parentNode.removeChild(this.miniwindow);
        }

        var close_button = document.createElement("div");
        close_button.className = "corner-button";
        close_button.innerHTML = "&#10060;";
        close_button.addEventListener("click", this.miniwindow.close.bind(this));
        this.miniwindow.appendChild(close_button);

        this.root.querySelector(".content").appendChild(this.miniwindow);
    };

    addMultiview() {
        var canvas = this.canvas;
        this.graphCanvas.ctx.fillStyle = "black";
        this.graphCanvas.ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.graphCanvas.viewport = [0, 0, canvas.width * 0.5 - 2, canvas.height];

        var graphCanvas2 = new LGraphCanvas(canvas, this.graph);
        graphCanvas2.background_image = "imgs/grid.png";
        this.graphCanvas2 = graphCanvas2;
        this.graphCanvas2.viewport = [canvas.width * 0.5, 0, canvas.width * 0.5, canvas.height];
    }
}
