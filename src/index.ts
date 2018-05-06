import { IDictionary } from "common-types";
import * as path from "path";
import { fstat, fstatSync, readFileSync, exists } from "fs";
import * as Handlebars from "handlebars";
import Parallel from "wait-in-parallel";
import { StringIterator } from "lodash";
export interface ITypedTemplate extends IDictionary {
  email?: string;
  emailText?: string;
  emailHtml?: string;
  sms?: string;
}

export interface ITypedTemplateIterable {
  value: ITypedTemplate;
  done: boolean;
}

export function add<T = string>(value: T) {
  return {
    to(dict: IDictionary<T[]>, prop: string) {
      if (Array.isArray(dict[prop])) {
        dict[prop].push(value);
      } else {
        dict[prop] = [value];
      }

      return dict;
    }
  };
}

export interface ITemplateChannel {
  channel: string;
  templates: string[];
}

export default class TypedTemplate {
  /** Pre-compiles all HBS files into Javascript functions */
  public static precompile() {
    //
  }

  public static create() {
    const obj = new TypedTemplate();
    return obj;
  }

  constructor(private _dir: string = __dirname) {}

  private _topic: string;
  private _channels: string[];
  private _substitutions: IDictionary;
  private _usePrecompiled: boolean = false;
  private _compiledTemplates: IDictionary = {};

  public static TEMPLATES_DIR: string = "templates";
  public static LAYOUTS_DIR: string = "layouts";

  public topic(t: string) {
    this._topic = t;
    return this;
  }

  public directory(d: string) {
    this._dir = path.join(__dirname, d);
    return this;
  }

  public channels(...c: string[]) {
    this._channels = c;
    return this;
  }

  public substitute(s: IDictionary) {
    this._substitutions = s;
    return this;
  }

  public usePrecompiled() {
    this._usePrecompiled = true;
    return this;
  }

  public get isListDataset() {
    return Array.isArray(this._substitutions);
  }

  public get(prop: string) {
    return this[`_${prop}` as keyof this] as any;
  }

  public async generate() {
    let output: IDictionary = {};
    if (this.isListDataset) {
      // get/compile hbs templates
      const compilation = new Parallel();
      this._channels.map(channel =>
        compilation.add<Handlebars.TemplateDelegate>(
          channel,
          this.compileTemplate(this._topic, channel)
        )
      );
      const templates = await compilation.isDone();
      // iterate through substitutions, apply to templates
      this._substitutions.map((data: IDictionary) => {
        Object.keys(templates).map(ch => {
          add(templates[ch](data)).to(output, ch);
        });
      });
    } else {
      const compilation = new Parallel();
      this._channels.map(channel =>
        compilation.add<Handlebars.TemplateDelegate>(
          channel,
          this.compileTemplate(this._topic, channel)
        )
      );
      const templates = await compilation.isDone();
      Object.keys(templates).map(ch => {
        output[ch] = templates[ch](this._substitutions);
      });
    }

    return output;
  }

  /**
   * Provides a way to iterate through the templates, one
   * channel at a time.
   */
  // public async *iterator() {
  //   let output: IDictionary = {};
  //   const substitutions = this.isListDataset
  //     ? this._substitutions
  //     : [this._substitutions];
  //   const asyncMapper = {
  //     [Symbol.asyncIterator]() {
  //       return Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");
  //     }
  //   };
  //   yield this._channels.map(async function*(channel) {
  //     const fn = await this.compileTemplate(this._topic, channel);
  //     const output: ITemplateChannel = {
  //       channel,
  //       templates: []
  //     };
  //     this._substitutions.map((data: IDictionary) => {
  //       output.templates.push(fn(data));
  //     });

  //     yield* output;
  //   });
  // }

  public [Symbol.asyncIterator]() {
    return Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");
  }

  private async compileTemplate(topic: string, channel: string) {
    const templateCacheKey = `${topic}-${channel}`;
    if (this._compiledTemplates[templateCacheKey]) {
      return this._compiledTemplates[templateCacheKey];
    }

    const base = path.join(this._dir, "../test/templates", TypedTemplate.TEMPLATES_DIR);

    const files = [
      path.join(base, `/${topic}/${channel}.hbs`),
      path.join(base, `/${topic}/default.hbs`),
      path.join(base, `/default.hbs`)
    ];
    const body: string = readFileSync(await this.getFirstFile(files), {
      encoding: "utf-8"
    });

    const layout: string = await this.getLayout(topic, channel);
    if (!/{{template}}/.test(layout)) {
      const e = new Error(
        `The layout returned did NOT have a {{template}} tag; this will block the template from being inserted`
      );
      e.name = "MissingTemplate";
      throw e;
    }
    const compiled = Handlebars.compile(layout.replace("{{template}}", body));
    this._compiledTemplates[templateCacheKey] = compiled;

    return compiled;
  }

  private async getFirstFile(dirs: string[], type: string = "undefined") {
    for (let i = 0; i < dirs.length; i++) {
      const exists = await fileExists(dirs[i]);
      if (exists) {
        return dirs[i];
      }
    }
    throw new Error(
      `No matching ${type} found for topic "${this._topic}"!\n  ${dirs.join(",\n")}`
    );
  }

  private async getLayout(topic: string, channel: string): Promise<string> {
    const base = path.join(this._dir, "../test/templates", TypedTemplate.LAYOUTS_DIR);
    const layoutsChoices = [
      path.join(base, `/${channel}/${topic}.hbs`),
      path.join(base, `/${channel}/default.hbs`),
      path.join(base, `default.hbs`)
    ];
    const file: string = await this.getFirstFile(layoutsChoices, "layout");
    const layout: string = readFileSync(file, { encoding: "utf-8" });

    return layout;
  }
}

async function fileExists(file: string) {
  return new Promise(resolve => {
    exists(file, result => {
      resolve(result);
    });
  });
}
