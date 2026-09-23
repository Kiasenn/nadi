import asyncio
import backend.server as s

async def main():
    print(await s.db.command("ping"))
    s.client.close()

asyncio.run(main())
