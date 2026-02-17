type Nullable<T> = T | null;
type Maybe<T> = T | null | undefined;
type NullableArray<T> = T[] | null;
type MaybeArray<T> = T[] | null | undefined;
type NullableString = string | null;
type MaybeString = string | null | undefined;
type NullableNumber = number | null;
type MaybeNumber = number | null | undefined;
type NullableBoolean = boolean | null;
type MaybeBoolean = boolean | null | undefined;
type NullableObject<T> = T | null;
type MaybeObject<T> = T | null | undefined;
type NullableFunction<T> = T | null;
type MaybeFunction<T> = T | null | undefined;
type Hintable<S> = S | (string & {});
type HintableArray<S> = S[] | (string & {})[];
type HintableObject<S, V = any> = S & {
    [key: string]: V;
};
type ValuesOf<T> = T[keyof T];
type KeysOf<T> = Extract<keyof T, string>;
type ValuesOfUnion<T> = T extends (infer U)[] ? U : never;
type ValuesOfIntersection<T> = T extends infer U & infer V ? U & V : never;
type ValuesOfTuple<T> = T extends (infer U)[] ? U : never;
type ValuesOfObject<T> = T extends infer U & {} ? U : never;
type ValuesOfRecord<T> = T extends infer U & Record<string, any> ? U : never;
type ValuesOfMap<T> = T extends Map<infer K, infer V> ? V : never;
type ValuesOfSet<T> = T extends Set<infer U> ? U : never;
type ValuesOfPromise<T> = T extends Promise<infer U> ? U : never;
type ValuesOfFunction<T> = T extends (...args: any[]) => infer U ? U : never;
type ValuesOfClass<T> = T extends new (...args: any[]) => infer U ? U : never;
type RecordOf<T, V> = {
    [K in keyof T]: V;
};
type StringRecord = Record<string, string>;
type NumberRecord = Record<string, number>;
type BooleanRecord = Record<string, boolean>;
type ObjectRecord = Record<string, object>;
type FunctionRecord = Record<string, Function>;
type Class<T = any, Args extends any[] = any[]> = new (...args: Args) => T;
type AbstractClass<T = any, Args extends any[] = any[]> = abstract new (...args: Args) => T;
type AnyClass<T = any> = Class<T> | AbstractClass<T>;
type ClassRecord<T = any> = Record<string, AnyClass<T>>;
type InstanceRecord<T = any> = Record<string, T>;
interface ClassWithConfig<T = any> {
    class: AnyClass<T>;
    config?: {
        singleton?: boolean;
        scope?: 'REQUEST' | 'TRANSIENT' | 'DEFAULT';
        dependencies?: AnyClass[];
    };
}
type ClassConfigRecord = Record<string, ClassWithConfig>;
type ProviderClass = Class<any>;
type ProviderRecord = Record<string, ProviderClass>;
interface ModuleClass<T = any> {
    new (...args: any[]): T;
    $inject?: string[];
}
type ModuleRecord = Record<string, ModuleClass>;
type Unit = 'Years' | 'Year' | 'Yrs' | 'Yr' | 'Y' | 'Weeks' | 'Week' | 'W' | 'Days' | 'Day' | 'D' | 'Hours' | 'Hour' | 'Hrs' | 'Hr' | 'H' | 'Minutes' | 'Minute' | 'Mins' | 'Min' | 'M' | 'Seconds' | 'Second' | 'Secs' | 'Sec' | 's' | 'Milliseconds' | 'Millisecond' | 'Msecs' | 'Msec' | 'Ms';
type TimeUnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;
type TimeUnitString = `${number}` | `${number}${TimeUnitAnyCase}` | `${number} ${TimeUnitAnyCase}`;
type TimeUnit = number | TimeUnitString;

declare const ADMIN_USER_ID = "000000000000000000000000";

declare const ROLES: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly DEV_ADMIN: "DEV_ADMIN";
    readonly OPS_ADMIN: "OPS_ADMIN";
    readonly CONTENT_ADMIN: "CONTENT_ADMIN";
    readonly OPERATOR: "OPERATOR";
    readonly VIP_USER: "VIP_USER";
    readonly NORMAL_USER: "NORMAL_USER";
    readonly GUEST: "GUEST";
};
type RoleCode = typeof ROLES[keyof typeof ROLES];
declare const ROLE_METADATA: {
    readonly SUPER_ADMIN: {
        readonly label: "超级管理员";
        readonly description: "系统最高权限";
        readonly color: "#ff4d4f";
        readonly level: 0;
    };
    readonly DEV_ADMIN: {
        readonly label: "开发管理员";
        readonly description: "负责系统开发";
        readonly color: "#1890ff";
        readonly level: 1;
    };
    readonly OPS_ADMIN: {
        readonly label: "运维管理员";
        readonly description: "负责数据运维";
        readonly color: "#52c41a";
        readonly level: 1;
    };
    readonly CONTENT_ADMIN: {
        readonly label: "内容主管";
        readonly description: "负责内容策略";
        readonly color: "#faad14";
        readonly level: 1;
    };
    readonly OPERATOR: {
        readonly label: "运营专员";
        readonly description: "日常运营操作";
        readonly color: "#722ed1";
        readonly level: 2;
    };
    readonly VIP_USER: {
        readonly label: "VIP用户";
        readonly description: "高级会员";
        readonly color: "#eb2f96";
        readonly level: 10;
    };
    readonly NORMAL_USER: {
        readonly label: "普通用户";
        readonly description: "注册用户";
        readonly color: "#666666";
        readonly level: 11;
    };
    readonly GUEST: {
        readonly label: "游客";
        readonly description: "未登录用户";
        readonly color: "#bfbfbf";
        readonly level: 12;
    };
};

declare const sleep: (ms: number) => Promise<unknown>;

export { ADMIN_USER_ID, ROLES, ROLE_METADATA, sleep };
export type { AbstractClass, AnyClass, BooleanRecord, Class, ClassConfigRecord, ClassRecord, ClassWithConfig, FunctionRecord, Hintable, HintableArray, HintableObject, InstanceRecord, KeysOf, Maybe, MaybeArray, MaybeBoolean, MaybeFunction, MaybeNumber, MaybeObject, MaybeString, ModuleClass, ModuleRecord, Nullable, NullableArray, NullableBoolean, NullableFunction, NullableNumber, NullableObject, NullableString, NumberRecord, ObjectRecord, ProviderClass, ProviderRecord, RecordOf, RoleCode, StringRecord, TimeUnit, TimeUnitAnyCase, TimeUnitString, ValuesOf, ValuesOfClass, ValuesOfFunction, ValuesOfIntersection, ValuesOfMap, ValuesOfObject, ValuesOfPromise, ValuesOfRecord, ValuesOfSet, ValuesOfTuple, ValuesOfUnion };
