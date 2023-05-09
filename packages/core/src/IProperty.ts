export interface IPropertyInfo {
    type?: string;
    values?: any | any[];
    label?: string;
    widget?: string;
    multiline?: boolean;
    font?: string;
}

export default interface IProperty {
    name: string;
    type: string;
    default_value: any;
    values?: any | any[];
}
