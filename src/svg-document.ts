import { parseHTML } from 'linkedom';
import { EventEmitter } from 'events';

const SVG_NS = 'http://www.w3.org/2000/svg';

export interface SvgElementInfo {
  id: string;
  tag: string;
  attributes: Record<string, string>;
}

export class SvgDocument extends EventEmitter {
  private doc: ReturnType<typeof parseHTML>['document'] | null = null;
  private idCounter = 0;

  get isEmpty(): boolean {
    return this.doc === null || !this.doc.querySelector('svg');
  }

  create(svgMarkup: string): void {
    const cleaned = svgMarkup.replace(/<\?xml[^?]*\?>\s*/g, '');
    const { document } = parseHTML(cleaned);
    this.doc = document;
    this.ensureIds();
    this.emit('change', this.getSvg());
  }

  set(svgMarkup: string): void {
    this.create(svgMarkup);
  }

  getSvg(): string {
    if (!this.doc) return '';
    const svgEl = this.doc.querySelector('svg');
    return svgEl ? svgEl.outerHTML : '';
  }

  addElement(tag: string, attributes: Record<string, string>): string {
    if (!this.doc || !this.doc.querySelector('svg')) {
      this.create(
        '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"></svg>',
      );
    }
    const svgEl = this.doc!.querySelector('svg')!;
    const el = this.doc!.createElementNS(SVG_NS, tag);

    const id = attributes.id || this.generateId();
    el.setAttribute('id', id);

    for (const [key, value] of Object.entries(attributes)) {
      if (key !== 'id') {
        el.setAttribute(key, value);
      }
    }

    svgEl.appendChild(el);
    this.emit('change', this.getSvg());
    return id;
  }

  updateElement(id: string, attributes: Record<string, string>): boolean {
    if (!this.doc) return false;
    const el = this.doc.getElementById(id);
    if (!el) return false;

    for (const [key, value] of Object.entries(attributes)) {
      if (value === '') {
        el.removeAttribute(key);
      } else {
        el.setAttribute(key, value);
      }
    }

    this.emit('change', this.getSvg());
    return true;
  }

  removeElement(id: string): boolean {
    if (!this.doc) return false;
    const el = this.doc.getElementById(id);
    if (!el) return false;
    el.parentNode?.removeChild(el);
    this.emit('change', this.getSvg());
    return true;
  }

  listElements(): SvgElementInfo[] {
    if (!this.doc) return [];
    const svgEl = this.doc.querySelector('svg');
    if (!svgEl) return [];

    const elements: SvgElementInfo[] = [];
    const children = svgEl.querySelectorAll('*');

    for (const child of children) {
      const attrs: Record<string, string> = {};
      if ((child as any).attributes) {
        for (const attr of (child as any).attributes) {
          attrs[attr.name] = attr.value;
        }
      }
      elements.push({
        id: (child as any).id || '',
        tag: child.tagName.toLowerCase(),
        attributes: attrs,
      });
    }

    return elements;
  }

  private generateId(): string {
    return `mcpsvg-${++this.idCounter}`;
  }

  private ensureIds(): void {
    if (!this.doc) return;
    const svgEl = this.doc.querySelector('svg');
    if (!svgEl) return;

    for (const child of svgEl.querySelectorAll('*')) {
      if (!(child as any).id) {
        (child as any).id = this.generateId();
      }
    }
  }
}
