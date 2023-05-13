import { LGraph, LiteGraph, Subgraph } from "@litegraph-ts/core"
import { Watch } from "@litegraph-ts/nodes-basic"
import { expect } from 'vitest'
import UnitTest from "./UnitTest"

export default class LGraphTests extends UnitTest {
    test__iterateNodesInOrder__shouldIterateNodes() {
        const graph = new LGraph();

        const nodeA = LiteGraph.createNode(Watch)
        const nodeB = LiteGraph.createNode(Watch)
        const nodeC = LiteGraph.createNode(Watch)

        graph.add(nodeA)
        graph.add(nodeB)
        graph.add(nodeC)

        expect(Array.from(graph.iterateNodesInOrder()).map(i => i.id)).toStrictEqual([nodeA.id, nodeB.id, nodeC.id])
    }

    test__iterateNodesInOrderRecursive__shouldIterateNodes() {
        const graph = new LGraph();

        const nodeA = LiteGraph.createNode(Watch)
        const nodeB = LiteGraph.createNode(Watch)

        const subgraphA = LiteGraph.createNode(Subgraph)
        const subgraphB = LiteGraph.createNode(Subgraph)

        graph.add(subgraphA)
        subgraphA.subgraph.add(subgraphB)

        const subNodeA = LiteGraph.createNode(Watch)
        const subNodeB = LiteGraph.createNode(Watch)
        const subSubNodeA = LiteGraph.createNode(Watch)
        const subSubNodeB = LiteGraph.createNode(Watch)

        graph.add(nodeA)
        subgraphA.subgraph.add(subNodeA)
        subgraphB.subgraph.add(subSubNodeA)
        subgraphA.subgraph.add(subNodeB)
        subgraphB.subgraph.add(subSubNodeB)
        graph.add(nodeB)

        expect(Array.from(graph.iterateNodesInOrderRecursive()).map(i => i.id))
            .toStrictEqual([subgraphA.id, subgraphB.id, subSubNodeA.id, subSubNodeB.id, subNodeA.id, subNodeB.id, nodeA.id, nodeB.id])
    }

    test__add__shouldAssignUniqueIds() {
        const graph = new LGraph();

        const nodeA = LiteGraph.createNode(Watch)
        const nodeB = LiteGraph.createNode(Watch)
        const nodeC = LiteGraph.createNode(Watch)

        graph.add(nodeA)
        graph.add(nodeB)
        graph.add(nodeC)

        expect(nodeA.id).toEqual(1)
        expect(nodeB.id).toEqual(2)
        expect(nodeC.id).toEqual(3)
    }

    test__add__shouldReassignUniqueIds() {
        const graph = new LGraph();

        const nodeA = LiteGraph.createNode(Watch)
        const nodeB = LiteGraph.createNode(Watch)

        graph.add(nodeA)
        nodeB.id = 1
        graph.add(nodeB)

        expect(nodeA.id).toEqual(1)
        expect(nodeB.id).toEqual(2)
    }

    test__add__shouldAssignUniqueIdsRecursively() {
        const graph = new LGraph();

        const nodeA = LiteGraph.createNode(Watch)
        const nodeB = LiteGraph.createNode(Watch)

        const subgraphA = LiteGraph.createNode(Subgraph)
        const subgraphB = LiteGraph.createNode(Subgraph)

        graph.add(subgraphA)
        subgraphA.subgraph.add(subgraphB)

        const subNodeA = LiteGraph.createNode(Watch)
        const subNodeB = LiteGraph.createNode(Watch)
        const subSubNodeA = LiteGraph.createNode(Watch)
        const subSubNodeB = LiteGraph.createNode(Watch)

        graph.add(nodeA)
        subgraphA.subgraph.add(subNodeA)
        subgraphB.subgraph.add(subSubNodeA)
        subgraphA.subgraph.add(subNodeB)
        subgraphB.subgraph.add(subSubNodeB)
        graph.add(nodeB)

        expect(subgraphA.id).toEqual(1)
        expect(subgraphB.id).toEqual(2)
        expect(nodeA.id).toEqual(3)
        expect(subNodeA.id).toEqual(4)
        expect(subSubNodeA.id).toEqual(5)
        expect(subNodeB.id).toEqual(6)
        expect(subSubNodeB.id).toEqual(7)
        expect(nodeB.id).toEqual(8)
    }
}
