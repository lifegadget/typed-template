// tslint:disable:no-implicit-dependencies
import TypedTemplate, { ITypedTemplate } from "../src/index";
import * as chai from "chai";
const expect = chai.expect;

describe("Generate →", () => {
  it("single channel request with FQ template, singular substitution", async () => {
    console.log("starting");

    const template: ITypedTemplate = TypedTemplate.create()
      .topic("alert")
      .channels("emailHtml")
      .substitute({
        instrument: "hammer"
      })
      .generate();
    expect(template).to.haveOwnProperty("emailHtml");
    expect(template.emailHtml).to.be.a("string");
    expect(template.emailHtml).to.include("hammer");
  });
});
