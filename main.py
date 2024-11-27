import os
from datetime import datetime

import discord
from discord import app_commands
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Environment variables
class Env:
    OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4-mini')
    DISCORD_BOT_TOKEN = os.getenv('DISCORD_BOT_TOKEN')
    DISCORD_CLIENT_ID = os.getenv('DISCORD_CLIENT_ID')
    DISCORD_USER_ID_WHITELIST = os.getenv('DISCORD_USER_ID_WHITELIST')
    MODEL_SYSTEM_PROMPT = os.getenv(
        'MODEL_SYSTEM_PROMPT',
        f'Respond concisely. Promote positive values. It is currently {datetime.now()}.'
    )

MESSAGE_CONTEXT_LENGTH = 5

# Initialize OpenAI client
openai = OpenAI()

intents = discord.Intents(
    guilds=True,
    guild_messages=True,
    message_content=True,
    dm_messages=True
)
client = discord.Client(intents=intents)
tree = app_commands.CommandTree(client)

def check_user_id_whitelist(user_id: str) -> bool:
    return (
        user_id == Env.DISCORD_CLIENT_ID
        or not Env.DISCORD_USER_ID_WHITELIST
        or user_id in (Env.DISCORD_USER_ID_WHITELIST or "").split(",")
    )

@client.event
async def on_ready():
    await tree.sync()
    print(f"✨ Ready! Logged in as {client.user}")

@client.event
async def on_message(message):
    if (not check_user_id_whitelist(str(message.author.id))):
        return

    if (
        not message.author
        or message.author.bot
        or (isinstance(message.channel, discord.Thread)
            and message.channel.owner_id != int(Env.DISCORD_CLIENT_ID))
        or (not isinstance(message.channel, discord.Thread)
            and not isinstance(message.channel, discord.DMChannel))
    ):
        return

    async with message.channel.typing():
        # Format messages for OpenAI
        formatted_messages = [
            {"role": "system", "content": Env.MODEL_SYSTEM_PROMPT}
        ]

        async for msg in message.channel.history(limit=MESSAGE_CONTEXT_LENGTH):
            if check_user_id_whitelist(str(msg.author.id)):
                if msg.author.id == int(Env.DISCORD_CLIENT_ID):
                    formatted_messages.insert(1, {
                        "role": "assistant",
                        "content": msg.content
                    })
                else:
                    formatted_messages.insert(1, {
                        "role": "user",
                        "content": msg.content,
                        "name": msg.author.name
                    })

        # Get OpenAI response
        response = openai.chat.completions.create(
            model=Env.OPENAI_MODEL,
            messages=formatted_messages
        )
        result = response.choices[0].message.content

        await message.channel.send(result)

@tree.command(name="ping", description="Ping the bot")
async def ping(interaction: discord.Interaction):
    await interaction.response.send_message('Pong!')

@tree.command(name="thread", description="Start a new chat thread")
async def start(interaction: discord.Interaction):
    if not check_user_id_whitelist(str(interaction.user.id)):
        await interaction.response.send_message(
            "You do not have permissions to use this command.",
            ephemeral=True
        )
        return

    # Create the thread using the interaction response
    thread = await interaction.channel.create_thread(
        name="AI Chatbot Thread",
        auto_archive_duration=1440  # 24 hours
    )

    # Send the initial message in the interaction response
    await interaction.response.send_message(
        "I've created a new thread for us. Let's talk in there.",
        ephemeral=True
    )

    # Send the welcome message in the thread
    await thread.send("Hello, how can I help you today?")

if __name__ == "__main__":
    client.run(Env.DISCORD_BOT_TOKEN)
