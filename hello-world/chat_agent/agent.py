from google.adk.agents import Agent
from google.adk.models.lite_llm import LiteLlm

from dotenv import load_dotenv
load_dotenv()

root_agent = Agent(
    name="chatai_agent",
    model=LiteLlm(model="openai/openai/gpt-oss-20b"),
    description=(
        "Agent to chat with."
    ),
    instruction=(
        "You are a helpful agent who can chat with the user."
    ),
    tools=[],
)