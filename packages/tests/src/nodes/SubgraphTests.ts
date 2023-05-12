import { LGraph, LiteGraph, Subgraph } from "@litegraph-ts/core"
import { Watch } from "@litegraph-ts/nodes-basic"
import { expect } from 'vitest'

export default class SubgraphTests {
    test__onAdded__rejectsDetachedFromParentGraph() {

        const subgraphA = LiteGraph.createNode(Subgraph)
        const subgraphB = LiteGraph.createNode(Subgraph)

        expect(() => subgraphA.subgraph.add(subgraphB)).toThrowError("Can't add nodes to this subgraph until it's been added into the root graph!")
    }

    test__onAddNode__rejectsDetachedFromParentGraph() {

        const subgraph = LiteGraph.createNode(Subgraph)
        const node = LiteGraph.createNode(Watch)

        expect(() => subgraph.subgraph.add(node)).toThrowError("Can't add nodes to this subgraph until it's been added into the root graph!")
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
