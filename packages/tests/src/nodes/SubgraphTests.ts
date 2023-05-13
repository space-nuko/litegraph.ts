import { LGraph, LGraphNode, LiteGraph, Subgraph } from "@litegraph-ts/core"
import { Watch } from "@litegraph-ts/nodes-basic"
import { expect, vi } from 'vitest'
import UnitTest from "../UnitTest"

class CustomGraph extends LGraph {
    calls: number = 0;

    override onNodeAdded(node: LGraphNode) {
        expect(this.constructor.name).toEqual("CustomGraph")
        expect(node).toBeTruthy();
        this.calls += 1
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
        expect(customGraph.calls).toEqual(1)
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
}
