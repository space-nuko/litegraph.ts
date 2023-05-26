import { BuiltInSlotType, GraphIDMapping, GraphInput, GraphOutput, LGraph, LGraphAddNodeOptions, LGraphNode, LGraphNodeCloneData, LGraphRemoveNodeOptions, LiteGraph, NodeID, SlotLayout, Subgraph } from "@litegraph-ts/core"
import { ConstantInteger, Watch } from "@litegraph-ts/nodes-basic"
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

interface CustomSavedIDNodeProperties extends Record<string, any> {
    subgraphID: NodeID | null
}

class CustomSavedIDNode extends LGraphNode {
    properties: CustomSavedIDNodeProperties = {
        subgraphID: null
    }

    override onAdded(graph: LGraph) {
        if (graph._is_subgraph) {
            this.properties.subgraphID = graph._subgraph_node.id
        }
    }

    override onReassignID(mapping: GraphIDMapping) {
        if (this.properties.subgraphID) {
            this.properties.subgraphID = mapping.nodeIDs[this.properties.subgraphID]
        }
    }
}

LiteGraph.registerNodeType({
    class: CustomSavedIDNode,
    title: "Custom Saved ID",
    desc: "Node that saves a node ID to its properties",
    type: "test/custom_saved_id"
})

class CustomTriggerNode extends LGraphNode {
    static slotLayout: SlotLayout = {
        inputs: [
            { name: "action", type: BuiltInSlotType.ACTION },
        ],
        outputs: [
            { name: "event", type: BuiltInSlotType.EVENT },
        ],
    }

    triggers: [any, any][] = [];

    override onAction(action: any, param: any) {
        this.triggers.push([action, param])
        this.triggerSlot(0, param);
    }
}

