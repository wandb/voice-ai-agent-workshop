# Hello World Google ADK + Weave Inference

Setup to run this repo:

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

Then, set the `.env` keys:

```text
OPENAI_API_BASE=https://api.inference.wandb.ai/v1
OPENAI_API_KEY="YOUR_WANDB_API_KEY"
```

Finally, run:

```bash
adk web
```

To bring up the locally hosted dev UI for Google ADK at `http://localhost:8000`.
