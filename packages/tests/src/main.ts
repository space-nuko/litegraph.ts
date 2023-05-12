import "@litegraph-ts/core"
import "@litegraph-ts/nodes-basic"

import LGraphTests from "./LGraphTests"
import SubgraphTests from "./nodes/SubgraphTests"
import { describe, test } from "vitest"

// I don't like BDD syntax...
function runTests<T>(ctor: new () => T) {
    const instance = new ctor()
    describe(instance.constructor.name, () => {
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(instance))) {
            if (key.startsWith("test")) {
                const value = instance[key]
                if (typeof value === "function") {
                    test(key, value.bind(instance))
                }
            }
        }
    })
}

runTests(LGraphTests)
runTests(SubgraphTests)
