# Model capability and price verification

Provider: OpenAI Responses API. Configured default model: `gpt-6-luna`. OpenAI's official model documentation confirms image input support; official pricing reviewed October 21, 2026 lists $0.10 per million input tokens and $0.50 per million output tokens for this model. Multiple image inputs are billable.

The adapter uses structured output, low-detail images, low reasoning effort, and an 1,800 output-token ceiling. No real inference request ran in this sprint because incremental OpenAI spend is not approved. Therefore measured provider cost is $0.00 and production inference remains closed.

