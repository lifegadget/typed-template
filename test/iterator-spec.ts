// tslint:disable:no-implicit-dependencies
import TypedTemplate, { ITypedTemplate } from "../src/index";
import * as chai from "chai";

const expect = chai.expect;

describe("Iterator → ", () => {
  // it.skip("Iterating through a multi channel with 'for await'", async () => {
  //   let template: ITypedTemplate = TypedTemplate.create()
  //     .topic("alert")
  //     .channels("emailHtml", "emailPlain")
  //     .substitute([
  //       {
  //         instrument: "hammer"
  //       },
  //       {
  //         instrument: "saw"
  //       }
  //     ]);
  //   const iterator = template.iterator();
  //   for await (let channel of iterator) {
  //     console.log(channel);
  //   }
  // });
  // it.skip('Iterating through a multi channel with "iterator.next()"', async () => {
  //   let template: ITypedTemplate = TypedTemplate.create()
  //     .topic("alert")
  //     .channels("emailHtml", "emailPlain")
  //     .substitute([
  //       {
  //         instrument: "hammer"
  //       },
  //       {
  //         instrument: "saw"
  //       }
  //     ]);
  //   const iterator = template.iterator();
  //   while (!iterator.done()) {
  //     const value = await iterator.next();
  //     console.log(value);
  //   }
  // });
});
