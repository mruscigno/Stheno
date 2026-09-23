import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/navigation",()=>({useRouter:()=>({push:vi.fn()})}));
vi.mock("@/lib/analytics/client",()=>({capture:vi.fn()}));
const captureFunnel=vi.fn(async(..._args:unknown[])=>({accepted:true,status:200,event:"assessment_loaded"}));
vi.mock("@/lib/analytics/funnel-client",()=>({captureFunnel:(...args:unknown[])=>captureFunnel(...args)}));
import { FreeAssessment } from "./free-assessment";

describe("free assessment progression",()=>{
  beforeEach(()=>{localStorage.clear();sessionStorage.clear();captureFunnel.mockClear();});
  afterEach(cleanup);

  it("explains an invalid Continue activation instead of silently ignoring it",async()=>{
    render(<FreeAssessment/>);
    const button=await screen.findByRole("button",{name:"Continue →"});
    expect(button).toHaveAttribute("data-valid","false");
    fireEvent.click(button);
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose an answer before continuing.");
    expect(captureFunnel).toHaveBeenCalledWith("assessment_validation_error",expect.objectContaining({question_number:1,error_type:"required_answer_missing"}));
  });

  it("accepts one valid transition and guards a rapid duplicate",async()=>{
    render(<FreeAssessment/>);
    fireEvent.click(await screen.findByRole("button",{name:/Build strength/}));
    const button=screen.getByRole("button",{name:"Continue →"});
    fireEvent.click(button);fireEvent.click(button);
    await waitFor(()=>expect(screen.getByText("Question 2")).toBeInTheDocument());
    expect(screen.queryByText("Question 3")).not.toBeInTheDocument();
  });
});
