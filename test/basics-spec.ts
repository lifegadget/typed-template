// tslint:disable:no-implicit-dependencies
import TypedTemplate from "../src/index";
import * as chai from "chai";

const expect = chai.expect;

describe("Basics → ", () => {
  it("Can instantiate with create() static method", () => {
    // expect(TypedTemplate).to.be.a("object");
    const obj = TypedTemplate.create();
    expect(obj).to.be.an.instanceof(TypedTemplate);
  });
  it("Fluent interface setters returns back obj reference", () => {
    const obj = TypedTemplate.create();
    expect(obj.channels("email")).to.equal(obj);
    expect(obj.substitute({ foo: "bar" })).to.equal(obj);
    expect(obj.topic("welcome")).to.equal(obj);
    expect(obj.usePrecompiled()).to.equal(obj);
    expect(obj.directory("..")).to.equal(obj);

    expect(obj.get("topic")).to.equal("welcome");
  });

  it("isListDataset accurately reflects multiplicity of data", () => {
    const obj = TypedTemplate.create().substitute([{ foo: "bar" }, { foo: "baz" }]);
    expect(obj.isListDataset).to.equal(true);
    const obj2 = TypedTemplate.create().substitute({ foo: "bar" });
    expect(obj2.isListDataset).to.equal(false);
  });
});
