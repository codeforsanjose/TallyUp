type HtmlTag =
  | 'div'
  | 'p'
  | 'main'
  | 'section'
  | 'header'
  | 'footer'
  | 'nav'
  | 'article'
  | 'aside'
  | 'span'
  | 'h1'
  | 'h2'
  | 'ul'
  | 'li'
  | 'a'
  | 'button'
  | 'input'
  | 'form'
  | 'label'
  | 'table'
  | 'thead'
  | 'tbody'
  | 'tr'
  | 'td'
  | 'th'
  | 'img'
  | 'canvas'
  | 'svg';

type Queryable = string | number | boolean | null | undefined;

export type Action = 'get' | 'post' | 'put' | 'delete' | 'patch';

export type Element =
  | {
      type: HtmlTag;
      behavior?: ElementBehavior<Record<string, Queryable> | undefined>;
      shape?: ElementShape;
    }
  | string;

export type ElementTree = Element | Element[];

type HtmxData = Record<string, Queryable> | undefined;

export type ElementBehavior<T extends HtmxData = HtmxData, H extends HtmxData = HtmxData> = {
  resource: { action: Action; url: string };
  triggers?: string | string[];
  /** onTriggered is the response the service worker will return when the route is triggered. */
  onTriggered?: (event: FetchEvent) => Promise<ElementTree>;
  headers?: H extends undefined
    ? undefined
    : {
        [K in keyof H]: H[K] | (() => H[K]);
      };

  /** If no swap is specified, htmx will use 'innerHTML' by default. */
  swap?:
    | 'innerHTML'
    | 'outerHTML'
    | 'beforebegin'
    | 'afterbegin'
    | 'beforeend'
    | 'afterend'
    | 'delete'
    | 'none';

  target?: string;

  values?: T extends undefined
    ? undefined
    : {
        [K in keyof T]: T[K] | (() => T[K]);
      };
};

export type ElementShape = {
  /** A list of attributes in the form of 'attr=val' or 'attr' for boolean attributes.*/
  attrs?: string[];
  children?: ElementTree;
  id?: string;
};

export type Routes = Record<string, TriggerBehavior>;

export type TriggerBehavior = NonNullable<ElementBehavior['onTriggered']>;
