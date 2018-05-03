// tslint:disable:no-implicit-dependencies
import TypedTemplate, { ITypedTemplate } from "../src/index";
import * as chai from "chai";
const expect = chai.expect;

describe("Generate →", () => {
  it("single channel request with FQ template, singular substitution", async () => {
    let template: ITypedTemplate = TypedTemplate.create()
      .topic("alert")
      .channels("emailHtml")
      .substitute({
        instrument: "hammer"
      });

    const t = await template.generate();
    expect(t).to.haveOwnProperty("emailHtml");
    expect(t.emailHtml).to.be.a("string");
    expect(t.emailHtml).to.match(/hammer/);
  });
});
