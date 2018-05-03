import { IDictionary } from "common-types";
import * as path from "path";
import { fstat, fstatSync, readFileSync, exists } from "fs";
import * as Handlebars from "handlebars";
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
    return new Promise(resolve => {
      if (this.isListDataset) {
        this._substitutions.map(async (data: IDictionary) => {
          this._channels.map(async channel => {
            const template: Handlebars.TemplateDelegate = await this.compileTemplate(
              this._topic,
              channel
            );
            const result = template(data);
            add(result).to(output, channel);
          });
        });

        return output;
      } else {
        this._channels.map(async (channel: string) => {
          console.log(channel);
          console.log(this._topic);
          const template: Handlebars.TemplateDelegate = await this.compileTemplate(
            this._topic,
            channel
          );
          console.log(template(this._substitutions));

          output[channel] = template(this._substitutions);
        });

        resolve(output);
      }
    });
  }

  public iterator() {
    // TODO: implement
  }

  private async compileTemplate(topic: string, channel: string) {
    const templateCacheKey = `${topic}-${channel}`;
    if (this._compiledTemplates[templateCacheKey]) {
      return this._compiledTemplates[templateCacheKey];
    }

    const base = path.join(this._dir, "../test/templates", TypedTemplate.TEMPLATES_DIR);
    console.log(base);

    const files = [
      path.join(base, `/${topic}/${channel}.hbs`),
      path.join(base, `/${topic}/default.hbs`),
      path.join(base, `/default.hbs`)
    ];
    const body: string = readFileSync(await this.getFirstFile(files), {
      encoding: "utf-8"
    });
    console.log(body);

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
