"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { capture } from "@/lib/analytics/client";
import { articleCaption, countHashtags } from "@/modules/social-studio/captions";
import { socialPlatforms, socialTemplates, type SocialPlatform, type SocialTemplate } from "@/modules/social-studio/config";

type Article = { slug:string;title:string;thesis:string;pillar:string;updatedAt:string };
const tabs=(Object.keys(socialPlatforms) as SocialPlatform[]);

export function SocialStudio({ article }: { article: Article }) {
  const [platform,setPlatform]=useState<SocialPlatform>("instagram_post"),[template,setTemplate]=useState<SocialTemplate>("editorial-hero"),[headline,setHeadline]=useState(article.title),[hook,setHook]=useState(article.title),[subheadline,setSubheadline]=useState(article.thesis),[caption,setCaption]=useState(articleCaption(article,"instagram_post")),[image,setImage]=useState(""),[focalX,setFocalX]=useState(50),[focalY,setFocalY]=useState(50),[includeUrl,setIncludeUrl]=useState(true),[message,setMessage]=useState("");
  useEffect(()=>capture("social_studio_opened",{article_id:article.slug,source_screen:"article_studio"}),[article.slug]);
  const assetUrl=useMemo(()=>{const q=new URLSearchParams({studio:"1",platform,template,headline,hook,subheadline,focalX:String(focalX),focalY:String(focalY),includeUrl:String(includeUrl)});if(image)q.set("image",image);return `/api/social/assets/${article.slug}?${q}`},[article.slug,platform,template,headline,hook,subheadline,image,focalX,focalY,includeUrl]);
  const link=`https://www.sthenofitness.com/insights/${article.slug}`,props={article_id:article.slug,platform,template,source_screen:"article_studio"};
  function selectPlatform(value:SocialPlatform){setPlatform(value);setCaption(articleCaption(article,value));capture("social_platform_selected",{...props,platform:value});setMessage("")}
  async function copy(value:string,event:"social_caption_copied"|"social_link_copied"){await navigator.clipboard.writeText(value);capture(event,props);setMessage(event==="social_caption_copied"?"Caption copied.":"Link copied.")}
  async function download(){const response=await fetch(assetUrl),blob=await response.blob(),url=URL.createObjectURL(blob),anchor=document.createElement("a");anchor.href=url;anchor.download=`${article.slug}-${platform}-${template}.png`;anchor.click();URL.revokeObjectURL(url);capture("social_asset_downloaded",props);setMessage("Image downloaded.")}
  async function nativeShare(){capture("social_native_share_started",props);const response=await fetch(assetUrl),blob=await response.blob(),file=new File([blob],`${article.slug}.png`,{type:"image/png"});try{if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({title:headline,text:caption,url:link,files:[file]});capture("social_native_share_completed",props);setMessage("Shared.")}else{await download();setMessage("Native file sharing is unavailable, so the image was downloaded.")}}catch{setMessage("Share cancelled. Your image and copy tools are still available.")}}
  const openPlatform=()=>{const base=socialPlatforms[platform].openUrl;if(!base)return;const target=platform==="x"?`${base}?${new URLSearchParams({text:caption})}`:platform==="linkedin"?`${base}?${new URLSearchParams({url:link})}`:platform==="facebook"?`${base}?${new URLSearchParams({u:link})}`:base;window.open(target,"_blank","noopener,noreferrer")};
  return <section className="social-studio">
    <header><p className="kicker">Article distribution</p><h1>Social Studio</h1><p>Create one polished asset, then share or download it without changing the article.</p></header>
    <div className="social-platform-tabs" role="tablist" aria-label="Social format">{tabs.map(key=><button role="tab" aria-selected={platform===key} key={key} onClick={()=>selectPlatform(key)}>{socialPlatforms[key].label}<small>{socialPlatforms[key].width}×{socialPlatforms[key].height}</small></button>)}</div>
    <div className="social-studio-layout">
      <div className="social-preview"><div style={{aspectRatio:`${socialPlatforms[platform].width}/${socialPlatforms[platform].height}`}}><Image key={assetUrl} src={assetUrl} alt={`${socialPlatforms[platform].label} preview for ${article.title}`} fill unoptimized sizes="(max-width: 800px) 100vw, 50vw" onLoad={()=>capture("social_asset_generated",props)}/></div><span>Export uses this exact server-rendered composition.</span></div>
      <div className="social-controls">
        <label>Template<select value={template} onChange={e=>setTemplate(e.target.value as SocialTemplate)}>{socialTemplates.map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
        <label>Headline<input value={headline} maxLength={140} onChange={e=>setHeadline(e.target.value)}/></label>
        <label>Hook<input value={hook} maxLength={140} onChange={e=>setHook(e.target.value)}/></label>
        <label>Subheadline<textarea value={subheadline} maxLength={240} rows={3} onChange={e=>setSubheadline(e.target.value)}/></label>
        <label>Featured or alternate image URL<input type="url" placeholder="https://… (optional)" value={image} onChange={e=>setImage(e.target.value)}/><small>HTTPS images only. Leave blank for the branded STHENO fallback.</small></label>
        <div className="focal-controls"><label>Horizontal focal point<input type="range" min="0" max="100" value={focalX} onChange={e=>setFocalX(Number(e.target.value))}/></label><label>Vertical focal point<input type="range" min="0" max="100" value={focalY} onChange={e=>setFocalY(Number(e.target.value))}/></label></div>
        <label className="social-check"><input type="checkbox" checked={includeUrl} onChange={e=>setIncludeUrl(e.target.checked)}/> Include STHENOFITNESS.COM on graphic</label>
        <label>Editable caption<textarea value={caption} rows={8} onChange={e=>setCaption(e.target.value)}/><small>{platform.startsWith("instagram")?`${countHashtags(caption)}/3 hashtags — Instagram requires exactly 3.`:"Platform-specific copy; edit before sharing."}</small></label>
        <div className="social-actions"><button className="button" type="button" onClick={()=>void nativeShare()}>Share</button><button type="button" onClick={()=>void download()}>Download image</button><button type="button" onClick={()=>void copy(caption,"social_caption_copied")}>Copy caption</button><button type="button" onClick={()=>void copy(link,"social_link_copied")}>Copy link</button><button type="button" disabled={!socialPlatforms[platform].openUrl} onClick={openPlatform}>Open platform</button></div>
        <p className="social-message" role="status">{message}</p>
      </div>
    </div>
  </section>;
}
