// tslint:disable:no-implicit-dependencies
import TypedTemplate, { ITypedTemplate } from "../src/index";
import * as chai from "chai";
const expect = chai.expect;

describe("Generate (singular substitute) →", () => {
  it("single channel request with FQ template, default channel for layout", async () => {
    let template: ITypedTemplate = TypedTemplate.create()
      .topic("alert")
      .channels("emailHtml")
      .substitute({
        instrument: "hammer"
      });

    const t = await template.generate();

    expect(t).to.haveOwnProperty("emailHtml");
    expect(t.emailHtml).to.be.a("string");
    expect(t.emailHtml).to.match(/Default layout for HTML email/);
    expect(t.emailHtml).to.match(/hammer/);
    expect(Object.keys(t)).has.lengthOf(1);
  });

  it("multi channel request with FQ template, default channel for layout", async () => {
    let template: ITypedTemplate = TypedTemplate.create()
      .topic("alert")
      .channels("emailHtml", "emailText")
      .substitute({
        instrument: "hammer"
      });

    const t = await template.generate();

    expect(t).to.haveOwnProperty("emailHtml");
    expect(t).to.haveOwnProperty("emailText");
    expect(t.emailHtml).to.be.a("string");
    expect(t.emailHtml).to.match(/hammer/);
    expect(t.emailText).to.match(/hammer/);
    expect(t.emailHtml).to.match(/Default layout for HTML email/);
    expect(t.emailText).to.match(/default layout for emailText/);
    expect(Object.keys(t)).has.lengthOf(2);
  });

  it("unknown template and channel reverts to default template and layout", async () => {
    let template: ITypedTemplate = TypedTemplate.create()
      .topic("nonsense")
      .channels("foobar")
      .substitute({
        instrument: "hammer"
      });

    const t = await template.generate();

    expect(t).to.haveOwnProperty("foobar");
    expect(t.foobar).to.be.a("string");
    expect(t.foobar).to.match(/ROOT DEFAULT LAYOUT/);
    expect(t.foobar).to.match(/ROOT TEMPLATE/);
    expect(Object.keys(t)).has.lengthOf(1);
  });

  it("known template but unknown layout", async () => {
    let template: ITypedTemplate = TypedTemplate.create()
      .topic("alert")
      .channels("foobar")
      .substitute({
        instrument: "hammer"
      });

    const t = await template.generate();

    expect(t).to.haveOwnProperty("foobar");
    expect(t.foobar).to.match(/hammer/);
    expect(t.foobar).to.match(/ROOT DEFAULT LAYOUT/);
    expect(t.foobar).to.match(/ALERT DEFAULT TEMPLATE/);
    expect(Object.keys(t)).has.lengthOf(1);
  });

  it("known template with specific layout for template", async () => {
    let template: ITypedTemplate = TypedTemplate.create()
      .topic("welcome")
      .channels("emailHtml")
      .substitute({
        name: "Bob"
      });

    const t = await template.generate();

    expect(t).to.haveOwnProperty("emailHtml");
    expect(t.emailHtml).to.match(/Welcome Bob/);
    expect(t.emailHtml).to.match(/WELCOME LAYOUT FOR EMAIL-HTML/);
    expect(t.emailHtml).to.match(/WELCOME TEMPLATE/);
    expect(Object.keys(t)).has.lengthOf(1);
  });
});
