import { LGraph, LGraphAddNodeOptions, LGraphNode, LGraphRemoveNodeOptions, LiteGraph, Subgraph } from "@litegraph-ts/core"
import { Watch } from "@litegraph-ts/nodes-basic"
import { expect, vi } from 'vitest'
import UnitTest from "../UnitTest"

class CustomGraph extends LGraph {
    addedCalls = []
    removedCalls = []

    override onNodeAdded(node: LGraphNode, options: LGraphAddNodeOptions) {
        expect(this.constructor.name).toEqual("CustomGraph")
        expect(node).toBeTruthy();
        this.addedCalls.push(options)
    }

    override onNodeRemoved(node: LGraphNode, options: LGraphRemoveNodeOptions) {
        expect(this.constructor.name).toEqual("CustomGraph")
        expect(node).toBeTruthy();
        this.removedCalls.push(options)
    }
}

export default class SubgraphTests extends UnitTest {
    test__hooksCustomGraphClass() {
        const customGraph = new CustomGraph();

        const spy = vi.spyOn(customGraph, "onNodeAdded")

        const factory = () => customGraph;
        const graph = new LGraph();
        const subgraph = LiteGraph.createNode(Subgraph, null, { constructorArgs: [factory] })

        graph.add(subgraph)

        const node = LiteGraph.createNode(Watch);
        subgraph.subgraph.add(node)

        expect(spy).toHaveBeenCalledOnce();
        expect(customGraph.addedCalls).toHaveLength(1);
    }

    test__serialize__serializesCorrectly() {
        const graph = new LGraph();

        const nodeA = LiteGraph.createNode(Watch)
        const nodeB = LiteGraph.createNode(Watch)
        const nodeC = LiteGraph.createNode(Watch)

        const subgraphA = LiteGraph.createNode(Subgraph)
        const subgraphB = LiteGraph.createNode(Subgraph)

        graph.add(subgraphA)
        subgraphA.subgraph.add(subgraphB)
        subgraphB.subgraph.add(nodeA)
        subgraphA.subgraph.add(nodeB);
        graph.add(nodeC);

        const last_node_id = graph.last_node_id

        const data = graph.serialize();
        const restored = new LGraph();
        restored.configure(data)

        expect(restored.last_node_id).toEqual(last_node_id)
        expect(restored._is_subgraph).toEqual(false)
        expect(restored._subgraph_node).toEqual(null)

        const restoredSubgraphA = restored.getNodeById<Subgraph>(subgraphA.id)
        expect(restoredSubgraphA).toBeDefined()
        expect(restoredSubgraphA.subgraph).toBeDefined()
        expect(restoredSubgraphA.subgraph._is_subgraph).toEqual(true)
        expect(restoredSubgraphA.subgraph._subgraph_node).toEqual(restoredSubgraphA)

        const restoredSubgraphB = restoredSubgraphA.subgraph.getNodeById<Subgraph>(subgraphB.id)
        expect(restoredSubgraphB).toBeDefined()
        expect(restoredSubgraphB.subgraph).toBeDefined()
        expect(restoredSubgraphB.subgraph._is_subgraph).toEqual(true)
        expect(restoredSubgraphB.subgraph._subgraph_node).toEqual(restoredSubgraphB)

        const restoredNodeA = restoredSubgraphB.subgraph.getNodeById<Watch>(nodeA.id)
        expect(restoredNodeA).toBeDefined()
        expect(restoredNodeA.subgraph).toBeNull()
    }

    test__onSubgraphTypeChange_detectsInputTypeChanges() {
        const graph = new LGraph();

        const subgraph = LiteGraph.createNode(Subgraph)
        graph.add(subgraph)

        const inputPair = subgraph.addGraphInput("test1", "string");
        subgraph.subgraph.setInputData("test1", "foo")

        expect(subgraph.inputs[0]).toBeDefined();
        expect(subgraph.inputs[0].name).toEqual("test1");
        expect(subgraph.inputs[0].type).toEqual("string");
        expect(subgraph.subgraph.inputs["test1"]).toBeDefined()
        expect(subgraph.subgraph.inputs["test1"].name).toEqual("test1")
        expect(subgraph.subgraph.inputs["test1"].type).toEqual("string")
        expect(subgraph.subgraph.inputs["test1"].value).toEqual("foo")

        inputPair.innerNode.setProperty("type", "boolean")

        expect(subgraph.inputs[0].name).toEqual("test1");
        expect(subgraph.inputs[0].type).toEqual("boolean");
        expect(subgraph.subgraph.inputs["test1"].name).toEqual("test1")
        expect(subgraph.subgraph.inputs["test1"].type).toEqual("boolean")
        expect(subgraph.subgraph.inputs["test1"].value).toEqual("foo") // XXX data not changed
    }

