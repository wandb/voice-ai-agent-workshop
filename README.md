# Voice AI Agents Workshop

The application is composed of two parts - the `api` and the `ui`.

## `api` setup

Switch to the `api` directory. All commands below are to be run there.

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

This should get all the required packages set up. Now, let's set the environment.

Head to [Google AI Studio](https://aistudio.google.com/apikey) to get a Gemini API Key.

And grab a Weights and Biases key from https://wandb.ai/authorize.

Now, set the following in the `.env` file:

```text
GEMINI_API_KEY="YOUR_KEY_HERE"
GOOGLE_GENAI_USE_VERTEXAI=false
```

You should now be able to run the API endpoint locally by:

```bash
uvicorn main:app --reload
```

This should bring up the API at `http://localhost:8000`.

## `ui` setup

Now, switch to the `ui` directory from the project root in a new terminal tab/window.

```bash
pnpm i
```

This should be enough to install all the requirements. Now we can run it with 

```bash
pnpm dev
```

That should do the trick for launching the UI on your local browser at `http://localhost:3000`. 


