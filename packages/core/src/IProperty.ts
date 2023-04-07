export interface IPropertyInfo {
    type?: string;
    values?: any | any[];
    label?: string;
    widget?: string;
}

export default interface IProperty {
    name: string;
    type: string;
    default_value: any;
}
