# Model and cost verification

Verified October 21, 2026 against OpenAI's official `gpt-5.4-mini` model page, pricing page, image/vision guide, and image-cost calculator. The model supports image input in the Responses API. Official rates used: $0.75 per million input tokens and $4.50 per million output tokens. The official image calculator applies model-specific image-token conversion before the standard input rate.

Account access was proven by genuine Responses API calls. The previous reported candidate `gpt-6-luna` was not assumed or used. The production adapter default is now `gpt-5.4-mini`.

Successful four-frame call: 1,504 input tokens, 821 output tokens, calculated $0.0048225. Successful one-frame abstention: 844 input tokens, 358 output tokens, calculated $0.002244. Provider dashboard billing was not available during execution and may lag; calculated cost and conservative ledger are reported separately.

