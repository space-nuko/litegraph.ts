export interface IPropertyInfo {
    type?: string;
    values?: any | any[];
    label?: string;
}

export default interface IProperty {
    name: string;
    type: string;
    default_value: any;
}
