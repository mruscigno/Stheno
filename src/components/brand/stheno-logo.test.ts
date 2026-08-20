// @vitest-environment node
import {describe,expect,it} from "vitest";
import {readdirSync,readFileSync,statSync} from "node:fs";
import path from "node:path";
function sourceFiles(directory:string):string[]{return readdirSync(directory).flatMap(name=>{const file=path.join(directory,name);return statSync(file).isDirectory()?sourceFiles(file):/\.(tsx?|jsx?)$/.test(name)?[file]:[]})}
describe("canonical logo governance",()=>{
  it("prevents deprecated raster logos from returning to production UI",()=>{
    const offenders=sourceFiles(path.join(process.cwd(),"src")).filter(file=>/stheno-(?:logo-horizontal|mark|logo)\.png/.test(readFileSync(file,"utf8")));
    expect(offenders).toEqual([]);
  });
});
