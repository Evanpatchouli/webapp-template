import "./index.css";
interface LoadingProps<T> {
    on?: boolean;
    /** default is `"blue"` */
    theme?: "dark" | "gray" | "blue" | "yellow" | "green" | "purple" | "red";
    /** 16 bit color, will override theme */
    color?: T extends `#${infer U}` ? U : never;
    disableHeartBit?: boolean;
}
export default function Loading<T>({ on, theme, color, disableHeartBit }: LoadingProps<T>): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=index.d.ts.map