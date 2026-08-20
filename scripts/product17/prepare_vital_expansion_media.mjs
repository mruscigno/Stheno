import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const ROOT=process.cwd(),providerRoot=path.resolve(process.argv[2]??path.join(ROOT,"..","work","vital-animations"));
const records=JSON.parse(await readFile(path.join(ROOT,"content/exercises/vital-provider-expansion.json"),"utf8"));
const manifestPath=path.join(ROOT,"src/modules/exercise-media/vital-manifest.json");
const manifest=JSON.parse(await readFile(manifestPath,"utf8"));
const videoDir=path.join(ROOT,"public/exercise-media/vital/videos"),posterDir=path.join(ROOT,"public/exercise-media/vital/posters");await mkdir(videoDir,{recursive:true});await mkdir(posterDir,{recursive:true});
const ffmpeg=(args)=>new Promise((resolve,reject)=>{const child=spawn(ffmpegPath,["-hide_banner","-loglevel","error","-y",...args],{stdio:["ignore","ignore","pipe"]});let err="";child.stderr.on("data",c=>err+=c);child.on("close",code=>code===0?resolve():reject(new Error(err||`ffmpeg ${code}`)))});
async function prepare(row){const input=path.join(providerRoot,row.provider.sourcePath),video=path.join(videoDir,`${row.slug}.mp4`),poster=path.join(posterDir,`${row.slug}.webp`);await ffmpeg(["-i",input,"-an","-vf","scale=360:480:force_original_aspect_ratio=decrease,pad=360:480:(ow-iw)/2:(oh-ih)/2:color=white,fps=20","-c:v","libx264","-profile:v","main","-level","3.1","-preset","medium","-crf","29","-movflags","+faststart","-pix_fmt","yuv420p",video]);await ffmpeg(["-ss","1","-i",video,"-frames:v","1","-c:v","libwebp","-quality","82",poster]);const bytes=await readFile(video);row.media={videoPath:`/exercise-media/vital/videos/${row.slug}.mp4`,posterPath:`/exercise-media/vital/posters/${row.slug}.webp`,checksum:createHash("sha256").update(bytes).digest("hex"),bytes:(await stat(video)).size,posterBytes:(await stat(poster)).size,codec:"H.264",dimensions:"360x480",durationSeconds:6};manifest[row.slug]={kind:"provider_animation",videoPath:row.media.videoPath,posterPath:row.media.posterPath,provider:"Vital Animations",providerExerciseId:row.provider.key};}
for(let i=0;i<records.length;i+=6){await Promise.all(records.slice(i,i+6).map(prepare));console.log(`Prepared ${Math.min(i+6,records.length)}/${records.length}`)}
await writeFile(path.join(ROOT,"content/exercises/vital-provider-expansion.json"),JSON.stringify(records,null,2)+"\n");await writeFile(manifestPath,JSON.stringify(manifest,null,2)+"\n");
console.log(JSON.stringify({prepared:records.length,runtimeManifest:Object.keys(manifest).length},null,2));
