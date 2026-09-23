from dotenv import load_dotenv
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

async def main():
    client = AsyncIOMotorClient(
        os.environ["MONGO_URL"],
        serverSelectionTimeoutMS=10000
    )
    print(await client.admin.command("ping"))
    client.close()

asyncio.run(main())
