import { Body, Eyebrow, Notice, Title } from "./Primitives";
import { Screen } from "./Screen";
import { SthenoLogo } from "./SthenoLogo";
export function Placeholder({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) { return <Screen><SthenoLogo /><Eyebrow>{eyebrow}</Eyebrow><Title>{title}</Title><Body muted>{body}</Body><Notice>This is an honest App 2 navigation placeholder, not completed product functionality.</Notice></Screen>; }
