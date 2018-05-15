import TypedTemplate from "../src/index";
import * as chai from "chai";
import { IDictionary } from "common-types";

const expect = chai.expect;

interface IJob {
  jobId: string;
  extraneous?: number;
}

interface ISmsOnly {
  sms: string;
}
interface ISmsOrEmail {
  sms: string;
  emailHtml: string;
  emailText: string;
}

/**
 * Bear in mind these tests are just to visually identify in
 * the editor that the generics are passing their types around
 * correctly.
 */
describe("Typings → ", () => {
  it.skip("setting <T> imposes structure on the substitutions that are allowed in", () => {
    const wrongType = {
      jobId: "1234",
      extraneous: "foobar"
    };
    const nonExistantType = {
      jobId: "1234",
      noCanDo: true
    };
    const ruleAbidingJob = {
      jobId: "1234"
    };

    const rubbish = {
      foo: "bar"
    };
    const t = TypedTemplate.create<IJob>();
    t.substitute(wrongType); // this should be failing in TS
    t.substitute(nonExistantType); // this should be failing in TS
    t.substitute(ruleAbidingJob); // this should be fine
    t.substitute(rubbish); // this should be failing
  });

  it.skip("setting <O> imposes structure on output from generate", async () => {
    let template = TypedTemplate.create<IDictionary, ISmsOnly>()
      .topic("alert")
      .channels("sms")
      .substitute({
        instrument: "hammer"
      });

    const t = await template.generate();
    expect(t.emailHtml).to.be.a("string");
    expect(t.sms).to.be.a("string");
    expect(t.foobaz).to.be.a("string");
  });

  it.skip("setting <O> imposes structure on allowable inputs to channels()", () => {
    let template = TypedTemplate.create<IDictionary, ISmsOrEmail>()
      .topic("alert")
      .channels("sms", "emailHtml", "emailText", "foobar")
      .substitute({
        instrument: "hammer"
      });
  });
});
