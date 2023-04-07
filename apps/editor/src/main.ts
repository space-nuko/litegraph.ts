import { LiteGraph } from "@litegraph-ts/core";
import Editor from "./Editor"
import configure from "./configure"

import { demo } from "./demos"

import "litegraph-ts/css/litegraph.css"
import "../css/litegraph-editor.css"

interface OptionElemExt extends HTMLOptionElement {
    callback?: () => void;
}

const isMobile = false;
configure(isMobile);

LiteGraph.debug = false
LiteGraph.node_images_path = "litegraph-ts/nodes_data"

const editor = new Editor("main", { miniwindow: false });
editor.graphCanvas.pause_rendering = false;
(window as any).editor = editor;

window.addEventListener("resize", () => {
    editor.graphCanvas.resize();
});

//window.addEventListener("keydown", editor.graphcanvas.processKey.bind(editor.graphcanvas) );

window.onbeforeunload = () => {
    const data = JSON.stringify(editor.graph.serialize());
    localStorage.setItem("litegraph demo backup", data);
}

//create scene selector
const elem = document.createElement("span") as HTMLSpanElement;
elem.id = "LGEditorTopBarSelector";
elem.className = "selector";
elem.innerHTML = `
Demo
<select>
	<option>Empty</option>
</select>
<button class='btn' id='save'>Save</button>
<button class='btn' id='load'>Load</button>
<button class='btn' id='download'>Download</button>
|
<button class='btn' id='webgl'>WebGL</button>
<button class='btn' id='multiview'>Multiview</button>
`;
editor.tools.appendChild(elem);

const select = elem.querySelector<HTMLSelectElement>("select")!;

select.addEventListener("change", function(_e) {
    var option = this.options[this.selectedIndex] as OptionElemExt;
    var url = option.dataset["url"];

    if (url)
        editor.graph.load(url);
    else if (option.callback)
        option.callback();
    else
        editor.graph.clear();
});

elem.querySelector<HTMLButtonElement>("#save")!.addEventListener("click", () => {
    console.log("saved");
    localStorage.setItem("graphdemo_save", JSON.stringify(editor.graph.serialize()));
});

elem.querySelector<HTMLButtonElement>("#load")!.addEventListener("click", () => {
    var data = localStorage.getItem("graphdemo_save");
    if (data)
        editor.graph.configure(JSON.parse(data));
    console.log("loaded");
});

elem.querySelector<HTMLButtonElement>("#download")!.addEventListener("click", () => {
    var data = JSON.stringify(editor.graph.serialize());
    var file = new Blob([data]);
    var url = URL.createObjectURL(file);
    var element = document.createElement("a");
    element.setAttribute('href', url);
    element.setAttribute('download', "graph.JSON");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setTimeout(() => { URL.revokeObjectURL(url); }, 1000 * 60); //wait one minute to revoke url
});

elem.querySelector<HTMLButtonElement>("#webgl")!.addEventListener("click", enableWebGL);
elem.querySelector<HTMLButtonElement>("#multiview")!.addEventListener("click", () => { editor.addMultiview() });

function addDemo(name: string, url: string | (() => void)) {
    var option = document.createElement("option") as OptionElemExt;
    if (typeof url === "string")
        option.dataset["url"] = url;
    else if (typeof url === "function")
        option.callback = url;
    option.innerHTML = name;
    select.appendChild(option);
}

//some examples
addDemo("Features", "examples/features.json");
addDemo("Benchmark", "examples/benchmark.json");
addDemo("Subgraph", "examples/subgraph.json");
addDemo("Audio", "examples/audio.json");
addDemo("Audio Delay", "examples/audio_delay.json");
addDemo("Audio Reverb", "examples/audio_reverb.json");
addDemo("MIDI Generation", "examples/midi_generation.json");
addDemo("autobackup", function() {
    var data = localStorage.getItem("litegraphg demo backup");
    if (!data)
        return;
    var graph_data = JSON.parse(data);
    editor.graph.configure(graph_data);
});

// let webgl_canvas: HTMLCanvasElement | null = null;

//allows to use the WebGL nodes like textures
function enableWebGL() {
    // if (webgl_canvas) {
    //     webgl_canvas.style.display = (webgl_canvas.style.display == "none" ? "block" : "none");
    //     return;
    // }

    // var libs = [
    //     "js/libs/gl-matrix-min.js",
    //     "js/libs/litegl.js",
    //     "../src/nodes/gltextures.js",
    //     "../src/nodes/glfx.js",
    //     "../src/nodes/glshaders.js",
    //     "../src/nodes/geometry.js"
    // ];

    // function fetchJS() {
    //     if (libs.length == 0)
    //         return on_ready();

    //     var script = null;
    //     script = document.createElement("script") as HTMLScriptElement;
    //     script.onload = fetchJS;
    //     script.src = libs.shift() as string;
    //     document.head.appendChild(script);
    // }

    // fetchJS();

    // function on_ready() {
    // console.log(this.src);
    // if (!window.GL)
    //     return;
    // webgl_canvas = document.createElement("canvas");
    // webgl_canvas.width = 400;
    // webgl_canvas.height = 300;
    // webgl_canvas.style.position = "absolute";
    // webgl_canvas.style.top = "0px";
    // webgl_canvas.style.right = "0px";
    // webgl_canvas.style.border = "1px solid #AAA";

    // webgl_canvas.addEventListener("click", function() {
    //     var rect = webgl_canvas.parentNode.getBoundingClientRect();
    //     if (webgl_canvas.width != rect.width) {
    //         webgl_canvas.width = rect.width;
    //         webgl_canvas.height = rect.height;
    //     }
    //     else {
    //         webgl_canvas.width = 400;
    //         webgl_canvas.height = 300;
    //     }
    // });

    // var parent = document.querySelector(".editor-area");
    // parent.appendChild(webgl_canvas);
    // var gl = GL.create({ canvas: webgl_canvas });
    // if (!gl)
    //     return;

    // editor.graph.onBeforeStep = ondraw;

    // console.log("webgl ready");
    // function ondraw() {
    //     gl.clearColor(0, 0, 0, 0);
    //     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // }
    // }
}

demo(editor.graph);