LiteGraph.registerNodeType({
    class: CustomTriggerNode,
    title: "Custom Trigger Node",
    desc: "Node that tracks action triggers",
    type: "test/custom_trigger_node"
})

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

    test__addGraphInput__addsEverything() {
        const graph = new LGraph();

        const subgraph = LiteGraph.createNode(Subgraph)
        graph.add(subgraph)

        const inputPair = subgraph.addGraphInput("test1", "string");
        expect(subgraph.inputs[inputPair.outerInputIndex]).toEqual(inputPair.outerInput)
        expect(inputPair.innerNode.graph).toEqual(subgraph.subgraph)
    }

    test__addGraphOutput__addsEverything() {
        const graph = new LGraph();

        const subgraph = LiteGraph.createNode(Subgraph)
        graph.add(subgraph)

        const outputPair = subgraph.addGraphOutput("test1", "string");
        expect(subgraph.outputs[outputPair.outerOutputIndex]).toEqual(outputPair.outerOutput)
        expect(outputPair.innerNode.graph).toEqual(subgraph.subgraph)
    }

    test__onSubgraphTypeChange__detectsInputTypeChanges() {
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

        inputPair.innerNode.setProperty("type", "boolean")

        expect(subgraph.inputs[0].name).toEqual("test1");
        expect(subgraph.inputs[0].type).toEqual("boolean");
        expect(subgraph.subgraph.inputs["test1"].name).toEqual("test1")
        expect(subgraph.subgraph.inputs["test1"].type).toEqual("boolean")
        expect(subgraph.subgraph.inputs["test1"].value).toEqual("foo") // XXX data not changed
    }

    test__onSubgraphTypeChange__detectsOutputTypeChanges() {
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

    test__clone__reassignsNewIds() {
        if (!LiteGraph.use_uuids)
            return;

        const graph = new LGraph();

        const node = LiteGraph.createNode(Watch)

        const subgraph = LiteGraph.createNode(Subgraph)

        graph.add(subgraph)
        subgraph.subgraph.add(node)

        const idSubgraph = subgraph.id
        const idNode = node.id

        const clonedSubgraph = subgraph.clone();

        expect(clonedSubgraph.id).not.toEqual(idSubgraph)
        expect(clonedSubgraph.subgraph._nodes).toHaveLength(1);
        expect(clonedSubgraph.subgraph._nodes[0].id).not.toEqual(idNode)
    }

    test__clone__reassignsNewIdsRecursively() {
        if (!LiteGraph.use_uuids)
            return;

        const graph = new LGraph();

        const node = LiteGraph.createNode(CustomSavedIDNode)

        const subgraphA = LiteGraph.createNode(Subgraph)
        const subgraphB = LiteGraph.createNode(Subgraph)

        graph.add(subgraphA)
        subgraphA.subgraph.add(subgraphB)
        subgraphB.subgraph.add(node)

        const idSubgraphA = subgraphA.id
        const idSubgraphB = subgraphB.id
        const idNode = node.id

        expect(node.properties.subgraphID).toEqual(idSubgraphB)

        const clonedSubgraph = subgraphA.clone();

        expect(clonedSubgraph.id).not.toEqual(idSubgraphA)
        expect(clonedSubgraph.subgraph._nodes).toHaveLength(1);
        expect(clonedSubgraph.subgraph._nodes[0].id).not.toEqual(idSubgraphB)
        expect(clonedSubgraph.subgraph._nodes[0].subgraph._nodes).toHaveLength(1)
        const clonedSubgraphB = clonedSubgraph.subgraph._nodes[0]
        expect(clonedSubgraphB.subgraph._nodes[0].id).not.toEqual(idNode)
        expect(clonedSubgraphB.subgraph._nodes[0].properties.subgraphID).toEqual(clonedSubgraphB.id)
    }

    test__clone__reconnectsInnerNodes() {
        const graph = new LGraph();

        const nodeA = LiteGraph.createNode(ConstantInteger)
        const nodeB = LiteGraph.createNode(Watch)

        const subgraph = LiteGraph.createNode(Subgraph)

        graph.add(subgraph)
        subgraph.subgraph.add(nodeA)
        subgraph.subgraph.add(nodeB)

        expect(nodeA.type).toEqual("basic/integer")
        expect(nodeA.getOutputLinks(0)).toHaveLength(0)
        expect(nodeB.type).toEqual("basic/watch")
        expect(nodeB.getInputLink(0)).toBeFalsy()

        nodeA.connect(0, nodeB, 0)

        expect(nodeA.getOutputLinks(0)).toHaveLength(1)
        expect(nodeB.getInputLink(0)).toBeTruthy()

        expect(Object.keys(subgraph.subgraph.links)).toHaveLength(1)
        const link = Object.values(subgraph.subgraph.links)[0]

        const cloneData: LGraphNodeCloneData = { forNode: {} }
        const clonedSubgraph = subgraph.clone(cloneData);

        for (const id of [subgraph.id, clonedSubgraph.id]) {
            expect(cloneData.forNode[id]).toBeInstanceOf(Object)
            expect(cloneData.forNode[id].subgraphNewIDMapping).toBeInstanceOf(Object)
            expect(Object.keys(cloneData.forNode[id].subgraphNewIDMapping.nodeIDs)).toHaveLength(4)
            expect(Object.keys(cloneData.forNode[id].subgraphNewIDMapping.linkIDs)).toHaveLength(2)
        }

        expect(clonedSubgraph.subgraph._nodes).toHaveLength(2);

        const [clonedNodeA, clonedNodeB] = clonedSubgraph.subgraph._nodes

        expect(clonedNodeA.type).toEqual("basic/integer")
        expect(clonedNodeA.outputs[0].links).toHaveLength(1)
        expect(clonedNodeA.getOutputLinks(0)[0]).toBeTruthy()
        expect(clonedNodeB.type).toEqual("basic/watch")
        expect(clonedNodeB.inputs[0].link).toBeTruthy()
        expect(clonedNodeB.getInputLink(0)).toBeTruthy()

        expect(Object.keys(clonedSubgraph.subgraph.links)).toHaveLength(1)
        const clonedLink = Object.values(clonedSubgraph.subgraph.links)[0]
        expect(clonedLink.id).not.toEqual(link.id)
    }

    test__clone__reconnectsInnerNodesRecursively() {
        const graph = new LGraph();

        const nodeA = LiteGraph.createNode(ConstantInteger)
        const nodeB = LiteGraph.createNode(Watch)

        const subgraphA = LiteGraph.createNode(Subgraph)
        const subgraphB = LiteGraph.createNode(Subgraph)

        graph.add(subgraphA)
        subgraphA.subgraph.add(subgraphB)
        subgraphB.subgraph.add(nodeA)
        subgraphB.subgraph.add(nodeB)

        expect(nodeA.type).toEqual("basic/integer")
        expect(nodeA.getOutputLinks(0)).toHaveLength(0)
        expect(nodeB.type).toEqual("basic/watch")
        expect(nodeB.getInputLink(0)).toBeFalsy()

        nodeA.connect(0, nodeB, 0)

        expect(nodeA.getOutputLinks(0)).toHaveLength(1)
        expect(nodeB.getInputLink(0)).toBeTruthy()

        const nodeIds = Array.from(graph.iterateNodesInOrderRecursive()).map(n => n.id)
        const linkIds = Array.from(graph.iterateNodesInOrderRecursive())
            .flatMap(n => Array.from(n.iterateAllLinks()))
            .map(l => l.id)

        expect(Object.keys(subgraphB.subgraph.links)).toHaveLength(1)
        const link = Object.values(subgraphB.subgraph.links)[0]

        // Clone!
        const cloneData: LGraphNodeCloneData = { forNode: {} }
        const clonedSubgraphA = subgraphA.clone(cloneData);

        for (const id of [subgraphA.id, clonedSubgraphA.id]) {
            expect(cloneData.forNode[id]).toBeInstanceOf(Object)
            expect(cloneData.forNode[id].subgraphNewIDMapping).toBeInstanceOf(Object)
            expect(Object.keys(cloneData.forNode[id].subgraphNewIDMapping.nodeIDs)).toHaveLength(6)
            expect(Object.keys(cloneData.forNode[id].subgraphNewIDMapping.linkIDs)).toHaveLength(2)
        }

        // Ensure original graph was not modified (LGraph.serialize() hangs on
        // to references in the original graph!)
        const nodeIds2 = Array.from(graph.iterateNodesInOrderRecursive()).map(n => n.id)
        const linkIds2 = Array.from(graph.iterateNodesInOrderRecursive())
            .flatMap(n => Array.from(n.iterateAllLinks()))
            .map(l => l.id)
        expect(nodeIds2).toEqual(expect.arrayContaining(nodeIds))
        expect(linkIds2).toEqual(expect.arrayContaining(linkIds))

        expect(clonedSubgraphA.subgraph._nodes).toHaveLength(1);

        const [clonedSubgraphB] = clonedSubgraphA.subgraph._nodes

        expect(clonedSubgraphB.subgraph._nodes).toHaveLength(2);
        const [clonedNodeA, clonedNodeB] = clonedSubgraphB.subgraph._nodes

        expect(Object.keys(clonedSubgraphB.subgraph.links)).toHaveLength(1)
        const clonedLink = Object.values(clonedSubgraphB.subgraph.links)[0]
        expect(clonedLink.id).not.toEqual(link.id)

        expect(clonedNodeA.type).toEqual("basic/integer")
        expect(clonedNodeA.outputs[0].links).toHaveLength(1)
        expect(clonedNodeA.getOutputLinks(0)[0]).toBeTruthy()
        expect(clonedNodeA.getOutputLinks(0)[0].id).toEqual(clonedLink.id)
        expect(clonedNodeB.type).toEqual("basic/watch")
        expect(clonedNodeB.inputs[0].link).toBeTruthy()
        expect(clonedNodeB.getInputLink(0)).toBeTruthy()
        expect(clonedNodeB.getInputLink(0).id).toEqual(clonedLink.id)
    }

    test__convertNodesToSubgraphInputs__converts() {
        if (!LiteGraph.use_uuids)
            return;

        const graph = new LGraph();

        const subgraph = LiteGraph.createNode(Subgraph)
        graph.add(subgraph)

        const origin = LiteGraph.createNode(CustomTriggerNode)
        const inner = LiteGraph.createNode(CustomTriggerNode)
        const inner2 = LiteGraph.createNode(CustomTriggerNode)

        subgraph.subgraph.add(origin)
        subgraph.subgraph.add(inner)
        subgraph.subgraph.add(inner2)

        origin.connect(0, inner, 0)
        origin.connect(0, inner2, 0)

        subgraph.convertNodesToSubgraphInputs([origin]);

        expect(inner.inputs[0].link).toBeTruthy()
        expect(inner2.inputs[0].link).toBeTruthy()

        const graphInputs = subgraph.subgraph.findNodesByClass(GraphInput)
        console.error(graphInputs.map(i => i.properties.name))
        expect(graphInputs).toHaveLength(1)

        const graphInput = graphInputs[0]
        expect(graphInput.outputs[0].links).toHaveLength(2)
    }

    test__convertNodesToSubgraphOutputs__converts() {
        if (!LiteGraph.use_uuids)
            return;

        const graph = new LGraph();

        const subgraph = LiteGraph.createNode(Subgraph)
        graph.add(subgraph)

        const target = LiteGraph.createNode(CustomTriggerNode)
        const inner = LiteGraph.createNode(CustomTriggerNode)

        subgraph.subgraph.add(inner)
        subgraph.subgraph.add(target)

        inner.connect(0, target, 0)

        expect(inner.outputs[0].links).toHaveLength(1)

        subgraph.convertNodesToSubgraphOutputs([target]);

        expect(inner.outputs[0].links).toHaveLength(1)

        const graphOutputs = subgraph.subgraph.findNodesByClass(GraphOutput)
        expect(graphOutputs).toHaveLength(1)

        const graphOutput = graphOutputs[0]
        expect(graphOutput.inputs[0].link).toBeTruthy();
    }

    test__onAction__forwardsInsideAndOutside() {
        const graph = new LGraph();

        const subgraph = LiteGraph.createNode(Subgraph)
        graph.add(subgraph)

        const originPair = subgraph.addGraphInput("test", BuiltInSlotType.ACTION);
        const targetPair = subgraph.addGraphOutput("test", BuiltInSlotType.EVENT);

        expect(subgraph.subgraph.inputs["test"].type).toEqual(BuiltInSlotType.ACTION)
        expect(subgraph.subgraph.outputs["test"].type).toEqual(BuiltInSlotType.EVENT)

        const origin = LiteGraph.createNode(CustomTriggerNode)
        const inner = LiteGraph.createNode(CustomTriggerNode)
        const inner2 = LiteGraph.createNode(CustomTriggerNode)
        const inner3 = LiteGraph.createNode(CustomTriggerNode)
        const target = LiteGraph.createNode(CustomTriggerNode)

        graph.add(origin)
        graph.add(target)
        subgraph.subgraph.add(inner)
        subgraph.subgraph.add(inner2)
        subgraph.subgraph.add(inner3)

        origin.connect(0, subgraph, 0)
        subgraph.connect(0, target, 0)
        originPair.innerNode.connect(0, inner, 0)
        originPair.innerNode.connect(0, inner2, 0)
        originPair.innerNode.connect(0, inner3, 0)
        inner.connect(0, targetPair.innerNode, 0)

        expect(origin.outputs[0].links).toHaveLength(1)
        expect(originPair.innerNode.properties.type).toEqual(BuiltInSlotType.ACTION)
        expect(targetPair.innerNode.properties.type).toEqual(BuiltInSlotType.EVENT)

        origin.triggerSlot(0);

        expect(inner.triggers).toHaveLength(1)
        expect(inner2.triggers).toHaveLength(1)
        expect(inner3.triggers).toHaveLength(1)
        expect(target.triggers).toHaveLength(1)
    }
}
