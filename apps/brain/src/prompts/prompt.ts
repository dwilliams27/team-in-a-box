export class BoxPrompt {
  template: string;
  params: Set<string>;
  values: Record<string, string>;

  constructor(template: string, params: Set<string>, values: Record<string, string>) {
    this.template = template;
    this.params = params;
    this.values = values;
  }

  static fromTemplate(template: string, values?: Record<string, string>) {
    const params = new Set(template.match(/{{(.*?)}}/g)?.map((param) => param.slice(2, -2)));
    return new BoxPrompt(template, params, values || {});
  }

  setParam(key: string, value: string) {
    if (!this.params.has(key)) {
      throw new Error(`Invalid parameter: ${key}`);
    }
    this.values[key] = value;
  }

  getPrompt(): string {
    const res = this.template.replace(/{{(.*?)}}/g, (match, p1) => {
      return this.values[p1] || match;
    });
    return res;
  }
}
