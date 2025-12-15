import { Fragment, JsonFragment } from "./fragments";

// Fragment Chưa hoàn thiện => danh cho các Library / framework / core infra
export type InterfaceAbi = string | ReadonlyArray<Fragment | JsonFragment | string>;
