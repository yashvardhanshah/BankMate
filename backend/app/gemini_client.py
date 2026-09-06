#(s1-code)
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.gemini_tools import TOOLS
from app.tools import get_balance, get_transactions, freeze_card, unfreeze_card
load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

#(s2-code)
function_declarations = [
    types.FunctionDeclaration(
        name=tool["name"],
        description=tool["description"],
        parameters=tool["parameters"]
    )
    for tool in TOOLS
]

gemini_tools = types.Tool(function_declarations=function_declarations)

#defining available fuctions for line 50
AVAILABLE_FUNCTIONS = {
    "get_balance": get_balance,
    "get_transactions": get_transactions,
    "freeze_card": freeze_card,
    "unfreeze_card": unfreeze_card,
}

#(s3-code)
#round 1
def chat_with_gemini(user_message: str, db):
    config = types.GenerateContentConfig(tools=[gemini_tools])

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=user_message,
        config=config
    )
#round 2
    part = response.candidates[0].content.parts[0]

    if part.function_call:
        function_name = part.function_call.name
        function_args = part.function_call.args

        function_to_call = AVAILABLE_FUNCTIONS[function_name]
        function_result = function_to_call(db, **function_args)

        follow_up = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=[
                types.Content(role="user", parts=[types.Part(text=user_message)]),
                response.candidates[0].content,
                types.Content(
                    role="user",
                    parts=[types.Part(
                        function_response=types.FunctionResponse(
                            name=function_name,
                            response=function_result
                        )
                    )]
                )
            ],
            config=config
        )

        return follow_up.text

    return response.text