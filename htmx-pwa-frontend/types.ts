type Action = "get" | "post" | "put" | "delete" | "patch";
type HtmlTag =
  | "div"
  | "p"
  | "main"
  | "section"
  | "header"
  | "footer"
  | "nav"
  | "article"
  | "aside"
  | "span"
  | "h1"
  | "h2"
  | "ul"
  | "li"
  | "a"
  | "button"
  | "input"
  | "form"
  | "label"
  | "table"
  | "thead"
  | "tbody"
  | "tr"
  | "td"
  | "th"
  | "img"
  | "canvas"
  | "svg";

export type Element =
  | {
    type: HtmlTag;
    behavior?: ElementBehavior;
    shape?: ElementShape;
  }
  | string;

export type ElementTree = Element | Element[];

export type ElementBehavior = {
  resource: { action: Action; url: string };
  /** A list of attributes in the form of 'attr=val' or 'attr' for boolean attributes.*/
  triggers?: string | string[];
  onTriggered?: (
    event: FetchEvent,
    storage: StorageContext
  ) => Promise<ElementTree | Response>;
};

export type ElementShape = {
  attrs?: string[];
  children?: ElementTree;
};

type StorageContext = {
  cache: Cache;
  idb: IDBDatabase;
  cookieStore: CookieStore;
};
