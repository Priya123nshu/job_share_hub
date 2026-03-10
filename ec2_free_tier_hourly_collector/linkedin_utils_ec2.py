import json
import os
import sys
from typing import List

from mcp import ClientSession, StdioServerParameters


def _load_env_file(env_file: str) -> dict[str, str]:
    env_vars: dict[str, str] = {}
    try:
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, value = line.split("=", 1)
                    env_vars[key] = value
    except FileNotFoundError:
        print(f"Warning: env file not found at {env_file}")
    return env_vars


def get_server_parameters() -> StdioServerParameters:
    env_file = os.getenv("ENV_FILE", ".env")
    env_vars = _load_env_file(env_file)

    server_env = os.environ.copy()
    if "LINKEDIN_COOKIE" in env_vars and not server_env.get("LINKEDIN_COOKIE"):
        server_env["LINKEDIN_COOKIE"] = env_vars["LINKEDIN_COOKIE"]

    server_python = os.getenv("MCP_SERVER_PYTHON", sys.executable)
    server_module = os.getenv("MCP_SERVER_MODULE", "linkedin_mcp_server")

    return StdioServerParameters(
        command=server_python,
        args=["-m", server_module],
        env=server_env,
    )


async def search_jobs(
    session: ClientSession,
    keywords: str,
    limit: int = 10,
    location: str = "remote",
    time_posted: str | None = None,
) -> List[str]:
    print(f"Searching for: '{keywords}'...")
    try:
        args = {
            "keywords": keywords,
            "limit": limit,
            "location": location,
        }
        if time_posted:
            args["time_posted"] = time_posted

        result = await session.call_tool("search_jobs", arguments=args)

        job_urls: List[str] = []
        for content in result.content:
            if content.type != "text":
                continue
            try:
                data = json.loads(content.text)
                job_urls.extend(data.get("job_urls", []))
            except json.JSONDecodeError:
                continue

        return job_urls
    except Exception as e:
        print(f"Error searching for '{keywords}': {e}")
        return []
