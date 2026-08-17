import {describe,expect,it} from "vitest"; import {createBlueprint} from "./blueprint";
describe("createBlueprint",()=>{it("is deterministic and bounded",()=>{const i={goal:"muscle",experience:"new",days:3,weightKg:80,diet:"vegetarian"} as const;expect(createBlueprint(i)).toEqual(createBlueprint(i));expect(createBlueprint(i).nutrition.proteinGrams).toEqual([144,164]);});});
