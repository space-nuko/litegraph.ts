import "@litegraph-ts/core"
import "@litegraph-ts/nodes-basic"

import { describe, it } from "vitest"

import * as testSuite from "./testSuite"

// I don't like BDD syntax...
// Emulate minitest instead...
function runTests<T>(ctor: new () => T) {
    const instance = new ctor()
    const ctorName = instance.constructor.name
    const idx = ctorName.indexOf("Tests")
    if (idx === -1) {
        throw `Invalid test name ${ctorName}, must end with "Tests"`
    }
    const classCategory = ctorName.substring(0, idx)
    describe(classCategory, () => {
        const allTests: Record<string, [string, Function][]> = {}
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(instance))) {
            if (key.startsWith("test")) {
                const [_, category, testName] = key.split("__")
                const value = instance[key]
                if (typeof value === "function") {
                    allTests[category] ||= []
                    allTests[category].push([testName, value])
                }
            }
        }

        for (const [category, tests] of Object.entries(allTests)) {
            describe(category, () => {
                for (const [name, testFn] of tests) {
                    const should = name.split(/\.?(?=[A-Z])/).join(' ').toLowerCase();
                    it(should, testFn.bind(instance))
                }
            })
        }
    })
}

for (const ctor of Object.values(testSuite)) {
    runTests(ctor as any)
}
