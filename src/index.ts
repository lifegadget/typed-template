import { IDictionary } from "common-types";
import * as path from "path";
import { readFileSync, exists } from "fs";
import * as Handlebars from "handlebars";
import { Parallel } from "wait-in-parallel";

export interface IGenericChannelSuggestion {
  emailText?: string;
  emailHtml?: string;
  sms?: string;
  [other: string]: string;
}

// export interface ITypedTemplateIterable {
//   value: ITypedTemplate;
//   done: boolean;
// }

/**
 * Helper interface/function which provides nice fluent way of
 * adding
 *
 * @param value
 */
export function add<K = string>(value: K) {
  return {
    to(dict: any, prop: string) {
      if (Array.isArray(dict[prop])) {
        dict[prop].push(value);
      } else if (typeof dict === "object") {
        dict[prop] = [value];
      } else {
        const e = new Error(
          `the property being added must be added to a either an array or object but in this case it was a "${typeof dict}"`
        );
        e.name = "TemplateAdditionNotAllowed";
        throw e;
      }

      return dict;
    }
  };
}

export interface ITemplateChannel {
  channel: string;
  templates: string[];
}

// export interface IChannelDictionary<T> {
//   [prop: keyof T]: string;
// }

/**
 * A simple utility for building templates for multiple
 * destination channels (e.g., sms, email, etc.).
 *
 * The generic passed in at the class level dictates the
 * expected data structure of the "substitutions"
 */
export default class TypedTemplate<
  T = IDictionary,
  O = IGenericChannelSuggestion
> {
  /** Pre-compiles all HBS files into Javascript functions */
  public static precompile() {
    //
  }

  public static create<TT = IDictionary, OO = IGenericChannelSuggestion>(
    dir?: string
  ) {
    const obj = new TypedTemplate<TT, OO>(dir);
    return obj;
  }

  constructor(dir?: string) {
    const dirs = new Set(__dirname.split("/"));
    // const root = dirs.has("node_modules")
    //   ? findRoot(path.resolve(__dirname, ".."))
    //   : findRoot(__dirname);
    const root = process.cwd();

    this._dir = dir ? path.resolve(root, dir) : root;
  }

  private _dir: string;
  private _topic: string;
  private _channels: string[];
  private _substitutions: T;
  private _usePrecompiled: boolean = false;
  private _compiledTemplates: IDictionary = {};

  public static BASE_DIR: string = "templates";
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

  public channels(...c: Array<keyof O & string>) {
    this._channels = c;
    return this;
  }

  public substitute(s: T) {
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
    let output: Partial<O> = {};
    if (Array.isArray(this._substitutions)) {
      // LIST BASED SUBSTITUTIONS
      const channels = this._channels;
      const compilation = new Parallel();

      this._channels.map(channel =>
        compilation.add<Handlebars.TemplateDelegate>(
          channel,
          this.compileTemplate(this._topic, channel)
        )
      );
      const templates = await compilation.isDone();
      // iterate through substitutions, apply to templates
      this._substitutions.map((data: keyof T) => {
        Object.keys(templates).map((ch: keyof typeof templates) => {
          add(templates[ch](data)).to(output, ch as string);
        });
      });
    } else {
      // SINGLE SUBSTITUTION HASH
      const compilation = new Parallel();
      this._channels.map(channel =>
        compilation.add<Handlebars.TemplateDelegate>(
          channel,
          this.compileTemplate(this._topic, channel)
        )
      );
      const templates = await compilation.isDone();
      Object.keys(templates).map((ch: keyof typeof templates) => {
        (output as any)[ch] = templates[ch](this._substitutions);
      });
    }

    return output as O;
  }

  private async compileTemplate(topic: string, channel: string) {
    const templateCacheKey = `${topic}-${channel}`;
    if (this._compiledTemplates[templateCacheKey]) {
      return this._compiledTemplates[templateCacheKey];
    }

    const base = path.join(
      this._dir,
      TypedTemplate.BASE_DIR,
      TypedTemplate.TEMPLATES_DIR
    );

    const files = [
      path.join(base, `/${topic}/${channel}.hbs`),
      path.join(base, `/${topic}/default.hbs`),
      path.join(base, `/default.hbs`)
    ];
    let body: string;
    const file = await this.getBestFile(files);

    try {
      body = readFileSync(file, {
        encoding: "utf-8"
      });
    } catch (e) {
      const err = new Error(`Failed to read file "${file}": ${e.message}`);
      err.name = "FileNotFound";
      throw err;
    }

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

  private async getBestFile(dirs: string[], type: string = "undefined") {
    for (let i = 0; i < dirs.length; i++) {
      const exists = await fileExists(dirs[i]);
      if (exists) {
        return dirs[i];
      }
    }
    throw new Error(
      `No matching ${type} found for topic "${this._topic}"!\n  ${dirs.join(
        ",\n"
      )}`
    );
  }

  private async getLayout(topic: string, channel: string): Promise<string> {
    const base = path.join(
      this._dir,
      TypedTemplate.BASE_DIR,
      TypedTemplate.LAYOUTS_DIR
    );
    const layoutsChoices = [
      path.join(base, `/${channel}/${topic}.hbs`),
      path.join(base, `/${channel}/default.hbs`),
      path.join(base, `default.hbs`)
    ];
    const file: string = await this.getBestFile(layoutsChoices, "layout");

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
