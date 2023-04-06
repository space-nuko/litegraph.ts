import LGraphNode from "./LGraphNode"
import { MouseEventExt } from "./DragAndScale"

export interface IContextMenuItem {
    value?: any,
    content: string;
    callback?: ContextMenuEventListener;
    /** Used as innerHTML for extra child element */
    title?: string;
    disabled?: boolean;
    has_submenu?: boolean;
    submenu?: {
        options: ContextMenuItem[];
    } & IContextMenuOptions;
    className?: string;
}

export interface IContextMenuOptions {
    callback?: ContextMenuEventListener;
    ignore_item_callbacks?: Boolean;
    event?: MouseEventExt | CustomEvent;
    parentMenu?: ContextMenu;
    autoopen?: boolean;
    title?: string;
    extra?: any;
    node?: LGraphNode;
}

export type ContextMenuItem = IContextMenuItem | null;
export type ContextMenuEventListener = (
    value: ContextMenuItem,
    options: IContextMenuOptions,
    event: MouseEventExt,
    parentMenu: ContextMenu | undefined,
    node?: LGraphNode,
    callback?: (node: LGraphNode) => void,
) => boolean | void;

export default class ContextMenu {
    static trigger(
        element: HTMLElement,
        event_name: string,
        params: any,
        origin: any
    ): void;
    static isCursorOverElement(event: MouseEventExt, element: HTMLElement): void;
    static closeAllContextMenus(window: Window): void;
    constructor(values: ContextMenuItem[], options?: IContextMenuOptions, window?: Window);
    options: IContextMenuOptions;
    parentMenu?: ContextMenu;
    lock: boolean;
    current_submenu?: ContextMenu;
    addItem(
        name: string,
        value: ContextMenuItem,
        options?: IContextMenuOptions
    ): void;
    close(e?: MouseEventExt, ignore_parent_menu?: boolean): void;
    getTopMenu(): void;
    getFirstEvent(): MouseEventExt;
}
