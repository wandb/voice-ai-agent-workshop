import os
from google.adk.agents import Agent
from google.adk.tools import google_search  # Import the tool
from google.adk.models.lite_llm import LiteLlm

from dotenv import load_dotenv
load_dotenv()

api_base_url = "https://api.inference.wandb.ai/v1"

model_name_at_endpoint = "openai/gpt-oss-20b"

api_key = os.environ.get("WANDB_API_KEY")


root_agent = Agent(
   # A unique name for the agent.
   name="google_search_agent",
   # The Large Language Model (LLM) that agent will use.
   # model="gemini-2.0-flash-exp", # if this model does not work, try below
   model=LiteLlm(
        model=model_name_at_endpoint,
        api_base=api_base_url,
        # Pass authentication headers if needed
      #   extra_headers=auth_headers
        # Alternatively, if endpoint uses an API key:
        api_key=api_key
    ),
   #model="gemini-2.0-flash-live-001",
   # A short description of the agent's purpose.
   description="Agent to answer questions using Google Search.",
   # Instructions to set the agent's behavior.
   instruction="Answer the question using the Google Search tool.",
   # Add google_search tool to perform grounding with Google search.
   tools=[]
)