    test__onSubgraphTypeChange_detectsOutputTypeChanges() {
        const graph = new LGraph();

        const subgraph = LiteGraph.createNode(Subgraph)
        graph.add(subgraph)

        const outputPair = subgraph.addGraphOutput("test1", "string");
        subgraph.subgraph.setOutputData("test1", "foo")

        expect(subgraph.outputs[0]).toBeDefined();
        expect(subgraph.outputs[0].name).toEqual("test1");
        expect(subgraph.outputs[0].type).toEqual("string");
        expect(subgraph.subgraph.outputs["test1"]).toBeDefined()
        expect(subgraph.subgraph.outputs["test1"].name).toEqual("test1")
        expect(subgraph.subgraph.outputs["test1"].type).toEqual("string")
        expect(subgraph.subgraph.outputs["test1"].value).toEqual("foo")

        outputPair.innerNode.setProperty("type", "boolean")

        expect(subgraph.outputs[0].name).toEqual("test1");
        expect(subgraph.outputs[0].type).toEqual("boolean");
        expect(subgraph.subgraph.outputs["test1"].name).toEqual("test1")
        expect(subgraph.subgraph.outputs["test1"].type).toEqual("boolean")
        expect(subgraph.subgraph.outputs["test1"].value).toEqual("foo") // XXX data not changed
    }

    test__getInnerGraphInput() {
        const graph = new LGraph();

        const subgraph = LiteGraph.createNode(Subgraph)
        graph.add(subgraph)

        const inputPair = subgraph.addGraphInput("test1", "string");
        subgraph.addGraphInput("test2", "string");

        expect(inputPair.innerNode.properties.subgraphID).toEqual(subgraph.id)
        expect(inputPair.innerNode.getParentSubgraph()).toEqual(subgraph)

        expect(subgraph.getInnerGraphInput("test3")).toEqual(null);
        expect(subgraph.getInnerGraphInputByIndex(2)).toEqual(null);
        expect(subgraph.getInnerGraphInput("test1")).toEqual(inputPair.innerNode);
        expect(subgraph.getInnerGraphInputByIndex(0)).toEqual(inputPair.innerNode);
    }

    test__getInnerGraphOutput() {
        const graph = new LGraph();

        const subgraph = LiteGraph.createNode(Subgraph)
        graph.add(subgraph)

        const outputPair = subgraph.addGraphOutput("test1", "string");
        subgraph.addGraphOutput("test2", "string");

        expect(outputPair.innerNode.properties.subgraphID).toEqual(subgraph.id)
        expect(outputPair.innerNode.getParentSubgraph()).toEqual(subgraph)

        expect(subgraph.getInnerGraphOutput("test3")).toEqual(null);
        expect(subgraph.getInnerGraphOutputByIndex(2)).toEqual(null);
        expect(subgraph.getInnerGraphOutput("test1")).toEqual(outputPair.innerNode);
        expect(subgraph.getInnerGraphOutputByIndex(0)).toEqual(outputPair.innerNode);
    }

    test__onSubgraphNodeAdded__bubblesUp() {
        const rootGraph = new CustomGraph();
        const graphA = new CustomGraph();
        const graphB = new CustomGraph();
        const graphC = new CustomGraph();

        const subgraphA = LiteGraph.createNode(Subgraph, null, { constructorArgs: [() => graphA] })
        const subgraphB = LiteGraph.createNode(Subgraph, null, { constructorArgs: [() => graphB] })
        const subgraphC = LiteGraph.createNode(Subgraph, null, { constructorArgs: [() => graphC] })

        rootGraph.add(subgraphA)
        subgraphA.subgraph.add(subgraphB)
        subgraphB.subgraph.add(subgraphC)

        const watch = LiteGraph.createNode(Watch)
        subgraphC.subgraph.add(watch)

        expect(rootGraph.addedCalls).toHaveLength(4);
        expect(graphA.addedCalls).toHaveLength(3);
        expect(graphB.addedCalls).toHaveLength(2);
        expect(graphC.addedCalls).toHaveLength(1);
    }

    test__onSubgraphNodeRemoved__bubblesUp() {
        const rootGraph = new CustomGraph();
        const graphA = new CustomGraph();
        const graphB = new CustomGraph();
        const graphC = new CustomGraph();

        const subgraphA = LiteGraph.createNode(Subgraph, null, { constructorArgs: [() => graphA] })
        const subgraphB = LiteGraph.createNode(Subgraph, null, { constructorArgs: [() => graphB] })
        const subgraphC = LiteGraph.createNode(Subgraph, null, { constructorArgs: [() => graphC] })

        rootGraph.add(subgraphA)
        subgraphA.subgraph.add(subgraphB)
        subgraphB.subgraph.add(subgraphC)

        expect(rootGraph.removedCalls).toHaveLength(0);
        expect(graphA.removedCalls).toHaveLength(0);
        expect(graphB.removedCalls).toHaveLength(0);
        expect(graphC.removedCalls).toHaveLength(0);

        const watch = LiteGraph.createNode(Watch)
        subgraphC.subgraph.add(watch)
        subgraphC.subgraph.remove(watch)

        expect(rootGraph.removedCalls).toHaveLength(1);
        expect(graphA.removedCalls).toHaveLength(1);
        expect(graphB.removedCalls).toHaveLength(1);
        expect(graphC.removedCalls).toHaveLength(1);
    }
}
