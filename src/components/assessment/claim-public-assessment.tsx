"use client";
import { useEffect } from "react";
const STORAGE = "stheno_assessment_3.0.0";
export function ClaimPublicAssessment(){useEffect(()=>{const saved=localStorage.getItem(STORAGE);if(!saved)return;let cancelled=false;void fetch("/api/assessment/claim",{method:"POST",headers:{"content-type":"application/json"},body:saved}).then(async response=>{if(!response.ok||cancelled)return;await fetch("/api/plan",{method:"POST"});localStorage.setItem("stheno_assessment_claimed",new Date().toISOString());window.dispatchEvent(new Event("stheno:assessment-claimed"))});return()=>{cancelled=true}},[]);return null}
