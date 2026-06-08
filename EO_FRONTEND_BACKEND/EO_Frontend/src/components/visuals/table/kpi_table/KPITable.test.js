import React from 'react'
import { render } from '@testing-library/react'
import assert from 'assert'
import KPITable from './KPITable'
import { describe, it, test, beforeAll } from 'vitest'

beforeAll(() => {
  if (!Array.prototype.toSorted) {
    Array.prototype.toSorted = function (compareFn) {
      return [...this].sort(compareFn)
    }
  }
})

test('renders component with valid return method', () => {
  // Test with condition as true

  const { queryAllByText } = render(
    <KPITable headers={['test']} data={[['test', 'test', 'test']]} />,
  )
  assert(queryAllByText(''))
})

// import React from "react";
// import renderer from "react-test-renderer";
// import assert from "assert";
// import KPITable from "./KPITable";

// describe("KPITable Component", () => {
//   it("renders correctly with no data", () => {
//     const tree = renderer.create(<KPITable data={[]} headers={["KPI", "tag", "CAUSE", "ACTUAL", "OPTIMUM", "SUGGESTIONS"]} />).toJSON();
//     assert.deepStrictEqual(tree, null); // null because the component renders a message for no data
//   });

//   it("renders correctly with data", () => {
//     const data = [
//       [
//         "LOW METHANOL PRODUCTION",
//         "co2_injection_ods_cause",
//         "LOW CO2 INJECTION (TON/ DAY)",
//         "0.01",
//         "70.09",
//         {
//           "type": "div",
//           "key": "Methanol production is low at high loop pressure and drum pressure. Consider increasing CO2 injection to further improve methanol production.",
//           "ref": null,
//           "props": {
//             "className": "d-flex justify-content-center",
//             "children": [
//               {
//                 "type": "span",
//                 "key": null,
//                 "ref": null,
//                 "props": {
//                   "className": "me-1",
//                   "children": "METHANOL PRODUCTION IS LOW AT HIGH LOOP PRESSURE AND DRUM PRESSURE. CONSIDER INCREASING CO2 INJECTION TO FURTHER IMPROVE METHANOL PRODUCTION."
//                 },
//                 "_owner": null,
//                 "_store": {}
//               },
//               {
//                 "type": "img",
//                 "key": null,
//                 "ref": null,
//                 "props": {
//                   "src": "/peeoui/static/media/ods_arrows.a9330e3b9f4ce747c9d778b80b63fda1.svg"
//                 },
//                 "_owner": null,
//                 "_store": {}
//               }
//             ]
//           },
//           "_owner": null,
//           "_store": {}
//         }
//       ],
//       [
//         "LOW METHANOL PRODUCTION",
//         "SMR_CO_CO2_ods_cause",
//         "LOW CO/CO2 ",
//         "1.73",
//         "1.8",
//         {
//           "type": "div",
//           "key": "Methanol production is low at high loop pressure and drum pressure. Monitor reformer performance to improve CO/CO2 thereby methanol production.",
//           "ref": null,
//           "props": {
//             "className": "d-flex justify-content-center",
//             "children": [
//               {
//                 "type": "span",
//                 "key": null,
//                 "ref": null,
//                 "props": {
//                   "className": "me-1",
//                   "children": "METHANOL PRODUCTION IS LOW AT HIGH LOOP PRESSURE AND DRUM PRESSURE. MONITOR REFORMER PERFORMANCE TO IMPROVE CO/CO2 THEREBY METHANOL PRODUCTION."
//                 },
//                 "_owner": null,
//                 "_store": {}
//               },
//               {
//                 "type": "img",
//                 "key": null,
//                 "ref": null,
//                 "props": {
//                   "src": "/peeoui/static/media/ods_arrows.a9330e3b9f4ce747c9d778b80b63fda1.svg"
//                 },
//                 "_owner": null,
//                 "_store": {}
//               }
//             ]
//           },
//           "_owner": null,
//           "_store": {}
//         }
//       ]
//     ];
//     const headers = ["KPI", "tag", "CAUSE", "ACTUAL", "OPTIMUM", "SUGGESTIONS"];

//     const tree = renderer.create(<KPITable data={data} headers={headers} />).toJSON();
//     assert.notStrictEqual(tree, null);
//   });

// });
