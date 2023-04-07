import { LiteGraph, LGraph, LGraphStatus, LGraphCanvas } from "@litegraph-ts/core"
import { ConstantNumber, Watch } from "@litegraph-ts/nodes-basic"

// Include litegraph's css, required for the UI to function properly
import "@litegraph-ts/core/css/litegraph.css"

// Grab canvas element from the index.html
const root = document.getElementById("main") as HTMLDivElement;
const canvas = root.querySelector<HTMLCanvasElement>(".graphCanvas");

// Setup graph (nodes/logic) and graph canvas (rendering/canvas/UI)
const graph = new LGraph();
const graphCanvas = new LGraphCanvas(canvas, graph);
graphCanvas.background_image = "imgs/grid.png";
(window as any).graph = graph;
(window as any).graphCanvas = graphCanvas;

// Refresh graph on every draw tick in a loop
graph.onAfterExecute = () => {
    graphCanvas.draw(true);
};

// Create a ConstantNumber, sends a constant number on its output
var constNumber = LiteGraph.createNode(ConstantNumber);
constNumber.pos = [200, 200];
constNumber.setValue(4.5);

// Create a Watch, displays input value on its panel
var watch = LiteGraph.createNode(Watch);
watch.pos = [600, 300];

// Add components to the graph
graph.add(constNumber);
graph.add(watch);

// Connect the first output of the number (output 0) to the first input of the watch (input 0)
constNumber.connect(0, watch, 0);

// Begin executing logic on the graph
graph.start();
